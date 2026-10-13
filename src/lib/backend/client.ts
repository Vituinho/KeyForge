/** Same-origin cookie authentication. Local display metadata is never authorization. */
export class BackendError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message) }
}
export async function backend<T>(path: string, payload?: unknown, method?: string): Promise<T> {
  const headers: Record<string,string> = payload === undefined ? {} : { "Content-Type": "application/json" }
  if (!path.startsWith("auth/") && typeof localStorage !== "undefined") {
    try { const user = JSON.parse(localStorage.getItem("keyforge_auth_user") ?? "null"); if (user?.id && !user.isGuest) headers["x-keyforge-account"] = user.id } catch {}
  }
  const response = await fetch(`/api/backend/${path}`, { method: method ?? (payload === undefined ? "GET" : "POST"), credentials: "same-origin", cache: "no-store", headers, body: payload === undefined ? undefined : JSON.stringify(payload) })
  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { code?: string; message?: string }
    const code = error.message === "USERNAME_TAKEN" ? error.message : error.code ?? error.message
    throw new BackendError(response.status, `Request failed (${response.status})`, code)
  }
  return response.json() as Promise<T>
}
