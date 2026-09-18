import fetchWithTimeout from './fetchWithTimeout';

describe('fetchWithTimeout', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('resolves with the fetch response when it completes before the timeout', async () => {
    const response = { ok: true } as any;
    jest.spyOn(global, 'fetch').mockResolvedValue(response);

    const result = await fetchWithTimeout('https://example.com');

    expect(result).toBe(response);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
      signal: expect.any(AbortSignal),
    });
  });

  it('forwards the given init options alongside the abort signal', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any);

    await fetchWithTimeout('https://example.com', {
      method: 'POST',
      body: 'payload',
    });

    expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
      body: 'payload',
      signal: expect.any(AbortSignal),
    });
  });

  it('aborts the request if it does not complete before the timeout', async () => {
    jest.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;
    jest.spyOn(global, 'fetch').mockImplementation((_url, init: any) => {
      capturedSignal = init?.signal;
      return new Promise(() => {});
    });

    const promise = fetchWithTimeout('https://example.com', {}, 5000);
    promise.catch(() => {});

    await jest.advanceTimersByTimeAsync(5000);

    expect(capturedSignal?.aborted).toBe(true);
  });
});
