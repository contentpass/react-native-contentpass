type ParsedToken = {
  body: {
    aud: string;
    auth: boolean;
    exp: number;
    iat: number;
    plans: string[];
    type: string;
  };
  header: {
    alg: string;
    kid: string;
  };
};

export default function parseContentpassToken(
  contentpassToken: string
): ParsedToken {
  const tokenParts = contentpassToken.split('.');
  if (tokenParts.length < 3) {
    throw new Error('Invalid token, token should have at least 3 parts');
  }

  const header = JSON.parse(atob(tokenParts[0]!));
  const body = JSON.parse(atob(tokenParts[1]!));

  return {
    header,
    body,
  };
}
