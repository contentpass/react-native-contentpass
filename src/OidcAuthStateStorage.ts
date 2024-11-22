import EncryptedStorage from 'react-native-encrypted-storage';
import type { AuthorizeResult } from 'react-native-app-auth';

const AUTH_STATE_KEY = 'OIDCAuthState';

export default class OidcAuthStateStorage {
  private readonly key;

  constructor(clientId: string) {
    this.key = `de.contentpass.${clientId}-${AUTH_STATE_KEY}`;
  }

  public async storeOidcAuthState(authState: AuthorizeResult) {
    await EncryptedStorage.setItem(this.key, JSON.stringify(authState));
  }

  public async getOidcAuthState() {
    const oidcAuthStateString = await EncryptedStorage.getItem(this.key);

    return oidcAuthStateString ? JSON.parse(oidcAuthStateString) : undefined;
  }

  public async clearOidcAuthState() {
    await EncryptedStorage.removeItem(this.key);
  }
}
