import { isSpotifyReferenceUrl } from "./soundtrackDiscovery"

/** Called synchronously from a click. False leaves the ordinary safe anchor navigation intact. */
export function openSpotifyWindow(url: string, browser: Pick<Window, "open"> = window): boolean {
  if (!isSpotifyReferenceUrl(url)) return false
  let popup: Window | null = null
  try {
    // Open a same-origin blank first so blocked popups are detectable. Sever opener before navigation.
    popup = browser.open("about:blank", "_blank", "popup,width=480,height=720")
    if (!popup) return false
    popup.opener = null
    popup.location.replace(url)
    return true
  } catch {
    try { popup?.close() } catch { /* Browser policies may prevent access; retain the anchor fallback. */ }
    return false
  }
}
