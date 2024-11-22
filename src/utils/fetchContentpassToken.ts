import { TOKEN_ENDPOINT } from '../oidcConsts';

export default async function fetchContentpassToken({
  idToken,
  propertyId,
}: {
  idToken: string;
  propertyId: string;
}) {
  const tokenEndpointResponse = await fetch(TOKEN_ENDPOINT, {
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
