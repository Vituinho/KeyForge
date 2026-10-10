import assert from "node:assert/strict"
import { backendTestDatabase } from "./backend-test-database"
import { createApp } from "../backend/app"
async function main() {
const database = backendTestDatabase()
console.log("Disposable PostgreSQL migrated")
const origin = "http://localhost:3000"
const { app, db } = await createApp({ databaseUrl: database.url, frontendOrigin: origin, secret: "test-secret-for-disposable-database-only-123", production: false, port: 0 })
console.log("Backend created")
try {
  const registered = await app.inject({ method: "POST", url: "/api/auth/sign-up/email", headers: { origin }, payload: { email: "alice@example.test", password: "correct-horse-battery", name: "Alice" } })
  console.log("Registration response", registered.statusCode)
  assert.equal(registered.statusCode, 200, registered.body)
  const cookie = registered.cookies.map(value => `${value.name}=${value.value}`).join("; ")
  assert.ok(cookie.includes("session_token"))
  assert.equal((await app.inject({ url: "/api/auth/get-session", headers: { cookie } })).json().user.name, "Alice")
  const profile = await app.inject({ url: "/api/player", headers: { cookie } })
  assert.equal(profile.statusCode, 200, profile.body)
  assert.equal(profile.json().level, 1)
  assert.equal(await db.player.count(), 1)
  assert.equal((await app.inject({ url: "/api/player" })).statusCode, 401)
  assert.equal((await app.inject({ method: "PATCH", url: "/api/preferences", headers: { cookie, origin }, payload: { xp: 99999 } })).statusCode, 422)
  assert.equal((await app.inject({ method: "PATCH", url: "/api/preferences", headers: { cookie, origin: "https://evil.test" }, payload: { username: "Hacked" } })).statusCode, 403)
  assert.equal((await app.inject({ method: "POST", url: "/api/auth/sign-out", headers: { cookie, origin }, payload: {} })).statusCode, 200)
  assert.equal((await app.inject({ url: "/api/player", headers: { cookie } })).statusCode, 401)
  const login = await app.inject({ method: "POST", url: "/api/auth/sign-in/email", headers: { origin }, payload: { email: "alice@example.test", password: "correct-horse-battery" } })
  assert.equal(login.statusCode, 200, login.body)
  console.log("Backend auth: registration, login, logout, durable sessions, owner-only profiles and CSRF verified against PostgreSQL")
} finally { await app.close(); database.close() }
}
void main().catch(error => { console.error(error); process.exitCode = 1 })
