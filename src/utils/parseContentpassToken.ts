export default function parseContentpassToken(contentpassToken: string) {
  const tokenParts = contentpassToken.split('.');
  if (tokenParts.length < 3) {
    throw new Error('Invalid token');
  }

  const header = JSON.parse(atob(tokenParts[0]!));
  const body = JSON.parse(atob(tokenParts[1]!));

  return {
    header,
    body,
  };
}
