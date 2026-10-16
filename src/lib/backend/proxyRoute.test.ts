import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { test } from "node:test"
import { runInNewContext } from "node:vm"
import { transformSync } from "esbuild"

// Exercise the actual handler in a server sandbox, omitting only Next's build marker.
const source = readFileSync(resolve("src/app/api/backend/[...path]/route.ts"), "utf8")
const code = transformSync(source.replace('import "server-only"', ""), { loader: "ts", format: "cjs", target: "node24" }).code
const environment = { NODE_ENV: "production", BACKEND_URL: "https://backend.example.test", FRONTEND_ORIGIN: "https://frontend.example.test", BACKEND_PROXY_SECRET: "private-proxy-secret" }
const context = { params: Promise.resolve({ path: ["auth", "sign-in", "email"] }) }
const request = () => new Request(environment.FRONTEND_ORIGIN + "/api/backend/auth/sign-in/email", { method: "POST", headers: { origin: environment.FRONTEND_ORIGIN, cookie: "private-session-cookie", "Content-Type": "application/json", "x-keyforge-proxy": "forged-secret", "x-keyforge-client-ip": "1.2.3.4" }, body: JSON.stringify({ password: "private-password" }) })

function harness(overrides: Record<string, string | undefined> = {}, fetcher: typeof fetch = async () => { throw new Error("Unexpected upstream request") }) {
  const logs: unknown[][] = []
  const exports = {}
  const runtimeModule = { exports }
  runInNewContext(code, { exports, module: runtimeModule, require: createRequire(resolve("package.json")), process: { env: { ...environment, ...overrides } }, console: { error: (...values: unknown[]) => logs.push(values) }, Buffer, URL, Headers, Response, AbortSignal, fetch: fetcher })
  return { handlers: runtimeModule.exports as { POST: (request: Request, context: { params: Promise<{ path: string[] }> }) => Promise<Response> }, logs }
}

function assertDiagnostic(logs: unknown[][], category: string, presence = { BACKEND_URL: true, FRONTEND_ORIGIN: true, BACKEND_PROXY_SECRET: true }) {
  // An exact allowlist prevents future additions of error objects, URLs or headers.
  assert.equal(JSON.stringify(logs), JSON.stringify([["[backend-proxy]", { category, ...presence }]]))
}

for (const variable of ["BACKEND_URL", "FRONTEND_ORIGIN", "BACKEND_PROXY_SECRET"] as const) {
  test(`missing ${variable} logs presence only and fails closed`, async () => {
    const { handlers, logs } = harness({ [variable]: undefined })
    const response = await handlers.POST(request(), context)
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: "Backend unavailable" })
    assert.equal(response.headers.get("Cache-Control"), "no-store")
    assertDiagnostic(logs, "missing_runtime_environment", { BACKEND_URL: true, FRONTEND_ORIGIN: true, BACKEND_PROXY_SECRET: true, [variable]: false })
  })
}

for (const target of ["not-a-url/private-configuration", "ftp://backend.example.test", "https://private-user:private-password@backend.example.test"]) {
  test(`invalid backend configuration is sanitized (${target.split(":")[0]})`, async () => {
    const { handlers, logs } = harness({ BACKEND_URL: target })
    const response = await handlers.POST(request(), context)
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: "Backend unavailable" })
    assertDiagnostic(logs, "invalid_backend_url")
  })
}

const failures: [unknown, string][] = [
  [{ cause: { code: "ENOTFOUND" } }, "upstream_dns_failure"],
  [{ cause: { code: "EAI_AGAIN" } }, "upstream_dns_failure"],
  [{ cause: { code: "ECONNREFUSED" } }, "upstream_connection_failure"],
  [{ cause: { code: "ECONNRESET" } }, "upstream_connection_failure"],
  [{ cause: { code: "UND_ERR_SOCKET" } }, "upstream_connection_failure"],
  [{ cause: { code: "ERR_TLS_CERT_ALTNAME_INVALID" } }, "upstream_tls_failure"],
  [{ cause: { code: "DEPTH_ZERO_SELF_SIGNED_CERT" } }, "upstream_tls_failure"],
  [{ code: "CERT_HAS_EXPIRED" }, "upstream_tls_failure"],
  [{ name: "TimeoutError" }, "upstream_timeout"],
  [{ name: "AbortError" }, "upstream_timeout"],
  [{ cause: { code: "UND_ERR_CONNECT_TIMEOUT" } }, "upstream_timeout"],
  [{ cause: { code: "ETIMEDOUT" } }, "upstream_timeout"],
  [{ cause: { code: "private-unknown-error-code" } }, "upstream_failure"],
  [null, "upstream_failure"],
]
for (const [failure, category] of failures) {
  test(`upstream failure logs only sanitized ${category}`, async () => {
    const error = failure === null ? null : { ...failure as object, message: "private-password private-session-cookie", stack: "private-stack" }
    const { handlers, logs } = harness({}, async () => { throw error })
    const response = await handlers.POST(request(), context)
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: "Backend unavailable" })
    assertDiagnostic(logs, category)
  })
}

test("origin and path rejection never reach upstream or log sensitive input", async () => {
  const { handlers, logs } = harness()
  const foreign = new Request(request(), { headers: { origin: "https://untrusted.example.test" } })
  assert.equal((await handlers.POST(foreign, context)).status, 403)
  assert.equal((await handlers.POST(request(), { params: Promise.resolve({ path: [".."] }) })).status, 400)
  assert.deepEqual(logs, [])
})

test("successful forwarding preserves cookies, body, secret validation and timeout", async () => {
  const { handlers, logs } = harness({}, async (input, options) => {
    assert.equal(String(input), environment.BACKEND_URL + "/api/auth/sign-in/email")
    const headers = options?.headers as Headers
    assert.equal(headers.get("x-keyforge-proxy"), environment.BACKEND_PROXY_SECRET)
    assert.equal(headers.get("x-keyforge-client-ip"), "127.0.0.1")
    assert.equal(headers.get("cookie"), "private-session-cookie")
    assert.equal(headers.get("origin"), environment.FRONTEND_ORIGIN)
    assert.equal(Buffer.from(options?.body as Buffer).toString(), JSON.stringify({ password: "private-password" }))
    assert.equal(options?.redirect, "manual")
    assert.equal(options?.cache, "no-store")
    assert.ok(options?.signal)
    return new Response('{"ok":true}', { headers: { "Set-Cookie": "session=private-response-cookie; HttpOnly; Secure" } })
  })
  const response = await handlers.POST(request(), context)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("Set-Cookie"), "session=private-response-cookie; HttpOnly; Secure")
  assert.equal(response.headers.get("Cache-Control"), "no-store")
  assert.deepEqual(await response.json(), { ok: true })
  assert.deepEqual(logs, [])
})

test("an upstream HTTP error remains upstream status without a fabricated transport failure", async () => {
  const { handlers, logs } = harness({}, async () => new Response('{"error":"Unauthorized"}', { status: 401 }))
  const response = await handlers.POST(request(), context)
  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: "Unauthorized" })
  assert.deepEqual(logs, [])
})

test("development retains the existing optional proxy-secret behavior", async () => {
  const { handlers, logs } = harness({ NODE_ENV: "development", BACKEND_PROXY_SECRET: undefined }, async () => Response.json({ ok: true }))
  assert.equal((await handlers.POST(request(), context)).status, 200)
  assert.deepEqual(logs, [])
})
