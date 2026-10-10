import { backend } from "./client"
export interface RealtimeMessage { type: string; [key: string]: unknown }
/** Every reconnect requests a new one-use ticket and receives a fresh server snapshot. */
export function subscribeRealtime(onMessage: (message: RealtimeMessage) => void, matchId?: string, status = "in_lobby") {
  let stopped = false
  let socket: WebSocket | undefined
  let retry: ReturnType<typeof setTimeout> | undefined
  let delay = 500
  const connect = async () => {
    try {
      const url = process.env.NEXT_PUBLIC_BACKEND_WS_URL
      if (!url) return
      const { ticket } = await backend<{ ticket: string }>("ws-ticket", {})
      if (stopped) return
      socket = new WebSocket(url)
      socket.onopen = () => socket?.send(JSON.stringify({ type: "authenticate", ticket }))
      socket.onmessage = event => {
        const message = JSON.parse(event.data) as RealtimeMessage
        if (message.type === "authenticated") {
          delay = 500
          socket?.send(JSON.stringify(matchId ? { type: "subscribe", matchId } : { type: "presence", status }))
        }
        onMessage(message)
      }
      socket.onerror = () => socket?.close()
      socket.onclose = () => { if (!stopped) { retry = setTimeout(() => { void connect() }, delay); delay = Math.min(delay * 2, 10000) } }
    } catch { if (!stopped) retry = setTimeout(() => { void connect() }, 5000) }
  }
  void connect()
  return () => { stopped = true; if (retry) clearTimeout(retry); socket?.close() }
}
