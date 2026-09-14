import { Enemy } from "@/types/character"
import { PlayerProfile } from "@/types/player"

export interface ScaledDifficultyMetrics {
  maxHp: number
  attack: number
  attackInterval: number
  recommendedWpm: number
  recommendedAccuracy: number
  difficulty: number
  scalingFactor: number
  isNexusMirror: boolean
}

/**
 * Calculates controlled difficulty scaling for battle encounters.
 * 
 * Rules:
 * 1. Base difficulty is dictated by the world tier and stage number.
 * 2. Player level and historical speed provide gentle, capped scaling (+15% max, -10% max)
 *    to prevent rubber-banding or frustrating walls.
 * 3. Nexus Mirror Sovereign ("nexus_mirror") specifically mirrors the player's personal best stats
 *    to create an authentic climactic trial without arbitrary handicaps.
 */
export function scaleEnemyForBattle(
  baseEnemy: Enemy,
  profile?: PlayerProfile | null
): Enemy {
  if (!profile) return { ...baseEnemy }

  const isNexusMirror = baseEnemy.id === "nexus_mirror"

  // 1. Special Boss: The Nexus Mirror reflection
  if (isNexusMirror) {
    const playerBestWpm = profile.stats?.bestWpm || profile.stats?.averageWpm || 60
    const playerAvgAcc = profile.stats?.averageAccuracy || 95

    // Calibrate target speed 3-5% above player's established baseline (clamped between 75 and 150 WPM)
    const mirroredWpm = Math.min(150, Math.max(75, Math.round(playerBestWpm * 1.04)))
    // Calibrate target accuracy to at least 97% or player average
    const mirroredAcc = Math.min(99, Math.max(97, playerAvgAcc))

    // Mirror HP scales with player level to provide a substantive final duel
    const levelBonus = Math.min(100, Math.max(0, (profile.level - 1) * 3))
    const scaledHp = baseEnemy.maxHp + levelBonus

    return {
      ...baseEnemy,
      recommendedWpm: mirroredWpm,
      recommendedAccuracy: mirroredAcc,
      maxHp: scaledHp,
      attackInterval: Math.max(2200, Math.round(baseEnemy.attackInterval * 0.95)),
    }
  }

  // 2. Standard Campaign Stages Scaling
  const playerLevel = profile.level || 1
  const playerAvgWpm = profile.stats?.averageWpm || 0
  const stageNum = baseEnemy.stage ?? 1

  // Small positive scaling if player is significantly out-leveling the stage (up to +15% HP)
  let hpMultiplier = 1.0
  if (playerLevel > stageNum * 4 && playerAvgWpm > baseEnemy.recommendedWpm + 15) {
    hpMultiplier = Math.min(1.15, 1.0 + (playerLevel - stageNum * 4) * 0.01)
  } else if (playerAvgWpm > 0 && playerAvgWpm < baseEnemy.recommendedWpm - 15) {
    // Gentle assistance if player is struggling (max -10% HP)
    hpMultiplier = 0.9
  }

  const scaledHp = Math.round(baseEnemy.maxHp * hpMultiplier)

  return {
    ...baseEnemy,
    maxHp: scaledHp,
  }
}

/**
 * Computes difference between player attributes and enemy requirements for UI telemetry.
 */
export function getDifficultyDelta(
  enemy: Enemy,
  profile?: PlayerProfile | null
): {
  wpmDelta: number
  accuracyDelta: number
  isReady: boolean
} {
  if (!profile) {
    return { wpmDelta: 0, accuracyDelta: 0, isReady: true }
  }

  const playerWpm = profile.stats?.averageWpm || 0
  const playerAcc = profile.stats?.averageAccuracy || 100

  const wpmDelta = playerWpm - enemy.recommendedWpm
  const accuracyDelta = playerAcc - enemy.recommendedAccuracy
  const isReady = wpmDelta >= -5 && accuracyDelta >= -3

  return {
    wpmDelta,
    accuracyDelta,
    isReady,
  }
}
