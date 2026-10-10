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
  const url = new URL(frontendOrigin)
  if (url.origin !== frontendOrigin || (production && url.protocol !== "https:")) throw new Error("Invalid frontend origin")
  return { databaseUrl, secret, frontendOrigin, production, port: Number(process.env.PORT ?? 4000), proxySecret }
}
