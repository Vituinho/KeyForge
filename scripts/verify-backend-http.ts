import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { backendTestDatabase } from "./backend-test-database"
/** Production bundles, real HTTP sessions and an isolated PostgreSQL database; no remote services. */
async function verify() {
  const database = backendTestDatabase()
  const port = 33000 + Math.floor(Math.random() * 5000)
  const backendPort = 41000 + Math.floor(Math.random() * 5000)
  const origin = `http://127.0.0.1:${port}`
  const backendOrigin = `http://127.0.0.1:${backendPort}`
  const secret = "disposable-http-proxy-secret-1234567890"
  const server = spawn(process.execPath, ["backend/dist/server.mjs"], { env: { ...process.env, NODE_ENV: "test", DATABASE_URL: database.url, PORT: String(backendPort), FRONTEND_ORIGIN: origin, BACKEND_PROXY_SECRET: secret, BETTER_AUTH_SECRET: "disposable-http-auth-secret-1234567890" }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
  const frontend = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port), "--hostname", "127.0.0.1"], { env: { ...process.env, BACKEND_URL: backendOrigin, FRONTEND_ORIGIN: origin, BACKEND_PROXY_SECRET: secret }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
  let output = ""
  for (const child of [server, frontend]) {
    child.stdout.on("data", chunk => { output = (output + String(chunk)).slice(-6000) })
    child.stderr.on("data", chunk => { output = (output + String(chunk)).slice(-6000) })
  }
  const closed = [server, frontend].map(child => new Promise<void>(resolve => child.once("close", () => resolve())))
  try {
    let ready = false
    for (let attempt = 0; attempt < 80; attempt++) {
      if (server.exitCode !== null || frontend.exitCode !== null) throw new Error(output)
      try { ready = (await fetch(backendOrigin + "/health")).status === 200 && (await fetch(origin)).status === 200; if (ready) break } catch {}
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.ok(ready, output)
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
    assert.equal((await fetch(origin + "/api/backend/inventory", { method: "POST", headers: { cookie, origin, "Content-Type": "application/json" }, body: JSON.stringify({ action: "open", crateId: "basic_crate", requestId: crypto.randomUUID() }) })).status, 200)
    assert.equal((await fetch(origin + "/api/backend/auth/sign-out", { method: "POST", headers: { cookie, origin, "Content-Type": "application/json" }, body: "{}" })).status, 200)
    assert.equal((await fetch(origin + "/api/backend/player", { headers: { cookie } })).status, 401)
    function bundles(dir: string): string[] { return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? bundles(join(dir, entry.name)) : entry.name.endsWith(".js") ? [join(dir, entry.name)] : []) }
    for (const file of bundles(".next/static")) for (const name of ["DATABASE_URL", "DATABASE_MIGRATION_URL", "BETTER_AUTH_SECRET", "BACKEND_PROXY_SECRET"]) assert.equal(readFileSync(file, "utf8").includes(name), false, file + ":" + name)
    console.log("Production HTTP: compiled backend + Next proxy, real PostgreSQL, registration/session/logout, inventory, forgery, CSRF, pages and browser-secret isolation PASS. Railway/Vercel deployment remains unverified.")
  } finally { server.kill(); frontend.kill(); await Promise.all(closed); database.close() }
}
void verify().catch(error => { console.error(error); process.exitCode = 1 })
