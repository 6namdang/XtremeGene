/**
 * Optional FastAPI (or other) backend. Set BACKEND_URL in .env.local, e.g. http://127.0.0.1:8000
 * Expected routes: POST /api/literature-qc, POST /api/experiment-plan with JSON bodies matching lib/types.
 */
export async function tryBackendJson<T>(
  path: string,
  body: unknown
): Promise<T | null> {
  const base = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!base) return null;
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
