// Copyright 2026 Content Pass GmbH. All Rights Reserved.
import {
  canReachLayerUrl,
  getLayerLoadErrorCopy,
  shouldRetryLayerLoadOnAppState,
} from './ContentpassLayerLoadRecovery';

describe('getLayerLoadErrorCopy', () => {
  it('returns German copy for de locales', () => {
    expect(getLayerLoadErrorCopy('de')).toEqual({
      message:
        'Die Seite konnte nicht geladen werden. Prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
      retryLabel: 'Erneut versuchen',
    });
    expect(getLayerLoadErrorCopy('de-DE').retryLabel).toBe('Erneut versuchen');
  });

  it('returns English copy for other locales', () => {
    expect(getLayerLoadErrorCopy().retryLabel).toBe('Try again');
    expect(getLayerLoadErrorCopy('en-GB').retryLabel).toBe('Try again');
    expect(getLayerLoadErrorCopy('fr').retryLabel).toBe('Try again');
  });
});

describe('shouldRetryLayerLoadOnAppState', () => {
  it('retries when returning to the foreground after a load error', () => {
    expect(shouldRetryLayerLoadOnAppState('active', true)).toBe(true);
  });

  it('does not retry while the app stays in the background', () => {
    expect(shouldRetryLayerLoadOnAppState('background', true)).toBe(false);
    expect(shouldRetryLayerLoadOnAppState('inactive', true)).toBe(false);
  });

  it('does not retry when the layer loaded', () => {
    expect(shouldRetryLayerLoadOnAppState('active', false)).toBe(false);
  });
});

describe('canReachLayerUrl', () => {
  it('returns true for a successful fetch', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true });

    await expect(
      canReachLayerUrl('https://example.com/layer', fetchImpl)
    ).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith('https://example.com/layer', {
      method: 'GET',
      signal: expect.any(AbortSignal),
    });
  });

  it('returns false when the request fails or is not ok', async () => {
    await expect(
      canReachLayerUrl('https://example.com/layer', () =>
        Promise.reject(new Error('offline'))
      )
    ).resolves.toBe(false);

    await expect(
      canReachLayerUrl('https://example.com/layer', () =>
        Promise.resolve({ ok: false } as Response)
      )
    ).resolves.toBe(false);
  });
});
