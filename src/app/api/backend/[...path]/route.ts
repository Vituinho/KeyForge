import "server-only"
import { isIP } from "node:net"
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
function upstreamFailureCategory(error: unknown) {
  const failure = error as { name?: unknown; code?: unknown; cause?: { code?: unknown } } | null
  const value = failure?.cause?.code ?? failure?.code
  const code = typeof value === "string" ? value : ""
  if (failure?.name === "TimeoutError" || failure?.name === "AbortError" || ["ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT"].includes(code)) return "upstream_timeout"
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "upstream_dns_failure"
  if (/^(ERR_TLS_|ERR_SSL_|CERT_)/.test(code) || ["DEPTH_ZERO_SELF_SIGNED_CERT", "SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "UNABLE_TO_GET_ISSUER_CERT", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"].includes(code)) return "upstream_tls_failure"
  if (["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "EPIPE", "UND_ERR_SOCKET"].includes(code)) return "upstream_connection_failure"
  return "upstream_failure"
}
async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const target = process.env.BACKEND_URL
  const origin = process.env.FRONTEND_ORIGIN
  const failure = (error: string, status: number) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } })
  const secret = process.env.BACKEND_PROXY_SECRET
  const diagnose = (category: string) => console.error("[backend-proxy]", { category, BACKEND_URL: Boolean(target), FRONTEND_ORIGIN: Boolean(origin), BACKEND_PROXY_SECRET: Boolean(secret) })
  if (!target || !origin || (process.env.NODE_ENV === "production" && !secret)) {
    diagnose("missing_runtime_environment")
    return failure("Backend unavailable", 503)
  }
  const { path } = await context.params
  if (!path.length || path.some(part => !/^[A-Za-z0-9_-]+$/.test(part))) return Response.json({ error: "Invalid path" }, { status: 400 })
  const mutation = !["GET", "HEAD"].includes(request.method)
  if (mutation && request.headers.get("origin") !== origin) return Response.json({ error: "Forbidden origin" }, { status: 403 })
  const headers = new Headers()
  if (secret) headers.set("x-keyforge-proxy", secret)
  // Vercel overwrites this header. Local development deliberately shares a loopback bucket.
  const ip = process.env.VERCEL ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() : "127.0.0.1"
  if (ip && isIP(ip)) headers.set("x-keyforge-client-ip", ip)
  for (const name of ["cookie", "content-type", "origin", "user-agent", "accept", "x-keyforge-account"]) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  let stage: "request" | "backend_url" | "upstream" = "request"
  try {
    const chunks: Uint8Array[] = []
    let size = 0
    if (mutation && request.body) {
      const reader = request.body.getReader()
      try { for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 1048576) return Response.json({ error: "Payload too large" }, { status: 413 }); chunks.push(value) } }
      finally { await reader.cancel() }
    }
    stage = "backend_url"
    const url = new URL(`/api/${path.join("/")}`, target)
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid backend URL")
    url.search = new URL(request.url).search
    stage = "upstream"
    const upstream = await fetch(url, { method: request.method, headers, body: mutation ? Buffer.concat(chunks) : undefined, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(20000) })
    const outgoing = new Headers({ "Cache-Control": "no-store" })
    outgoing.set("Content-Type", upstream.headers.get("content-type") ?? "application/json")
    for (const cookie of upstream.headers.getSetCookie()) outgoing.append("Set-Cookie", cookie)
    return new Response(upstream.body, { status: upstream.status, headers: outgoing })
  } catch (error) {
    diagnose(stage === "backend_url" ? "invalid_backend_url" : stage === "upstream" ? upstreamFailureCategory(error) : "request_failure")
    return Response.json({ error: "Backend unavailable" }, { status: 503 })
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE }
