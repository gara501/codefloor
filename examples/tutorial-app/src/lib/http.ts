export async function request(
  url: string,
  init: { method: string; body?: unknown },
): Promise<void> {
  const res = await fetch(url, {
    method: init.method,
    headers: { "content-type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!res.ok) throw new Error(`${init.method} ${url} failed: ${res.status}`);
}
