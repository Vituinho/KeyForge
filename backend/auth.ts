import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError } from "better-auth/api"
import { randomUUID } from "node:crypto"
import type { Database } from "./database"
import type { BackendConfig } from "./config"
export function authentication(db: Database, config: BackendConfig) {
  return betterAuth({
    database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
    secret: config.secret,
    baseURL: config.frontendOrigin,
    basePath: "/api/backend/auth",
    trustedOrigins: [config.frontendOrigin],
    emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128 },
    session: { expiresIn: 604800, updateAge: 86400, cookieCache: { enabled: false } },
    advanced: { useSecureCookies: config.production, database: { generateId: () => randomUUID() } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
    databaseHooks: { user: { create: { before: async (user) => {
      if (!/^[A-Za-z0-9_-]{3,20}$/.test(user.name)) throw new APIError("BAD_REQUEST", { message: "INVALID_USERNAME_FORMAT" })
      if (await db.player.findUnique({ where: { usernameKey: user.name.toLowerCase() } })) throw new APIError("BAD_REQUEST", { message: "USERNAME_TAKEN" })
      return { data: user }
    } } } },
  })
}
