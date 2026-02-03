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
import { initSentry, reportError } from './sentryIntegration';
import sendStats from './countImpressionUtils/sendStats';
import sendPageViewEvent from './countImpressionUtils/sendPageViewEvent';
import logger, { enableLogger } from './logger';

const DEFAULT_SAMPLING_RATE = 0.05;

export type ContentpassObserver = (state: ContentpassState) => void;

interface ContentpassInterface {
  authenticate: (route?: 'login' | 'signup') => Promise<void>;
  countImpression: () => Promise<void>;
  event: (
    eventCategory: string,
    eventAction: string,
    eventLabel?: string,
    samplingRate?: number
  ) => Promise<void>;
  logout: () => Promise<void>;
  registerObserver: (observer: ContentpassObserver) => void;
  recoverFromError: () => Promise<void>;
  unregisterObserver: (observer: ContentpassObserver) => void;
}

export default class Contentpass implements ContentpassInterface {
  private authStateStorage: OidcAuthStateStorage;
  private readonly config: ContentpassConfig;
  private readonly samplingRate: number;
  private instanceId: string;

  private contentpassState: ContentpassState = {
    state: ContentpassStateType.INITIALISING,
  };
  private contentpassStateObservers: ContentpassObserver[] = [];
  private oidcAuthState: OidcAuthState | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: ContentpassConfig) {
    if (config.logLevel) {
      enableLogger(config.logLevel);
    }

    this.config = config;
    this.instanceId = uuid.v4();
    logger.debug('Contentpass initialised with config', config);
    if (
      config.samplingRate &&
      (config.samplingRate < 0 || config.samplingRate > 1)
    ) {
      logger.error('Sampling rate must be between 0 and 1');
      throw new Error('Sampling rate must be between 0 and 1');
    }
    this.samplingRate = config.samplingRate || DEFAULT_SAMPLING_RATE;
    this.authStateStorage = new OidcAuthStateStorage(config.propertyId);
    initSentry({ propertyId: config.propertyId });
    this.initialiseAuthState();
  }

  public authenticate = async (route?: 'login' | 'signup'): Promise<void> => {
    logger.info('Starting authentication flow');
    let result: AuthorizeResult;

    try {
      result = await authorize({
        clientId: this.config.propertyId,
        redirectUrl: this.config.redirectUrl,
        issuer: this.config.issuer,
        scopes: SCOPES,
        additionalParameters: {
          cp_route: route || 'login',
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
    logger.info('Authentication flow finished, checking subscription...');

    await this.onNewAuthState(result);
  };

  public event = async (
    eventCategory: string,
    eventAction: string,
    eventLabel?: string,
    samplingRate?: number
  ) => {
    const generatedSample = Math.random();
    const activeSamplingRate = samplingRate ?? this.samplingRate;
    if (generatedSample >= activeSamplingRate) {
      return;
    }

    logger.info('Sending event', {
      eventCategory,
      eventAction,
      eventLabel,
      samplingRate: activeSamplingRate,
    });

    const publicId = this.config.propertyId.slice(0, 8);

    const payload = {
      ea: eventAction,
      ec: eventCategory,
      el: eventLabel,
      cpabid: this.instanceId,
      cppid: publicId,
      cpsr: activeSamplingRate,
    };

    try {
      await sendStats(this.config.apiUrl, payload);
    } catch (err: any) {
      reportError(err, { msg: 'Failed to send event' });
    }
  };

  public registerObserver(observer: ContentpassObserver) {
    logger.info('Registering observer');
    if (this.contentpassStateObservers.includes(observer)) {
      return;
    }

    observer(this.contentpassState);
    this.contentpassStateObservers.push(observer);
  }

  public unregisterObserver(observer: ContentpassObserver) {
    logger.info('Unregistering observer');
    this.contentpassStateObservers = this.contentpassStateObservers.filter(
      (o) => o !== observer
    );
  }

  public logout = async () => {
    logger.info('Logging out and clearing auth state');
    await this.authStateStorage.clearOidcAuthState();
    this.changeContentpassState({
      state: ContentpassStateType.UNAUTHENTICATED,
      hasValidSubscription: false,
    });
  };

  public recoverFromError = async () => {
    logger.info('Recovering from error');
    this.changeContentpassState({
      state: ContentpassStateType.INITIALISING,
    });

    await this.initialiseAuthState();
  };

  public countImpression = async () => {
    // Generate a new impression id to be used per impression
    // This mimics the behaviour of the web SDK when in SPA mode
    this.instanceId = uuid.v4();
    await Promise.all([
      this.countPaidImpressionWhenUserHasValidSub(),
      this.countSampledImpression(),
    ]);
  };

  private countPaidImpressionWhenUserHasValidSub = async () => {
    if (!this.hasValidSubscriptionAndAccessToken()) {
      return;
    }

    logger.info('Counting paid impression');

    try {
      await sendPageViewEvent(this.config.apiUrl, {
        propertyId: this.config.propertyId,
        impressionId: this.instanceId,
        accessToken: this.oidcAuthState!.accessToken,
      });
    } catch (err: any) {
      reportError(err, { msg: 'Failed to count paid impression' });
    }
  };

  private countSampledImpression = async () => {
    this.event('tcf-sampled', 'load');
  };

  private initialiseAuthState = async () => {
    const authState = await this.authStateStorage.getOidcAuthState();
    if (authState) {
      logger.debug('Found auth state in storage, initialising with it');
      await this.onNewAuthState(authState);
      return;
    }

    logger.debug(
      'No auth state found in storage, initialising unauthenticated'
    );
    this.changeContentpassState({
      state: ContentpassStateType.UNAUTHENTICATED,
      hasValidSubscription: false,
    });
  };

  private onNewAuthState = async (authState: OidcAuthState) => {
    logger.debug('New auth state received');
    this.oidcAuthState = authState;
    await this.authStateStorage.storeOidcAuthState(authState);

    const strategy = this.setupRefreshTimer();
    // if instant refresh, no need to check subscription as it will happen in the refresh
    if (strategy === RefreshTokenStrategy.INSTANTLY) {
      logger.debug('Instant refresh, skipping subscription check');
      return;
    }

    try {
      logger.info('Checking subscription');
      const contentpassToken = await fetchContentpassToken({
        issuer: this.config.issuer,
        propertyId: this.config.propertyId,
        idToken: this.oidcAuthState.idToken,
      });
      const hasValidSubscription = validateSubscription(contentpassToken);
      logger.info({ hasValidSubscription }, 'Subscription check successful');
      this.changeContentpassState({
        state: ContentpassStateType.AUTHENTICATED,
        hasValidSubscription,
      });
    } catch (err: any) {
      reportError(err, {
        msg: 'Failed to fetch contentpass token and validate subscription',
      });
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
      logger.warn('No access token expiration date provided');
      return RefreshTokenStrategy.NO_REFRESH;
    }

    const now = new Date();
    const expirationDate = new Date(accessTokenExpirationDate);
    const timeDiff = expirationDate.getTime() - now.getTime();
    if (timeDiff <= 0) {
      logger.debug('Access token expired, refreshing instantly');
      this.refreshToken(0);
      return RefreshTokenStrategy.INSTANTLY;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    logger.debug({ timeDiff }, 'Setting up refresh timer');
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
      logger.info('Refreshing token');
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
      logger.info('Token refreshed successfully');
    } catch (err: any) {
      await this.onRefreshTokenError(counter, err);
    }
  };

  private onRefreshTokenError = async (counter: number, err: Error) => {
    // FIXME: add handling for specific error to not retry in every case
    if (counter < REFRESH_TOKEN_RETRIES) {
      logger.warn({ err, counter }, 'Failed to refresh token, retrying');
      const delay = counter * 1000 * 10;
      await new Promise((resolve) => setTimeout(resolve, delay));
      await this.refreshToken(counter + 1);
      return;
    }

    reportError(err, {
      msg: `Failed to refresh token after ${counter} retries`,
    });

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
