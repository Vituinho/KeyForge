import websocket from "@fastify/websocket"
import { createHash, randomBytes } from "node:crypto"
import type { FastifyInstance } from "fastify"
import type { WebSocket } from "ws"
import type { Database } from "./database"
import type { BackendConfig } from "./config"
import type { authentication } from "./auth"
import { exact, profileOf } from "./players"
import { matchFor, matchAction } from "./matches"
import type { MultiplayerMatchRow } from "../src/types/database"
type Peer = { socket: WebSocket; userId: string; sessionId: string; matchId?: string; status: string }
export async function realtime(app: FastifyInstance, db: Database, auth: ReturnType<typeof authentication>, config: BackendConfig) {
  await app.register(websocket, { options: { maxPayload: 16384 } })
  const peers = new Set<Peer>()
  const send = (socket: WebSocket, data: unknown) => { if (socket.readyState === 1) socket.send(JSON.stringify(data)) }
  const presence = async () => {
    const users = [...new Set([...peers].map(peer => peer.userId))]
    const rows = await db.player.findMany({ where: { userId: { in: users } } })
    const online = rows.map(row => { const profile = profileOf(row); return { userId: row.userId, username: row.username, level: profile.level, rank: profile.rank, status: [...peers].find(peer => peer.userId === row.userId)?.status ?? "in_lobby", joinedAt: new Date().toISOString() } })
    for (const peer of peers) send(peer.socket, { type: "presence", users: online })
  }
  const publish = async (match: MultiplayerMatchRow) => {
    for (const peer of peers) if (peer.matchId === match.id) {
      send(peer.socket, { type: "match", match })
      const opponent = peer.userId === match.player_1_id ? match.player_2_id : match.player_1_id
      send(peer.socket, { type: "opponentPresence", online: [...peers].some(other => other.matchId === match.id && other.userId === opponent) })
    }
  }
  const timer = setInterval(() => {
    void (async () => {
      for (const peer of peers) {
        const session = await db.session.findUnique({ where: { id: peer.sessionId } })
        if (!session || session.expiresAt.getTime() <= Date.now()) { peer.socket.close(1008, "Session expired"); continue }
        if (peer.matchId) {
          const match = await matchAction(db, peer.userId, { action: "heartbeat", matchId: peer.matchId })
          await publish(match)
        }
        peer.socket.ping()
      }
    })().catch(error => app.log.error(error))
  }, 5000)
  app.addHook("onClose", async () => { clearInterval(timer); for (const peer of peers) peer.socket.close(1001, "Server restarting") })
  app.post("/api/ws-ticket", async request => {
    const { fromNodeHeaders } = await import("better-auth/node")
    const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) })
    if (!session) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 })
    const ticket = randomBytes(32).toString("base64url")
    await db.wsTicket.deleteMany({ where: { expiresAt: { lt: new Date() } } })
    await db.wsTicket.create({ data: { hash: createHash("sha256").update(ticket).digest("hex"), userId: session.user.id, sessionId: session.session.id, expiresAt: new Date(Date.now() + 60000) } })
    return { ticket }
  })
  app.get("/ws", { websocket: true }, (socket, request) => {
    if (request.headers.origin !== config.frontendOrigin) { socket.close(1008, "Origin rejected"); return }
    let peer: Peer | undefined
    let count = 0
    let window = Date.now()
    let chain = Promise.resolve()
    let alive = true
    const timeout = setTimeout(() => socket.close(1008, "Authentication required"), 5000)
    socket.on("pong", () => { alive = true })
    const health = setInterval(() => { if (!alive) socket.terminate(); alive = false; socket.ping() }, 15000)
    socket.on("message", raw => {
      chain = chain.then(async () => {
        if (Date.now() - window > 1000) { count = 0; window = Date.now() }
        if (++count > 30) throw new Error("Rate limited")
        const input: unknown = JSON.parse(raw.toString())
        if (!peer) {
          exact(input, ["type", "ticket"])
          if (input.type !== "authenticate" || typeof input.ticket !== "string" || input.ticket.length > 100) throw new Error("Unauthorized")
          const hash = createHash("sha256").update(input.ticket).digest("hex")
          const ticket = await db.wsTicket.delete({ where: { hash } })
          const session = await db.session.findUnique({ where: { id: ticket.sessionId } })
          if (ticket.expiresAt.getTime() <= Date.now() || !session || session.userId !== ticket.userId || session.expiresAt.getTime() <= Date.now()) throw new Error("Unauthorized")
          if ([...peers].filter(other => other.userId === ticket.userId).length >= 5) throw new Error("Connection limit")
          clearTimeout(timeout)
          peer = { socket, userId: ticket.userId, sessionId: ticket.sessionId, status: "in_lobby" }
          peers.add(peer); send(socket, { type: "authenticated" }); await presence(); return
        }
        const session = await db.session.findUnique({ where: { id: peer.sessionId } })
        if (!session || session.expiresAt.getTime() <= Date.now()) throw new Error("Unauthorized")
        exact(input, ["type", "matchId", "status"])
        if (input.type === "subscribe") {
          const match = await matchFor(db, String(input.matchId), peer.userId)
          peer.matchId = match.id; peer.status = "in_match"; await publish(match)
        } else if (input.type === "presence" && ["in_lobby", "in_queue", "in_match"].includes(String(input.status))) peer.status = String(input.status)
        else throw new Error("Invalid message")
        await presence()
      }).catch(() => socket.close(1008, "Request rejected"))
    })
    socket.on("close", () => {
      clearTimeout(timeout); clearInterval(health)
      if (peer) {
        peers.delete(peer)
        if (peer.matchId) void matchFor(db, peer.matchId, peer.userId).then(publish).catch(() => {})
        void presence().catch(() => {})
      }
    })
  })
  return { publish }
}
