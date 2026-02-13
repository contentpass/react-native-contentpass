import sendPageViewEvent from './sendPageViewEvent';

describe('sendPageViewEvent', () => {
  const apiUrl = 'https://api.example.com';
  const payload = {
    propertyId: 'property123',
    impressionId: 'impression456',
    accessToken: 'token789',
  };

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should send a page view event successfully', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
    } as any);

    const response = await sendPageViewEvent(apiUrl, payload);

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      `${apiUrl}/pass/hit?pid=${payload.propertyId}&iid=${payload.impressionId}&t=pageview`,
      {
        headers: {
          Authorization: `Bearer ${payload.accessToken}`,
        },
      }
    );
  });

  it('should throw an error if the fetch fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
    } as any);

    await expect(sendPageViewEvent(apiUrl, payload)).rejects.toThrow(
      'Failed send page view event'
    );
  });
});
