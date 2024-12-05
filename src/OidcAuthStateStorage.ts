import EncryptedStorage from 'react-native-encrypted-storage';
import { reportError } from './sentryIntegration';

const AUTH_STATE_KEY = 'OIDCAuthState';

export type OidcAuthState = {
  accessToken: string;
  accessTokenExpirationDate: string;
  idToken: string;
  refreshToken: string | null;
  tokenType: string;
};

export default class OidcAuthStateStorage {
  private readonly key;

  constructor(clientId: string) {
    this.key = `de.contentpass.${clientId}-${AUTH_STATE_KEY}`;
  }

  public async storeOidcAuthState(authState: OidcAuthState) {
    await EncryptedStorage.setItem(this.key, JSON.stringify(authState));
  }

  public async getOidcAuthState(): Promise<OidcAuthState | undefined> {
    const oidcAuthStateString = await EncryptedStorage.getItem(this.key);

    return oidcAuthStateString ? JSON.parse(oidcAuthStateString) : undefined;
  }

  public async clearOidcAuthState() {
    try {
      await EncryptedStorage.removeItem(this.key);
    } catch (err: any) {
      reportError(err, {
        msg: 'Failed to clear OIDC auth state. Most probably we tried to remove item which does not exist',
      });
    }
  }
}
