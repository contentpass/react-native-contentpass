import { TOKEN_ENDPOINT } from '../consts/oidcConsts';

export default async function fetchContentpassToken({
  idToken,
  propertyId,
  issuer,
}: {
  idToken: string;
  propertyId: string;
  issuer: string;
}) {
  const tokenEndpointResponse = await fetch(`${issuer}${TOKEN_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'contentpass_token',
      subject_token: idToken,
      client_id: propertyId,
    }).toString(),
  });

  const { contentpass_token } = await tokenEndpointResponse.json();

  return contentpass_token;
}
