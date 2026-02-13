type StatsPayload = {
  ea: string;
  ec: string;
  el?: string;
  cpabid: string;
  cppid: string;
  cpsr: number;
};

export default async function sendStats(apiUrl: string, payload: StatsPayload) {
  const response = await fetch(`${apiUrl}/signal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to send stats, status: ${response.statusText}`);
  }

  return response;
}
