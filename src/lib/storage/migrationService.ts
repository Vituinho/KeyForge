import { PlayerProfile } from "@/types/player"
import { savePlayerProfile } from "./playerStorage"
import { saveCloudPlayerProfile } from "./cloudPlayerStorage"

/**
 * Checks if a player profile has meaningful gameplay progression.
 */
export function hasMeaningfulProgress(profile: PlayerProfile | null | undefined): boolean {
  if (!profile) return false
  return (
    profile.level > 1 ||
    profile.stats.battlesPlayed > 0 ||
    profile.stats.totalCharactersTyped > 0 ||
    (profile.campaignProgress?.naruto?.completedStages?.length ?? 0) > 0 ||
    (profile.achievements?.length ?? 0) > 0
  )
}

/**
 * Detects whether local save and cloud save have diverging progression that requires user decision.
 */
export function hasSaveConflict(
  localProfile: PlayerProfile | null | undefined,
  cloudProfile: PlayerProfile | null | undefined
): boolean {
  if (!localProfile || !cloudProfile) return false

  const localHasProgress = hasMeaningfulProgress(localProfile)
  const cloudHasProgress = hasMeaningfulProgress(cloudProfile)

  // Only conflict if BOTH have meaningful progress
  if (!localHasProgress || !cloudHasProgress) return false

  // Check if there is actual divergence
  const isDivergent =
    localProfile.level !== cloudProfile.level ||
    localProfile.stats.battlesWon !== cloudProfile.stats.battlesWon ||
    localProfile.stats.battlesPlayed !== cloudProfile.stats.battlesPlayed ||
    Math.abs(localProfile.stats.bestWpm - cloudProfile.stats.bestWpm) > 2

  return isDivergent
}

/**
 * Migrates a guest's local progression to their newly authenticated cloud account.
 */
export async function autoMigrateLocalToCloud(
  userId: string,
  username: string,
  localProfile: PlayerProfile
): Promise<PlayerProfile> {
  const migrated: PlayerProfile = {
    ...localProfile,
    id: userId,
    username: username || localProfile.username,
    updatedAt: new Date().toISOString(),
  }

  // Save to cloud
  await saveCloudPlayerProfile(userId, migrated)

  // Save to local storage
  savePlayerProfile(migrated)

  return migrated
}

/**
 * Discards local save and accepts the cloud save.
 */
export function resolveKeepCloud(cloudProfile: PlayerProfile): void {
  savePlayerProfile(cloudProfile)
}

/**
 * Overwrites the cloud save with local device progress.
 */
export async function resolveOverwriteCloud(
  userId: string,
  localProfile: PlayerProfile
): Promise<void> {
  const updated: PlayerProfile = {
    ...localProfile,
    id: userId,
    updatedAt: new Date().toISOString(),
  }
  await saveCloudPlayerProfile(userId, updated)
  savePlayerProfile(updated)
}
