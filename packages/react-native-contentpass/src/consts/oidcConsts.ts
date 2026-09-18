export const SCOPES = ['openid', 'offline_access', 'contentpass'];
export const TOKEN_ENDPOINT = `/auth/oidc/token`;
export const REFRESH_TOKEN_RETRIES = 6;

// RFC 6749 section 5.2 token error codes: the token endpoint explicitly
// rejected the request, so retrying with the same refresh token cannot help.
export const NON_RETRYABLE_REFRESH_ERROR_CODES = new Set([
  'invalid_request',
  'invalid_client',
  'invalid_grant',
  'unauthorized_client',
  'unsupported_grant_type',
  'invalid_scope',
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
