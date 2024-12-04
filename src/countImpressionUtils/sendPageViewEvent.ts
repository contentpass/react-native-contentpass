type HitEndpointArgs = {
  propertyId: string;
  impressionId: string;
  accessToken: string;
};

export default async function sendPageViewEvent(
  apiUrl: string,
  payload: HitEndpointArgs
) {
  const { propertyId, impressionId, accessToken } = payload;
  const path = `pass/hit?pid=${propertyId}&iid=${impressionId}&t=pageview`;

  const response = await fetch(`${apiUrl}/${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed send page view event, status: ${response.statusText}`
    );
  }

  return response;
}
