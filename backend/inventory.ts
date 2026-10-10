import { randomInt } from "node:crypto"
import { ALL_CRATES } from "../src/data/crates"
import { ALL_KEYBOARD_SKINS } from "../src/data/keyboardSkins"
import { json, transaction, type Database } from "./database"
import { exact, inventoryOf, player, uuid } from "./players"
import { binding } from "./progression"
export async function inventoryAction(db: Database, userId: string, input: unknown) {
  exact(input, ["action", "skinId", "crateId", "requestId"])
  return transaction(db, async tx => {
    const row = await player(tx, userId)
    const inventory = inventoryOf(row)
    if (input.action === "equip") {
      exact(input, ["action", "skinId"])
      if (typeof input.skinId !== "string" || !inventory.unlockedSkinIds.includes(input.skinId)) throw new Error("Unowned skin")
      inventory.equippedSkinId = input.skinId
      await tx.player.update({ where: { userId }, data: { inventory: json(inventory) } })
      return { success: true }
    }
    exact(input, ["action", "crateId", "requestId"])
    if (!["open", "purchase"].includes(String(input.action)) || !uuid(input.requestId)) throw new Error("Invalid inventory operation")
    const source = `inventory:${input.requestId}`
    const digest = binding(input)
    const cached = await tx.receipt.findUnique({ where: { userId_source: { userId, source } } })
    if (cached) { if (cached.binding !== digest) throw new Error("Replay changed"); return cached.receipt }
    const crate = ALL_CRATES.find(value => value.id === input.crateId)
    if (!crate) throw new Error("Unknown crate")
    let receipt: unknown = { success: true }
    if (input.action === "purchase") {
      if (inventory.forgeShards < crate.costShards) throw new Error("Insufficient currency")
      inventory.forgeShards -= crate.costShards
      inventory.crates[crate.id] = (inventory.crates[crate.id] ?? 0) + 1
    } else {
      if (!(inventory.crates[crate.id] > 0)) throw new Error("No crate")
      inventory.crates[crate.id]--
      const total = crate.dropWeights.reduce((sum, item) => sum + item.weight, 0)
      const roll = randomInt(1000000) / 1000000 * total
      let cumulative = 0
      const rarity = crate.dropWeights.find(entry => { cumulative += entry.weight; return roll < cumulative })?.rarity ?? crate.dropWeights[0].rarity
      const tier = ALL_KEYBOARD_SKINS.filter(skin => skin.rarity === rarity)
      const pool = tier.length ? tier : ALL_KEYBOARD_SKINS
      const unowned = pool.filter(skin => !inventory.unlockedSkinIds.includes(skin.id))
      const candidates = unowned.length ? unowned : pool
      const skin = candidates[randomInt(candidates.length)]
      const duplicate = inventory.unlockedSkinIds.includes(skin.id)
      const shards = duplicate ? skin.shardsValue : 0
      if (!duplicate) inventory.unlockedSkinIds.push(skin.id)
      inventory.forgeShards += shards
      receipt = { success: true, skin_id: skin.id, is_duplicate: duplicate, shards_awarded: shards }
    }
    inventory.updatedAt = new Date().toISOString()
    await tx.player.update({ where: { userId }, data: { inventory: json(inventory), version: { increment: 1 } } })
    await tx.receipt.create({ data: { userId, source, binding: digest, receipt: json(receipt) } })
    return receipt
  })
}
