import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import { fromNodeHeaders } from "better-auth/node"
import type { BackendConfig } from "./config"
import { database, transaction, json } from "./database"
import { authentication } from "./auth"
import { player, profileOf, inventoryOf, exact } from "./players"
import { progression } from "./progression"
import { inventoryAction } from "./inventory"
import { matchAction, matchFor, resultOf, stateOf, queueAction } from "./matches"
import { realtime } from "./realtime"
import { timingSafeEqual } from "node:crypto"
import { isIP } from "node:net"
export async function createApp(config: BackendConfig) {
  const db = database(config.databaseUrl)
  const auth = authentication(db, config)
  const app = Fastify({ logger: config.production, bodyLimit: 1048576, trustProxy: false })
  await app.register(cors, { origin: config.frontendOrigin, credentials: true })
  await app.register(helmet)
  app.addHook("onRequest", async (request, reply) => {
    reply.header("Cache-Control", "no-store")
    if (request.url.startsWith("/api/") && config.proxySecret) {
      const supplied = Buffer.from(String(request.headers["x-keyforge-proxy"] ?? ""))
      const expected = Buffer.from(config.proxySecret)
      if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return reply.code(403).send({ error: "Proxy authentication required" })
    }
    const suppliedIp = config.proxySecret ? String(request.headers["x-keyforge-client-ip"] ?? "") : request.ip
    request.headers["x-keyforge-client-ip"] = isIP(suppliedIp) ? suppliedIp : request.ip
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method) && request.headers.origin !== config.frontendOrigin) return reply.code(403).send({ error: "Forbidden origin" })
  })
  await app.register(rateLimit, { max: 300, timeWindow: 60000, keyGenerator: request => String(request.headers["x-keyforge-client-ip"] ?? request.ip) })
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Request rejected")
    const { statusCode, code } = error as { statusCode?: number; code?: string }
    const status = statusCode && statusCode >= 400 && statusCode < 500 ? statusCode : code === "P2002" ? 409 : code === "P2025" ? 422 : code?.startsWith("P") || code?.startsWith("ECONN") ? 503 : 422
    reply.code(status).send({ error: "Request could not be verified" })
  })
  app.get("/health", async () => { await db.$queryRaw`SELECT 1`; return { ok: true } })
  app.route({ method: ["GET", "POST"], url: "/api/auth/*", handler: async (request, reply) => {
    const endpoint = request.url.split("?")[0].slice("/api/auth/".length)
    const allowed = ["sign-up/email", "sign-in/email", "sign-out", "get-session"]
    if (!allowed.includes(endpoint)) return reply.code(404).send({ error: "Unknown endpoint" })
    if (endpoint === "sign-up/email") exact(request.body, ["name", "email", "password", "rememberMe", "callbackURL"])
    if (endpoint === "sign-in/email") exact(request.body, ["email", "password", "rememberMe", "callbackURL"])
    const url = config.frontendOrigin + request.url.replace("/api/auth/", "/api/backend/auth/")
    const response = await auth.handler(new Request(url, { method: request.method, headers: fromNodeHeaders(request.headers), body: request.method === "GET" ? undefined : JSON.stringify(request.body) }))
    reply.code(response.status)
    response.headers.forEach((value, key) => { if (key !== "set-cookie") reply.header(key, value) })
    const cookies = response.headers.getSetCookie()
    if (cookies.length) reply.header("set-cookie", cookies)
    return reply.send(await response.text())
  } })
  const authenticated = async (request: { headers: Parameters<typeof fromNodeHeaders>[0] }) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) })
    if (!session) throw Object.assign(new Error("Authentication required"), { statusCode: 401 })
    const expectedAccount = new Headers(fromNodeHeaders(request.headers)).get("x-keyforge-account")
    if (expectedAccount && expectedAccount !== session.user.id) throw Object.assign(new Error("Account changed"), { statusCode: 409 })
    await transaction(db, tx => player(tx, session.user.id))
    return session
  }
  const live = await realtime(app, db, auth, config)
  app.post("/api/matches", async request => {
    const { user } = await authenticated(request)
    const match = await matchAction(db, user.id, request.body)
    await live.publish(match)
    return match
  })
  app.get<{ Params: { id: string } }>("/api/matches/:id", async request => { const { user } = await authenticated(request); return matchFor(db, request.params.id, user.id) })
  app.get<{ Params: { id: string } }>("/api/matches/:id/result", async request => { const { user } = await authenticated(request); return resultOf(await matchFor(db, request.params.id, user.id)) })
  app.get<{ Params: { code: string } }>("/api/rooms/:code", async request => {
    const { user } = await authenticated(request)
    const row = await db.match.findUnique({ where: { roomCode: request.params.code.toUpperCase() } })
    if (!row) return null
    const match = stateOf(row)
    if (![match.player_1_id, match.player_2_id].includes(user.id)) throw Object.assign(new Error("Join first"), { statusCode: 403 })
    return match
  })
  app.get<{ Params: { id: string } }>("/api/players/:id", async request => {
    const { user } = await authenticated(request)
    if (request.params.id !== user.id) {
      const matches = await db.match.count({ where: { OR: [{ player1: user.id, player2: request.params.id }, { player2: user.id, player1: request.params.id }] } })
      if (!matches) throw Object.assign(new Error("No shared match"), { statusCode: 403 })
    }
    const row = await db.player.findUniqueOrThrow({ where: { userId: request.params.id } })
    const profile = profileOf(row)
    return { id: row.userId, username: row.username, level: profile.level, rank: profile.rank }
  })
  app.post("/api/queue", async request => { const { user } = await authenticated(request); return queueAction(db, user.id, request.body) })
  app.get("/api/player", async request => { const { user } = await authenticated(request); return profileOf(await db.player.findUniqueOrThrow({ where: { userId: user.id } })) })
  app.get("/api/inventory", async request => { const { user } = await authenticated(request); return { ...inventoryOf(await db.player.findUniqueOrThrow({ where: { userId: user.id } })), ownerId: user.id } })
  app.post("/api/progression", async request => { const { user } = await authenticated(request); return progression(db, user.id, request.body as Record<string, unknown>) })
  app.post("/api/inventory", async request => { const { user } = await authenticated(request); return inventoryAction(db, user.id, request.body) })
  app.patch("/api/preferences", async request => {
    const { user } = await authenticated(request)
    exact(request.body, ["username", "keyboardSettings"])
    const { username, keyboardSettings } = request.body
    if (username !== undefined && (typeof username !== "string" || !/^[A-Za-z0-9_-]{3,20}$/.test(username))) throw new Error("Invalid username")
    if (keyboardSettings !== undefined) {
      exact(keyboardSettings, ["showKeyboard", "showHandsGuide", "showHomeRowAnchors", "showFingerName", "effectIntensity", "fingerColors", "handGuide", "keyboardLayout"])
      for (const [key, value] of Object.entries(keyboardSettings)) {
        const choices = key === "keyboardLayout" ? ["ABNT2", "ANSI", "auto"] : key === "effectIntensity" ? ["full", "reduced", "off"] : ["full", "subtle", "off"]
        if (key.startsWith("show") ? typeof value !== "boolean" : !choices.includes(String(value))) throw new Error("Invalid preference")
      }
    }
    await transaction(db, async tx => {
      const row = await player(tx, user.id)
      if (typeof username === "string") await tx.user.update({ where: { id: user.id }, data: { name: username, usernameKey: username.toLowerCase() } })
      await tx.player.update({ where: { userId: user.id }, data: { ...(typeof username === "string" ? { username, usernameKey: username.toLowerCase() } : {}), ...(keyboardSettings ? { preferences: json({ ...(row.preferences as object), keyboardSettings }) } : {}) } })
    })
    return { success: true }
  })
  app.addHook("onClose", async () => { await db.$disconnect() })
  return { app, db, auth, authenticated }
}
