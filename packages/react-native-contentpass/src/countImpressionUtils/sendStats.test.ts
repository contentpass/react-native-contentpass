import sendStats from './sendStats';

describe('sendStats', () => {
  const apiUrl = 'https://api.example.com';
  const payload = {
    ea: 'eventAction',
    ec: 'eventCategory',
    cpabid: 'cpabid123',
    cppid: 'cppid456',
    cpsr: 1,
  };

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should send stats successfully', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
    } as any);

    const response = await sendStats(apiUrl, payload);

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(`${apiUrl}/signal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: JSON.stringify(payload),
    });
  });

  it('should throw an error if the fetch fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
    } as any);

    await expect(sendStats(apiUrl, payload)).rejects.toThrow(
      'Failed to send stats'
    );
  });
});
