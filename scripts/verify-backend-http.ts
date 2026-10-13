import assert from "node:assert/strict"
import { spawn, execFileSync, type ChildProcess } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { backendTestDatabase } from "./backend-test-database"
import { WebSocket as Socket } from "ws"
import { subscribeRealtime } from "../src/lib/backend/realtime"
/** Production bundles, real HTTP sessions and an isolated PostgreSQL database; no remote services. */
async function verify() {
  const database = backendTestDatabase()
  const port = 33000 + Math.floor(Math.random() * 5000)
  const backendPort = 41000 + Math.floor(Math.random() * 5000)
  const origin = `http://127.0.0.1:${port}`
  const backendOrigin = `http://127.0.0.1:${backendPort}`
  const secret = "disposable-http-proxy-secret-1234567890"
  const startBackend = () => spawn(process.execPath, ["--input-type=module", "-e", 'process.on("message", message => { if (message === "SIGTERM") { process.emit("SIGTERM"); process.disconnect() } }); await import("./backend/dist/server.mjs")'], { env: { ...process.env, NODE_ENV: "test", DATABASE_URL: database.url, DATABASE_MIGRATION_URL: "", PORT: String(backendPort), FRONTEND_ORIGIN: origin, BACKEND_PROXY_SECRET: secret, BETTER_AUTH_SECRET: "disposable-http-auth-secret-1234567890" }, windowsHide: true, stdio: ["ignore", "pipe", "pipe", "ipc"] })
  let server = startBackend()
  const frontend = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "--hostname", "127.0.0.1"], { env: { ...process.env, BACKEND_URL: backendOrigin, FRONTEND_ORIGIN: origin, BACKEND_PROXY_SECRET: secret }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
  let output = ""
  const children: ChildProcess[] = []
  const closed = new Map<ChildProcess, Promise<number | null>>()
  const track = (child: ChildProcess) => {
    children.push(child)
    child.stdout!.on("data", chunk => { output = (output + String(chunk)).slice(-6000) })
    child.stderr!.on("data", chunk => { output = (output + String(chunk)).slice(-6000) })
    closed.set(child, new Promise(resolve => child.once("close", code => resolve(code))))
  }
  track(server); track(frontend)
  const originalFetch = globalThis.fetch, originalSocket = globalThis.WebSocket
  const previousWsUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL
  let unsubscribe: (() => void) | undefined
  let databaseStopped = false
  const until = async (condition: () => boolean, label: string) => {
    const expires = Date.now() + 15000
    while (!condition() && Date.now() < expires) await new Promise(resolve => setTimeout(resolve, 100))
    assert.ok(condition(), label + "\n" + output)
  }
  const http = (cookie: string, path: string, payload?: unknown) => originalFetch(origin + "/api/backend/" + path, { method: payload === undefined ? "GET" : "POST", headers: { cookie, origin, "Content-Type": "application/json" }, body: payload === undefined ? undefined : JSON.stringify(payload), signal: AbortSignal.timeout(20000) })
  try {
    let ready = false
    let lastHealth = "Not reached"
    for (let attempt = 0; attempt < 160; attempt++) {
      if (server.exitCode !== null || frontend.exitCode !== null) throw new Error(output)
      try {
        const health = await fetch(backendOrigin + "/health", { signal: AbortSignal.timeout(5000) })
        lastHealth = "Backend health status " + health.status
        ready = health.status === 200 && (await fetch(origin, { signal: AbortSignal.timeout(5000) })).status === 200
        if (ready) break
      } catch { lastHealth = "Connection unavailable" }
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.ok(ready, lastHealth + "\n" + output)
    for (const path of ["/academy", "/battle", "/multiplayer", "/multiplayer/arena", "/locker", "/locker/crates", "/profile", "/training"]) assert.equal((await fetch(origin + path)).status, 200, path)
    assert.equal((await fetch(backendOrigin + "/api/player")).status, 403, "Direct backend requires proxy secret")
    assert.equal((await fetch(origin + "/api/backend/player")).status, 401)
    const registered = await fetch(origin + "/api/backend/auth/sign-up/email", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify({ name: "HttpPlayer", email: "http@example.test", password: "Strong-password-123" }) })
    assert.equal(registered.status, 200, await registered.clone().text())
    const cookie = registered.headers.getSetCookie().map(value => value.split(";")[0]).join("; ")
    assert.ok(cookie.includes("session_token"))
    const profile = await fetch(origin + "/api/backend/player", { headers: { cookie } })
    assert.equal(profile.status, 200)
    assert.equal(profile.headers.get("Cache-Control"), "no-store")
    assert.equal((await profile.json()).username, "HttpPlayer")
    assert.equal((await fetch(origin + "/api/backend/auth/get-session", { headers: { cookie } })).status, 200)
    assert.equal((await fetch(origin + "/api/backend/preferences", { method: "PATCH", headers: { cookie, origin: "https://evil.test", "Content-Type": "application/json" }, body: JSON.stringify({ username: "Evil" }) })).status, 403)
    assert.equal((await fetch(origin + "/api/backend/progression", { method: "POST", headers: { cookie, origin, "Content-Type": "application/json" }, body: JSON.stringify({ action: "pvp", xp: 99999 }) })).status, 422)
    const open = { action: "open", crateId: "basic_crate", requestId: crypto.randomUUID() }
    const opened = await Promise.all([http(cookie, "inventory", open), http(cookie, "inventory", open)])
    for (const result of opened) assert.equal(result.status, 200)
    const firstDrop = await opened[0].json()
    assert.deepEqual(await opened[1].json(), firstDrop, "Concurrent duplicate crate is one outcome")
    const inventoryBefore = await (await http(cookie, "inventory")).json()
    const profileBefore = await (await http(cookie, "player")).json()
    const secondAccount = await http("", "auth/sign-up/email", { name: "HttpOpponent", email: "opponent@example.test", password: "Strong-password-456" })
    assert.equal(secondAccount.status, 200)
    const secondCookie = secondAccount.headers.getSetCookie().map(value => value.split(";")[0]).join("; ")
    const room = await (await http(cookie, "matches", { action: "create", mode: "private", language: "en" })).json()
    assert.equal((await http(secondCookie, "matches", { action: "join", roomCode: room.room_code })).status, 200)
    const readyActions = await Promise.all([http(cookie, "matches", { action: "ready", matchId: room.id, isReady: true }), http(secondCookie, "matches", { action: "ready", matchId: room.id, isReady: true })])
    for (const result of readyActions) assert.equal(result.status, 200, "Concurrent ready actions commit")
    const readyMatch = await (await http(cookie, "matches/" + room.id)).json()
    assert.equal(readyMatch.player_1_ready, true)
    assert.equal(readyMatch.player_2_ready, true)

    // Use the production browser reconnect implementation against real HTTP/WS.
    // This harness supplies browser Origin/cookies; it does not simulate TLS or a browser cookie jar.
    let authenticated = 0, snapshots = 0, closeCode: number | undefined
    globalThis.WebSocket = class extends Socket {
      constructor(url: string | URL) { super(url, { origin }); this.on("close", code => { closeCode = code }) }
    } as unknown as typeof WebSocket
    globalThis.fetch = (input, init) => {
      if (typeof input === "string" && input.startsWith("/api/backend/")) {
        const headers = new Headers(init?.headers); headers.set("origin", origin); headers.set("cookie", cookie)
        return originalFetch(origin + input, { ...init, headers })
      }
      return originalFetch(input, init)
    }
    process.env.NEXT_PUBLIC_BACKEND_WS_URL = `ws://127.0.0.1:${backendPort}/ws`
    unsubscribe = subscribeRealtime(message => {
      if (message.type === "authenticated") authenticated++
      if (message.type === "match") snapshots++
    }, room.id)
    await until(() => authenticated === 1 && snapshots > 0, "Initial authenticated WebSocket snapshot")
    const beforeRestart = snapshots
    // Windows cannot deliver POSIX SIGTERM. The isolated child invokes the exact
    // installed handler through IPC; Linux/container signal delivery remains a staging gate.
    server.send("SIGTERM")
    assert.equal(await closed.get(server), 0, "Compiled backend shuts down cleanly")
    assert.equal(closeCode, 1012, "WebSocket receives restart close code")
    server = startBackend(); track(server)
    await until(() => authenticated >= 2 && snapshots > beforeRestart, "Browser reconnect fetches a new ticket and persisted snapshot")
    assert.deepEqual(await (await http(cookie, "player")).json(), profileBefore, "Profile/session survive backend restart")
    assert.equal((await http(secondCookie, "player")).status, 200, "Second account session survives restart")
    assert.deepEqual(await (await http(cookie, "inventory")).json(), inventoryBefore, "Inventory persists")
    assert.deepEqual(await (await http(cookie, "inventory", open)).json(), firstDrop, "Duplicate receipt persists across restart")
    assert.deepEqual(await (await http(cookie, "inventory")).json(), inventoryBefore, "Replay cannot spend again")

    // Back up and restore ONLY this harness's disposable cluster to a second empty database.
    const bin = process.env.KEYFORGE_TEST_PG_BIN ?? (process.platform === "win32" ? "C:/Program Files/PostgreSQL/18/bin" : "")
    const pg = (name: string, args: string[]) => execFileSync(bin ? join(bin, name + (process.platform === "win32" ? ".exe" : "")) : name, args, { encoding: "utf8", windowsHide: true, timeout: 60000 }).trim()
    const dump = join(database.dir, "staging-restore-test.dump")
    pg("pg_dump", ["--dbname", database.ownerUrl, "--format=custom", "--file", dump])
    database.sql("CREATE DATABASE keyforge_restore_test")
    const restoreUrl = new URL(database.ownerUrl); restoreUrl.pathname = "/keyforge_restore_test"
    pg("pg_restore", ["--dbname", restoreUrl.toString(), "--no-owner", "--no-acl", "--exit-on-error", dump])
    const restored = (sql: string) => pg("psql", ["--dbname", restoreUrl.toString(), "-XAt", "-v", "ON_ERROR_STOP=1", "-c", sql])
    const { ownerId, ...storedInventory } = inventoryBefore
    assert.equal(ownerId, profileBefore.id)
    assert.deepEqual(JSON.parse(restored(`SELECT inventory FROM "Player" WHERE "userId"='${profileBefore.id}'`)), storedInventory, "Backup restores inventory")
    assert.equal(restored(`SELECT count(*) FROM "Receipt" WHERE "userId"='${profileBefore.id}' AND source='inventory:${open.requestId}'`), "1", "Backup includes exactly one receipt")
    assert.equal(restored('SELECT count(*) FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL'), "3", "Backup preserves migration ledger")
    assert.equal(restored(`SELECT count(*) FROM "Match" WHERE id='${room.id}'`), "1", "Backup restores authoritative match")
    unsubscribe(); unsubscribe = undefined
    globalThis.fetch = originalFetch; globalThis.WebSocket = originalSocket
    assert.equal((await fetch(origin + "/api/backend/auth/sign-out", { method: "POST", headers: { cookie, origin, "Content-Type": "application/json" }, body: "{}" })).status, 200)
    assert.equal((await fetch(origin + "/api/backend/player", { headers: { cookie } })).status, 401)
    function bundles(dir: string): string[] { return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? bundles(join(dir, entry.name)) : entry.name.endsWith(".js") ? [join(dir, entry.name)] : []) }
    for (const file of bundles(".next/static")) for (const name of ["DATABASE_URL", "DATABASE_MIGRATION_URL", "BETTER_AUTH_SECRET", "BACKEND_PROXY_SECRET"]) assert.equal(readFileSync(file, "utf8").includes(name), false, file + ":" + name)
    database.close(); databaseStopped = true
    assert.equal((await originalFetch(backendOrigin + "/health", { signal: AbortSignal.timeout(10000) })).status, 503, "Database outage fails readiness")
    console.log("Production HTTP: compiled backend + Next proxy, real PostgreSQL, two accounts, concurrent actions/receipts, graceful handler shutdown, session/inventory/match persistence, automatic WebSocket reconnect, backup/restore, database readiness, forgery/CSRF/pages and browser-secret isolation PASS. Railway/Vercel/TLS/container signal delivery remain unverified.")
  } finally {
    unsubscribe?.(); globalThis.fetch = originalFetch; globalThis.WebSocket = originalSocket
    if (previousWsUrl === undefined) delete process.env.NEXT_PUBLIC_BACKEND_WS_URL
    else process.env.NEXT_PUBLIC_BACKEND_WS_URL = previousWsUrl
    for (const child of children) child.kill()
    await Promise.all(closed.values())
    if (!databaseStopped) database.close()
  }
}
void verify().catch(error => { console.error(error); process.exitCode = 1 })
