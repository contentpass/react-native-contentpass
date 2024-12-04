import uuid from 'react-native-uuid';
import OidcAuthStateStorage, {
  type OidcAuthState,
} from './OidcAuthStateStorage';
import {
  type ContentpassState,
  ContentpassStateType,
} from './types/ContentpassState';
import {
  authorize,
  type AuthorizeResult,
  refresh,
} from 'react-native-app-auth';
import { REFRESH_TOKEN_RETRIES, SCOPES } from './consts/oidcConsts';
import { RefreshTokenStrategy } from './types/RefreshTokenStrategy';
import fetchContentpassToken from './contentpassTokenUtils/fetchContentpassToken';
import validateSubscription from './contentpassTokenUtils/validateSubscription';
import type { ContentpassConfig } from './types/ContentpassConfig';
import { reportError, setSentryExtraAttribute } from './sentryIntegration';
import sendStats from './countImpressionUtils/sendStats';
import sendPageViewEvent from './countImpressionUtils/sendPageViewEvent';

const DEFAULT_SAMPLING_RATE = 0.05;

export type ContentpassObserver = (state: ContentpassState) => void;

interface ContentpassInterface {
  authenticate: () => Promise<void>;
  registerObserver: (observer: ContentpassObserver) => void;
  unregisterObserver: (observer: ContentpassObserver) => void;
  logout: () => Promise<void>;
  recoverFromError: () => Promise<void>;
  countImpression: () => Promise<void>;
}

export default class Contentpass implements ContentpassInterface {
  private authStateStorage: OidcAuthStateStorage;
  private readonly config: ContentpassConfig;
  private readonly samplingRate: number;
  private readonly instanceId: string;

