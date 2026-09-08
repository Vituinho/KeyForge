/**
 * KeyForge Cloud Cosmetics Storage
 * Synchronizes cosmetic unlocks, equipped skin, shards, crates, and keyboard settings with Supabase.
 */

import { getSupabaseClient } from "@/lib/supabase/client"
import {
  PlayerCosmeticsState,
  KeyboardAccessibilitySettings,
  DEFAULT_STARTER_SKIN_IDS,
  DEFAULT_EQUIPPED_SKIN_ID,
  CosmeticUnlockResult,
} from "@/types/cosmetics"
import { ProfileRow, UserCosmeticRow, PlayerCrateRow } from "@/types/database"
import { getSkinById } from "@/data/keyboardSkins"

/**
 * Fetch cosmetics state for an authenticated user from Supabase.
 */
export async function fetchCloudCosmetics(userId: string): Promise<PlayerCosmeticsState | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    // 1. Fetch Profile fields (equipped skin, forge shards, settings)
    const { data: profileRow, error: profileErr } = await supabase
      .from("profiles")
      .select("equipped_keyboard_skin, forge_shards, keyboard_settings")
      .eq("id", userId)
      .maybeSingle()

    if (profileErr) {
      console.warn("[CloudCosmetics] Error fetching profile cosmetics:", profileErr)
      return null
    }

    const p = profileRow as Partial<ProfileRow> | null

    // 2. Fetch Unlocked Cosmetics
    const { data: cosmeticsRows, error: cosmeticsErr } = await supabase
      .from("user_cosmetics")
      .select("cosmetic_id")
      .eq("user_id", userId)
      .eq("cosmetic_type", "keyboard_skin")

    if (cosmeticsErr) {
      console.warn("[CloudCosmetics] Error fetching user cosmetics:", cosmeticsErr)
    }

    const unlockedSet = new Set<string>(DEFAULT_STARTER_SKIN_IDS)
    if (Array.isArray(cosmeticsRows)) {
      (cosmeticsRows as Pick<UserCosmeticRow, "cosmetic_id">[]).forEach((row) => {
        if (row.cosmetic_id) unlockedSet.add(row.cosmetic_id)
      })
    }

    // 3. Fetch Crates
    const { data: cratesRows, error: cratesErr } = await supabase
      .from("player_crates")
      .select("crate_id, quantity")
      .eq("user_id", userId)

    if (cratesErr) {
      console.warn("[CloudCosmetics] Error fetching player crates:", cratesErr)
    }

    const cratesMap: Record<string, number> = {}
    if (Array.isArray(cratesRows)) {
      (cratesRows as Pick<PlayerCrateRow, "crate_id" | "quantity">[]).forEach((row) => {
        cratesMap[row.crate_id] = row.quantity
      })
    }

    const cloudState: PlayerCosmeticsState = {
      unlockedSkinIds: Array.from(unlockedSet),
      equippedSkinId: p?.equipped_keyboard_skin || DEFAULT_EQUIPPED_SKIN_ID,
      crates: cratesMap,
      forgeShards: typeof p?.forge_shards === "number" ? p.forge_shards : 50,
      updatedAt: new Date().toISOString(),
    }

    return cloudState
  } catch (err) {
    console.error("[CloudCosmetics] Unexpected error fetching cloud cosmetics:", err)
    return null
  }
}

/**
 * Save newly equipped skin to Supabase.
 */
export async function saveEquippedSkinCloud(userId: string, skinId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        equipped_keyboard_skin: skinId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) {
      console.warn("[CloudCosmetics] Failed to update equipped skin:", error)
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Save accessibility settings to Supabase.
 */
export async function saveAccessibilitySettingsCloud(
  userId: string,
  settings: KeyboardAccessibilitySettings
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        keyboard_settings: settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    return !error
  } catch {
    return false
  }
}

/**
 * Add a cosmetic unlock to user_cosmetics table in Supabase.
 */
