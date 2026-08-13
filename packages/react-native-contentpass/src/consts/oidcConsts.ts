export const SCOPES = ['openid', 'offline_access', 'contentpass'];
export const TOKEN_ENDPOINT = `/auth/oidc/token`;
export const REFRESH_TOKEN_RETRIES = 6;

export const NON_RETRYABLE_REFRESH_ERROR_CODES = new Set([
  'invalid_grant',
  'invalid_client',
  'unauthorized_client',
]);

export function isNonRetryableRefreshError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }

  const code = (err as { code?: unknown }).code;
  return (
    typeof code === 'string' && NON_RETRYABLE_REFRESH_ERROR_CODES.has(code)
  );
}
