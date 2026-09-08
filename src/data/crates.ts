/**
 * KeyForge Gameplay Loot Crates & Drop Tables
 * 100% cosmetic: zero gameplay advantage.
 * Features 4 crate tiers, weighted drop tables, and Forge Shards duplicate salvage protection.
 */

import {
  CrateDefinition,
  SkinRarity,
  CosmeticUnlockResult,
} from "@/types/cosmetics"
import { ALL_KEYBOARD_SKINS } from "./keyboardSkins"

export interface CrateDetails extends CrateDefinition {
  color: string
  borderColor: string
  bgGlow: string
  costShards: number
}

export const ALL_CRATES: CrateDetails[] = [
  {
    id: "basic_crate",
    type: "basic",
    name: "Basic Forged Crate",
    description: "Standard supply cache forged from basic alloy minerals. Contains common to rare skins.",
    icon: "📦",
    color: "#a3a3a3",
    borderColor: "border-neutral-600",
    bgGlow: "rgba(163,163,163,0.15)",
    costShards: 100,
    guaranteedMinRarity: "common",
    dropWeights: [
      { rarity: "common", weight: 70 },
      { rarity: "uncommon", weight: 23 },
      { rarity: "rare", weight: 6.5 },
      { rarity: "epic", weight: 0.5 },
      { rarity: "legendary", weight: 0 },
      { rarity: "mythic", weight: 0 },
      { rarity: "secret", weight: 0 },
    ],
  },
  {
    id: "shinobi_crate",
    type: "shinobi",
    name: "Shinobi Secret Crate",
    description: "Ancient shinobi scroll crate holding elemental chakra and jutsu-infused keyboard skins.",
    icon: "📜",
    color: "#10b981",
    borderColor: "border-emerald-500",
    bgGlow: "rgba(16,185,129,0.2)",
    costShards: 250,
    guaranteedMinRarity: "uncommon",
    dropWeights: [
      { rarity: "common", weight: 45 },
      { rarity: "uncommon", weight: 35 },
      { rarity: "rare", weight: 14 },
      { rarity: "epic", weight: 5 },
      { rarity: "legendary", weight: 0.9 },
      { rarity: "mythic", weight: 0.1 },
      { rarity: "secret", weight: 0 },
    ],
  },
  {
    id: "elite_crate",
    type: "elite",
    name: "Elite Ronin Crate",
    description: "High-grade chest containing battle-hardened rare, epic, and legendary armaments.",
    icon: "⚔️",
    color: "#a855f7",
    borderColor: "border-purple-500",
    bgGlow: "rgba(168,85,247,0.25)",
    costShards: 600,
    guaranteedMinRarity: "rare",
    dropWeights: [
      { rarity: "rare", weight: 60 },
      { rarity: "epic", weight: 30 },
      { rarity: "legendary", weight: 8.5 },
      { rarity: "mythic", weight: 1.4 },
      { rarity: "secret", weight: 0.1 },
    ],
  },
  {
    id: "mythic_crate",
    type: "mythic",
    name: "Celestial Mythic Crate",
    description: "Transcendent divine vault containing exclusively epic, legendary, mythic, and secret skins.",
    icon: "👑",
    color: "#f59e0b",
    borderColor: "border-amber-400",
    bgGlow: "rgba(245,158,11,0.35)",
    costShards: 1800,
    guaranteedMinRarity: "epic",
    dropWeights: [
      { rarity: "epic", weight: 45 },
      { rarity: "legendary", weight: 40 },
      { rarity: "mythic", weight: 13 },
      { rarity: "secret", weight: 2 },
    ],
  },
]

export function getCrateById(id: string): CrateDetails {
  return ALL_CRATES.find((c) => c.id === id) ?? ALL_CRATES[0]
}

/**
 * Deterministic or weighted loot roll algorithm.
 * Guarantees duplicate salvage into Forge Shards.
 */
export function rollCrateDrop(
  crateId: string,
  unlockedSkinIds: string[]
): CosmeticUnlockResult {
  const crate = getCrateById(crateId)

  // 1. Calculate cumulative weights
  const totalWeight = crate.dropWeights.reduce((sum, item) => sum + item.weight, 0)
  const randomPick = Math.random() * totalWeight

  let currentThreshold = 0
  let chosenRarity: SkinRarity = crate.dropWeights[0].rarity

  for (const entry of crate.dropWeights) {
    currentThreshold += entry.weight
    if (randomPick <= currentThreshold) {
      chosenRarity = entry.rarity
      break
    }
  }

  // 2. Filter pool of skins for that chosen rarity
  let skinPool = ALL_KEYBOARD_SKINS.filter((skin) => skin.rarity === chosenRarity)

  // Fallback to all skins if chosen rarity pool is unexpectedly empty
  if (skinPool.length === 0) {
    skinPool = ALL_KEYBOARD_SKINS
  }

  // Prefer unowned skins if available in that rarity tier to improve player satisfaction
  const unownedInPool = skinPool.filter((skin) => !unlockedSkinIds.includes(skin.id))
  const poolToPickFrom = unownedInPool.length > 0 ? unownedInPool : skinPool

  const randomIndex = Math.floor(Math.random() * poolToPickFrom.length)
  const chosenSkin = poolToPickFrom[randomIndex] ?? skinPool[0]

  // 3. Duplicate Protection & Salvage
  const isDuplicate = unlockedSkinIds.includes(chosenSkin.id)
  const shardsAwarded = isDuplicate ? chosenSkin.shardsValue : 0

  return {
    skin: chosenSkin,
    isDuplicate,
    shardsAwarded,
  }
}
