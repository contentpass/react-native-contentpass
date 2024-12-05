import EncryptedStorage from 'react-native-encrypted-storage';
import OidcAuthStateStorage, {
  type OidcAuthState,
} from './OidcAuthStateStorage';
import * as SentryIntegrationModule from './sentryIntegration';

describe('OidcAuthStateStorage', () => {
  const CLIENT_ID = 'test-client-id';
  const EXPECTED_STORAGE_KEY = `de.contentpass.${CLIENT_ID}-OIDCAuthState`;

  let storage: OidcAuthStateStorage;
  let reportErrorSpy: jest.SpyInstance;
  const mockAuthState: OidcAuthState = {
    accessToken: 'test-access-token',
    accessTokenExpirationDate: '2023-12-31T23:59:59Z',
    idToken: 'test-id-token',
    refreshToken: 'test-refresh-token',
    tokenType: 'Bearer',
  };

  beforeEach(() => {
    storage = new OidcAuthStateStorage(CLIENT_ID);
    reportErrorSpy = jest
      .spyOn(SentryIntegrationModule, 'reportError')
      .mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should store OIDC auth state', async () => {
    await storage.storeOidcAuthState(mockAuthState);

    expect(EncryptedStorage.setItem).toHaveBeenCalledWith(
      EXPECTED_STORAGE_KEY,
      '{"accessToken":"test-access-token","accessTokenExpirationDate":"2023-12-31T23:59:59Z","idToken":"test-id-token","refreshToken":"test-refresh-token","tokenType":"Bearer"}'
    );
  });

  it('should get OIDC auth state', async () => {
    (EncryptedStorage.getItem as jest.Mock).mockResolvedValue(
      '{"accessToken":"test-access-token","accessTokenExpirationDate":"2023-12-31T23:59:59Z","idToken":"test-id-token","refreshToken":"test-refresh-token","tokenType":"Bearer"}'
    );
    const result = await storage.getOidcAuthState();

    expect(EncryptedStorage.getItem).toHaveBeenCalledWith(EXPECTED_STORAGE_KEY);
    expect(result).toEqual(mockAuthState);
  });

  it('should return undefined if no OIDC auth state is found', async () => {
    (EncryptedStorage.getItem as jest.Mock).mockResolvedValue(null);
    const result = await storage.getOidcAuthState();

    expect(EncryptedStorage.getItem).toHaveBeenCalledWith(EXPECTED_STORAGE_KEY);
    expect(result).toBeUndefined();
  });

  it('should clear OIDC auth state', async () => {
    await storage.clearOidcAuthState();

    expect(EncryptedStorage.removeItem).toHaveBeenCalledWith(
      EXPECTED_STORAGE_KEY
    );
  });

  it('should report error if clearing OIDC auth state fails', async () => {
    const error = new Error('test-error');
    (EncryptedStorage.removeItem as jest.Mock).mockRejectedValue(error);

    await storage.clearOidcAuthState();

    expect(EncryptedStorage.removeItem).toHaveBeenCalledWith(
      EXPECTED_STORAGE_KEY
    );
    expect(reportErrorSpy).toHaveBeenCalledWith(error, {
      msg: 'Failed to clear OIDC auth state. Most probably we tried to remove item which does not exist',
    });
  });
});
