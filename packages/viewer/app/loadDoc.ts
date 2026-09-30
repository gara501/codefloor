export type LoadResult = { ok: true; doc: unknown } | { ok: false; message: string };

export async function loadDoc(fetchFn: typeof fetch = fetch): Promise<LoadResult> {
  let res: Response;
  try {
    res = await fetchFn("./codefloor.json", { cache: "no-store" });
  } catch {
    return { ok: false, message: "Could not load codefloor.json (network error)." };
  }
  if (!res.ok) return { ok: false, message: `codefloor.json not found (HTTP ${res.status}).` };
  const text = await res.text();
  try {
    return { ok: true, doc: JSON.parse(text) };
  } catch {
    return { ok: false, message: "codefloor.json is not valid JSON." };
  }
}
