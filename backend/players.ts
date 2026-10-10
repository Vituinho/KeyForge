import { createDefaultPlayerProfile, type PlayerProfile } from "../src/types/player"
import { createDefaultCosmeticsState, type PlayerCosmeticsState } from "../src/types/cosmetics"
import { json, type Transaction } from "./database"
export async function player(tx: Transaction, userId: string) {
  const existing = await tx.player.findUnique({ where: { userId } })
  if (existing) return existing
  const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
  const profile = { ...createDefaultPlayerProfile(user.name), id: userId }
  return tx.player.create({ data: { userId, username: user.name, usernameKey: user.name.toLowerCase(), profile: json(profile), inventory: json(createDefaultCosmeticsState()) } })
}
export function profileOf(row: { profile: unknown; username: string }): PlayerProfile {
  return { ...(row.profile as PlayerProfile), username: row.username }
}
export const inventoryOf = (row: { inventory: unknown }) => row.inventory as PlayerCosmeticsState
export function exact(value: unknown, fields: string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(key => !fields.includes(key))) throw new Error("Invalid request")
}
export const uuid = (value: unknown) => typeof value === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
