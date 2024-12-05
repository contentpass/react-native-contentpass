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
import fetchContentpassToken from './utils/fetchContentpassToken';
import validateSubscription from './utils/validateSubscription';
import type { ContentpassConfig } from './types/ContentpassConfig';
import { reportError, setSentryExtraAttribute } from './sentryIntegration';

export type ContentpassObserver = (state: ContentpassState) => void;

export default class Contentpass {
  private authStateStorage: OidcAuthStateStorage;
  private readonly config: ContentpassConfig;

  private contentpassState: ContentpassState = {
    state: ContentpassStateType.INITIALISING,
  };
  private contentpassStateObservers: ContentpassObserver[] = [];
  private oidcAuthState: OidcAuthState | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(config: ContentpassConfig) {
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
}
