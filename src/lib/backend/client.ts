/** Same-origin cookie authentication. Local display metadata is never authorization. */
export class BackendError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message) }
}
export async function backend<T>(path: string, payload?: unknown, method?: string): Promise<T> {
  const response = await fetch(`/api/backend/${path}`, { method: method ?? (payload === undefined ? "GET" : "POST"), credentials: "same-origin", cache: "no-store", headers: payload === undefined ? undefined : { "Content-Type": "application/json" }, body: payload === undefined ? undefined : JSON.stringify(payload) })
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { code?: string; message?: string }
    throw new BackendError(response.status, `Request failed (${response.status})`, error.code ?? error.message)
  }
  return response.json() as Promise<T>
}
