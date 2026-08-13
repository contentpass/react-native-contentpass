import { isNonRetryableRefreshError } from './oidcConsts';

describe('isNonRetryableRefreshError', () => {
  it('returns true for permanent OAuth token errors', () => {
    expect(isNonRetryableRefreshError({ code: 'invalid_grant' })).toBe(true);
    expect(isNonRetryableRefreshError({ code: 'invalid_client' })).toBe(true);
    expect(isNonRetryableRefreshError({ code: 'unauthorized_client' })).toBe(
      true
    );
  });

  it('returns false for transient or unknown errors', () => {
    expect(isNonRetryableRefreshError(new Error('network'))).toBe(false);
    expect(isNonRetryableRefreshError({ code: 'server_error' })).toBe(false);
    expect(isNonRetryableRefreshError({ code: 2002 })).toBe(false);
    expect(isNonRetryableRefreshError(null)).toBe(false);
  });
});
