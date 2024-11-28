import { authorize, type AuthorizeResult } from 'react-native-app-auth';
import { SCOPES } from './oidcConsts';
import OidcAuthStateStorage from './OidcAuthStateStorage';
import parseContentpassToken from './utils/parseContentpassToken';
import fetchContentpassToken from './utils/fetchContentpassToken';

export type Config = {
  propertyId: string;
  redirectUrl: string;
  issuer: string;
};

export enum State {
  INITIALISING = 'INITIALISING',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  AUTHENTICATED = 'AUTHENTICATED',
  ERROR = 'ERROR',
}

type ErrorAuthenticateResult = {
  state: State.ERROR;
  hasValidSubscription: false;
  error: Error;
};

type StandardAuthenticateResult = {
  state: State;
  hasValidSubscription: boolean;
  error?: never;
};

export type AuthenticateResult =
  | StandardAuthenticateResult
  | ErrorAuthenticateResult;

export class Contentpass {
  private authStateStorage: OidcAuthStateStorage;
  private readonly config: Config;
  private state: State = State.INITIALISING;

  constructor(config: Config) {
    this.authStateStorage = new OidcAuthStateStorage(config.propertyId);
    this.config = config;
  }

  public async authenticate(): Promise<AuthenticateResult> {
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
        },
      });
    } catch (err: any) {
      // FIXME: logger for error

      return {
        state: State.ERROR,
        hasValidSubscription: false,
        error: 'message' in err ? err.message : 'Unknown error',
      };
    }

    this.state = State.AUTHENTICATED;
    await this.authStateStorage.storeOidcAuthState(result);

    try {
      const contentpassToken = await fetchContentpassToken({
        issuer: this.config.issuer,
        propertyId: this.config.propertyId,
        idToken: result.idToken,
      });
      const hasValidSubscription = this.validateSubscription(contentpassToken);

      return {
        state: this.state,
        hasValidSubscription,
      };
    } catch (err) {
      // FIXME: logger for error
      return {
        state: this.state,
        hasValidSubscription: false,
      };
    }
  }

  private validateSubscription(contentpassToken: string) {
    const { body } = parseContentpassToken(contentpassToken);

    return !!body.auth && !!body.plans.length;
  }
}