export async function unlockCosmeticCloud(userId: string, cosmeticId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase.from("user_cosmetics").insert({
      user_id: userId,
      cosmetic_id: cosmeticId,
      cosmetic_type: "keyboard_skin",
    })

    if (error && !error.message.includes("unique")) {
      console.warn("[CloudCosmetics] Error inserting cosmetic unlock:", error)
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Update crate quantity in Supabase.
 */
export async function updateCrateCloud(
  userId: string,
  crateId: string,
  quantity: number
): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from("player_crates")
      .upsert(
        {
          user_id: userId,
          crate_id: crateId,
          quantity: Math.max(0, quantity),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,crate_id" }
      )

    return !error
  } catch {
    return false
  }
}

/**
 * Update forge shards in Supabase.
 */
export async function updateShardsCloud(userId: string, newShards: number): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        forge_shards: Math.max(0, newShards),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    return !error
  } catch {
    return false
  }
}

/**
 * Synchronize local cosmetic state with cloud on login.
 * Safely merges local unlocks and crates without losing any items.
 */
export async function syncLocalToCloud(
  userId: string,
  localState: PlayerCosmeticsState
): Promise<PlayerCosmeticsState> {
  const cloud = await fetchCloudCosmetics(userId)

  if (!cloud) {
    // If no cloud state yet, initialize cloud with local state
    const starterInserts = localState.unlockedSkinIds.map((id) => ({
      user_id: userId,
      cosmetic_id: id,
      cosmetic_type: "keyboard_skin",
    }))

    const supabase = getSupabaseClient()
    if (supabase && starterInserts.length > 0) {
      await supabase.from("user_cosmetics").upsert(starterInserts)
      await saveEquippedSkinCloud(userId, localState.equippedSkinId)
      await updateShardsCloud(userId, localState.forgeShards)
      for (const [crateId, count] of Object.entries(localState.crates)) {
        await updateCrateCloud(userId, crateId, count)
      }
    }
    return localState
  }

  // Merge unlocked skins: Union of local + cloud
  const mergedUnlocked = Array.from(new Set([...cloud.unlockedSkinIds, ...localState.unlockedSkinIds]))

  // Merge shards: Max of local or cloud
  const mergedShards = Math.max(cloud.forgeShards, localState.forgeShards)

  // Merge crates: Sum or max
  const mergedCrates: Record<string, number> = { ...cloud.crates }
  for (const [cId, count] of Object.entries(localState.crates)) {
    mergedCrates[cId] = Math.max(mergedCrates[cId] ?? 0, count)
  }

  const mergedEquipped = cloud.unlockedSkinIds.includes(localState.equippedSkinId)
    ? localState.equippedSkinId
    : cloud.equippedSkinId

  const mergedState: PlayerCosmeticsState = {
    unlockedSkinIds: mergedUnlocked,
    equippedSkinId: mergedEquipped,
    crates: mergedCrates,
    forgeShards: mergedShards,
    updatedAt: new Date().toISOString(),
  }

  // Sync back to cloud in background
  const newUnlocksToPush = localState.unlockedSkinIds.filter((id) => !cloud.unlockedSkinIds.includes(id))
  if (newUnlocksToPush.length > 0) {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from("user_cosmetics").upsert(
        newUnlocksToPush.map((id) => ({
          user_id: userId,
          cosmetic_id: id,
          cosmetic_type: "keyboard_skin",
        }))
      )
    }
  }

  if (mergedShards > cloud.forgeShards) {
    await updateShardsCloud(userId, mergedShards)
  }

  if (mergedEquipped !== cloud.equippedSkinId) {
    await saveEquippedSkinCloud(userId, mergedEquipped)
  }

  return mergedState
}

/**
 * Opens a player crate via server-authoritative Supabase RPC.
 * Falls back to null if RPC is not deployed yet or fails, allowing graceful client fallback.
 */
export async function openCrateCloud(
  crateId: string
): Promise<CosmeticUnlockResult | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase.rpc("open_player_crate", {
      p_crate_id: crateId,
    })

    if (!error && data && typeof data === "object") {
      const res = data as {
        success: boolean
        skin_id: string
        is_duplicate: boolean
        shards_awarded: number
        remaining_crates: number
        new_shards_balance: number
      }

      if (res.success && res.skin_id) {
        return {
          skin: getSkinById(res.skin_id),
          isDuplicate: res.is_duplicate,
          shardsAwarded: res.shards_awarded,
        }
      }
    }

    if (error) {
      console.warn("[CloudCosmetics] open_player_crate RPC notice:", error.message)
    }
  } catch (err) {
    console.warn("[CloudCosmetics] Unexpected RPC error:", err)
  }

  return null
}

