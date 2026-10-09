/** Only a same-origin application path can be used after authentication. */
export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return "/game"
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith("//") || /[\\\u0000-\u001f]/.test(decoded)) return "/game"
    const url = new URL(value, "https://keyforge.invalid")
    return url.origin === "https://keyforge.invalid" ? url.pathname + url.search + url.hash : "/game"
  } catch { return "/game" }
}
