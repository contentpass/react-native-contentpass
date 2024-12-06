import fetchContentpassToken from './fetchContentpassToken';

describe('fetchContentpassToken', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should return the contentpass token', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
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

  it('should throw an error if the fetch fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as any);

    await expect(async () => {
      await fetchContentpassToken({
        idToken: '123456',
        propertyId: '987654321',
        issuer: 'https://issuer.com',
      });
    }).rejects.toThrow('Failed to fetch Contentpass token, status: Not Found');
  });
});
