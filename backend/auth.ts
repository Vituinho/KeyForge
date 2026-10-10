import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError } from "better-auth/api"
import { randomUUID } from "node:crypto"
import { compare } from "bcryptjs"
import { hashPassword, verifyPassword } from "better-auth/crypto"
import type { Database } from "./database"
import type { BackendConfig } from "./config"
export function authentication(db: Database, config: BackendConfig) {
  return betterAuth({
    database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
    secret: config.secret,
    baseURL: config.frontendOrigin,
    basePath: "/api/backend/auth",
    trustedOrigins: [config.frontendOrigin],
    user: { additionalFields: { usernameKey: { type: "string", required: false, input: false } } },
    emailAndPassword: { enabled: true, minPasswordLength: 8, maxPasswordLength: 128,
      password: { hash: hashPassword, verify: async ({ hash, password }) => /^\$2[aby]\$/.test(hash) ? Buffer.byteLength(password, "utf8") <= 72 && compare(password, hash) : verifyPassword({ hash, password }) } },
    session: { expiresIn: 604800, updateAge: 86400, cookieCache: { enabled: false } },
    advanced: { useSecureCookies: config.production, database: { generateId: () => randomUUID() }, ipAddress: { ipAddressHeaders: ["x-keyforge-client-ip"] } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 30, customRules: {
      "/sign-up/email": { window: 60, max: 6 }, "/sign-in/email": { window: 60, max: 10 },
    } },
    databaseHooks: { user: { create: { before: async (user) => {
      if (!/^[A-Za-z0-9_-]{3,20}$/.test(user.name)) throw new APIError("BAD_REQUEST", { message: "INVALID_USERNAME_FORMAT" })
      if (await db.user.findUnique({ where: { usernameKey: user.name.toLowerCase() } })) throw new APIError("BAD_REQUEST", { message: "USERNAME_TAKEN" })
      return { data: { ...user, usernameKey: user.name.toLowerCase() } }
    } } } },
  })
}
