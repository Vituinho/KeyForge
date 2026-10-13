export interface BackendConfig {
  databaseUrl: string
  secret: string
  frontendOrigin: string
  production: boolean
  port: number
  proxySecret?: string
}
export function configuration(): BackendConfig {
  const databaseUrl = process.env.DATABASE_URL
  const secret = process.env.BETTER_AUTH_SECRET
  const frontendOrigin = process.env.FRONTEND_ORIGIN
  const production = process.env.NODE_ENV === "production"
  const proxySecret = process.env.BACKEND_PROXY_SECRET
  if (!databaseUrl || !secret || secret.length < 32 || !frontendOrigin) throw new Error("Backend configuration incomplete")
  if (production && (!proxySecret || proxySecret.length < 32)) throw new Error("Backend proxy secret missing")
  if (production && process.env.DATABASE_MIGRATION_URL) throw new Error("Migration credentials must not be present in the running backend")
  const url = new URL(frontendOrigin)
  if (url.origin !== frontendOrigin || !["http:", "https:"].includes(url.protocol) || (production && url.protocol !== "https:")) throw new Error("Invalid frontend origin")
  const port = Number(process.env.PORT ?? 4000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid backend port")
  return { databaseUrl, secret, frontendOrigin, production, port, proxySecret }
}