  private contentpassState: ContentpassState = {
    state: ContentpassStateType.INITIALISING,
  };
  private contentpassStateObservers: ContentpassObserver[] = [];
  private oidcAuthState: OidcAuthState | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: ContentpassConfig) {
    if (
      config.samplingRate &&
      (config.samplingRate < 0 || config.samplingRate > 1)
    ) {
      throw new Error('Sampling rate must be between 0 and 1');
    }
    this.samplingRate = config.samplingRate || DEFAULT_SAMPLING_RATE;
    this.instanceId = uuid.v4();
    this.authStateStorage = new OidcAuthStateStorage(config.propertyId);
    this.config = config;
    setSentryExtraAttribute('propertyId', config.propertyId);
    this.initialiseAuthState();
  }

  public authenticate = async (): Promise<void> => {
    let result: AuthorizeResult;

    try {
      result = await authorize({
        clientId: this.config.propertyId,
        redirectUrl: this.config.redirectUrl,
        issuer: this.config.issuer,
        scopes: SCOPES,
        additionalParameters: {
          cp_route: 'login',
          prompt: 'consent',
          cp_property: this.config.propertyId,
          cp_plan: this.config.planId,
        },
      });
    } catch (err: any) {
      reportError(err, { msg: 'Failed to authorize' });
      this.changeContentpassState({
        state: ContentpassStateType.ERROR,
        error: err,
      });

      throw err;
    }

    await this.onNewAuthState(result);
  };

  public registerObserver(observer: ContentpassObserver) {
    if (this.contentpassStateObservers.includes(observer)) {
      return;
    }

    observer(this.contentpassState);
    this.contentpassStateObservers.push(observer);
  }

  public unregisterObserver(observer: ContentpassObserver) {
    this.contentpassStateObservers = this.contentpassStateObservers.filter(
      (o) => o !== observer
    );
  }

  public logout = async () => {
    await this.authStateStorage.clearOidcAuthState();
    this.changeContentpassState({
      state: ContentpassStateType.UNAUTHENTICATED,
      hasValidSubscription: false,
    });
  };

  public recoverFromError = async () => {
    this.changeContentpassState({
      state: ContentpassStateType.INITIALISING,
    });

    await this.initialiseAuthState();
  };

  public countImpression = async () => {
    if (this.hasValidSubscriptionAndAccessToken()) {
      try {
        await this.countPaidImpression();
      } catch (err: any) {
        reportError(err, { msg: 'Failed to count paid impression' });
      }
    }

    try {
      await this.countSampledImpression();
    } catch (err: any) {
      reportError(err, { msg: 'Failed to count sampled impression' });
    }
  };

  private countPaidImpression = async () => {
    const impressionId = uuid.v4();

    await sendPageViewEvent(this.config.apiUrl, {
      propertyId: this.config.propertyId,
      impressionId,
      accessToken: this.oidcAuthState!.accessToken,
    });
  };

  private countSampledImpression = async () => {
    const generatedSample = Math.random();
    const publicId = this.config.propertyId.slice(0, 8);

    if (generatedSample >= this.samplingRate) {
      return;
    }

    await sendStats(this.config.apiUrl, {
      ea: 'load',
      ec: 'tcf-sampled',
      cpabid: this.instanceId,
      cppid: publicId,
      cpsr: this.samplingRate,
    });
  };

  private initialiseAuthState = async () => {
    const authState = await this.authStateStorage.getOidcAuthState();
    if (authState) {
      await this.onNewAuthState(authState);
      return;
    }

    this.changeContentpassState({
      state: ContentpassStateType.UNAUTHENTICATED,
      hasValidSubscription: false,
    });
  };

  private onNewAuthState = async (authState: OidcAuthState) => {
    this.oidcAuthState = authState;
    await this.authStateStorage.storeOidcAuthState(authState);

    const strategy = this.setupRefreshTimer();
    // if instant refresh, no need to check subscription as it will happen in the refresh
    if (strategy === RefreshTokenStrategy.INSTANTLY) {
      return;
    }

    try {
      const contentpassToken = await fetchContentpassToken({
        issuer: this.config.issuer,
        propertyId: this.config.propertyId,
        idToken: this.oidcAuthState.idToken,
      });
      const hasValidSubscription = validateSubscription(contentpassToken);
      this.changeContentpassState({
        state: ContentpassStateType.AUTHENTICATED,
        hasValidSubscription,
      });
    } catch (err: any) {
      this.changeContentpassState({
        state: ContentpassStateType.ERROR,
        error: err,
      });
    }
  };

  private setupRefreshTimer = (): RefreshTokenStrategy => {
    const accessTokenExpirationDate =
      this.oidcAuthState?.accessTokenExpirationDate;

    if (!accessTokenExpirationDate) {
      return RefreshTokenStrategy.NO_REFRESH;
    }

    const now = new Date();
    const expirationDate = new Date(accessTokenExpirationDate);
    const timeDiff = expirationDate.getTime() - now.getTime();
    if (timeDiff <= 0) {
      this.refreshToken(0);
      return RefreshTokenStrategy.INSTANTLY;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(async () => {
      await this.refreshToken(0);
    }, timeDiff);

    return RefreshTokenStrategy.TIMER_SET;
  };

  private refreshToken = async (counter: number) => {
    if (!this.oidcAuthState?.refreshToken) {
      reportError(new Error('No Refresh Token in oidcAuthState provided'));
      return;
    }

    try {
      const refreshResult = await refresh(
        {
          clientId: this.config.propertyId,
          redirectUrl: this.config.redirectUrl,
          issuer: this.config.issuer,
          scopes: SCOPES,
        },
        {
          refreshToken: this.oidcAuthState.refreshToken,
        }
      );
      await this.onNewAuthState(refreshResult);
    } catch (err: any) {
      await this.onRefreshTokenError(counter, err);
    }
  };

  private onRefreshTokenError = async (counter: number, err: Error) => {
    reportError(err, {
      msg: `Failed to refresh token after ${counter} retries`,
    });
    // FIXME: add handling for specific error to not retry in every case
    if (counter < REFRESH_TOKEN_RETRIES) {
      const delay = counter * 1000 * 10;
      await new Promise((resolve) => setTimeout(resolve, delay));
      await this.refreshToken(counter + 1);
      return;
    }

    await this.logout();
  };

  private changeContentpassState = (state: ContentpassState) => {
    this.contentpassState = state;
    this.contentpassStateObservers.forEach((observer) => observer(state));
  };

  private hasValidSubscriptionAndAccessToken = () => {
    return (
      this.contentpassState.state === ContentpassStateType.AUTHENTICATED &&
      this.contentpassState.hasValidSubscription &&
      this.oidcAuthState?.accessToken
    );
  };
}
