import { authorize, type AuthorizeResult } from 'react-native-app-auth';
import { ISSUER, SCOPES } from './oidcConsts';

export type Config = {
  propertyId: string;
  redirectUrl: string;
};

export type AuthenticateResult = AuthorizeResult;

export class Contentpass {
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public async authenticate(): Promise<AuthenticateResult> {
    const result = await authorize({
      clientId: this.config.propertyId,
      redirectUrl: this.config.redirectUrl,
      issuer: ISSUER,
      scopes: SCOPES,
      additionalParameters: {
        cp_route: 'login',
        prompt: 'consent',
        cp_property: this.config.propertyId,
      },
    });

    return result;
  }
}
