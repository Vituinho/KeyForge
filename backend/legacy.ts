import { randomUUID } from "node:crypto"
import { json, transaction, type Database } from "./database"
import { exact, uuid } from "./players"
import { createDefaultPlayerProfile } from "../src/types/player"
import { createDefaultCosmeticsState, type PlayerCosmeticsState } from "../src/types/cosmetics"
/** Operator-only, offline export import. No route exposes this service. */
export async function importLegacy(db: Database, records: unknown, archiveHash: string) {
  if (!Array.isArray(records) || records.length > 100000) throw new Error("Invalid export")
  return transaction(db, async tx => {
    let imported = 0
    for (const record of records) {
      exact(record, ["id", "email", "username", "emailVerified", "passwordHash", "createdAt", "legacy", "verified"])
      if (!uuid(record.id) || typeof record.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email) || typeof record.username !== "string" || !/^[A-Za-z0-9_-]{3,20}$/.test(record.username)) throw new Error("Invalid identity")
      const id = record.id as string
      const sourceId = `archive:${archiveHash}:${id}`
      if (await tx.legacyRecord.findUnique({ where: { sourceId } })) continue
      if (await tx.user.findUnique({ where: { id } }) || await tx.user.findUnique({ where: { email: record.email.toLowerCase() } })) throw new Error("Existing identity: reconcile manually, never overwrite")
      if (typeof record.passwordHash !== "string" || !/^\$2[aby]\$(1[0-9]|2[0-4])\$[./A-Za-z0-9]{53}$/.test(record.passwordHash)) throw new Error("Export requires an existing bcrypt password hash")
      const createdAt = new Date(String(record.createdAt))
      if (!Number.isFinite(createdAt.getTime())) throw new Error("Invalid creation date")
      const profile = { ...createDefaultPlayerProfile(record.username), id }
      let inventory = createDefaultCosmeticsState()
      let verifiedProfile: unknown = profile
      if (record.verified !== undefined) {
        // Only owner-controlled exports of the previous trusted store are eligible.
        // An audit reference is retained; browser/local snapshots belong in legacy.
        exact(record.verified, ["profile", "inventory", "auditReference", "receipts"])
        if (typeof record.verified.auditReference !== "string" || record.verified.auditReference.length < 8 || !Array.isArray(record.verified.receipts)) throw new Error("Missing verified provenance")
        exact(record.verified.profile, [...Object.keys(profile), "academyProgress", "title", "titles", "skillProfile"])
        if (record.verified.profile.id !== id || typeof record.verified.profile.level !== "number" || !Number.isInteger(record.verified.profile.level) || record.verified.profile.level < 1 || typeof record.verified.profile.totalXp !== "number" || record.verified.profile.totalXp < 0) throw new Error("Invalid verified profile")
        exact(record.verified.inventory, ["unlockedSkinIds", "equippedSkinId", "crates", "forgeShards", "updatedAt"])
        inventory = record.verified.inventory as unknown as PlayerCosmeticsState
        if (!Array.isArray(inventory.unlockedSkinIds) || !inventory.unlockedSkinIds.includes(inventory.equippedSkinId) || !Number.isInteger(inventory.forgeShards) || inventory.forgeShards < 0) throw new Error("Invalid verified inventory")
        verifiedProfile = { ...record.verified.profile, username: record.username }
      }
      await tx.user.create({ data: { id, name: record.username, usernameKey: record.username.toLowerCase(), email: record.email.toLowerCase(), emailVerified: record.emailVerified === true, createdAt } })
      await tx.account.create({ data: { id: randomUUID(), userId: id, accountId: id, providerId: "credential", password: record.passwordHash } })
      await tx.player.create({ data: { userId: id, username: record.username, usernameKey: record.username.toLowerCase(), profile: json(verifiedProfile), inventory: json(inventory) } })
      if (record.verified) for (const receipt of record.verified.receipts as unknown[]) {
        exact(receipt, ["source", "receipt"])
        if (typeof receipt.source !== "string" || !/^(battle|practice|pvp|inventory|crate|purchase):[0-9a-f-]{36}$/i.test(receipt.source) || receipt.receipt === undefined) throw new Error("Invalid archived receipt")
        await tx.receipt.create({ data: { userId: id, source: receipt.source, binding: "owner-imported-historical-receipt", receipt: json(receipt.receipt) } })
        if (/^(crate|purchase):/.test(receipt.source)) {
          const source = receipt.source.replace(/^(crate|purchase):/, "inventory:")
          await tx.receipt.upsert({ where: { userId_source: { userId: id, source } }, create: { userId: id, source, binding: "owner-imported-historical-receipt", receipt: json(receipt.receipt) }, update: {} })
        }
      }
      await tx.legacyRecord.create({ data: { sourceId, userId: id, classification: record.verified ? "owner-verified-export" : "unverified-legacy", snapshot: json(record) } })
      imported++
    }
    return { imported }
  })
}
