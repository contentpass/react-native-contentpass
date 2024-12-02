import fetchContentpassToken from './fetchContentpassToken';

describe('fetchContentpassToken', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should return the contentpass token', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest
        .fn()
        .mockResolvedValue({ contentpass_token: 'example_contentpass_token' }),
    } as any);

    const result = await fetchContentpassToken({
      idToken: '123456',
      propertyId: '987654321',
      issuer: 'https://issuer.com',
    });

    expect(result).toBe('example_contentpass_token');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://issuer.com/auth/oidc/token',
      {
        body: 'grant_type=contentpass_token&subject_token=123456&client_id=987654321',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
  });
});
