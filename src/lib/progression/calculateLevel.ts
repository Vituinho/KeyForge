/**
 * Leveling curve configuration.
 *
 * xpRequired(level) = BASE_XP + ((level - 1) * XP_GROWTH_PER_LEVEL)
 *   Level 1 -> 2: 100 XP
 *   Level 2 -> 3: 150 XP
 *   Level 3 -> 4: 200 XP
 *   Level 4 -> 5: 250 XP
 */
export const BASE_XP_PER_LEVEL = 100
export const XP_GROWTH_PER_LEVEL = 50

/**
 * Calculates XP required to advance from `level` to `level + 1`.
 */
export function getXpRequiredForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level))
  return BASE_XP_PER_LEVEL + (safeLevel - 1) * XP_GROWTH_PER_LEVEL
}

export interface LevelProgressionResult {
  newLevel: number
  newXp: number
  levelsGained: number
  didLevelUp: boolean
  xpRequired: number
}

/**
 * Applies gained XP to current level and current XP, handling multi-level overflow without losing XP.
 */
export function applyXpGain(
  currentLevel: number,
  currentXp: number,
  xpGained: number
): LevelProgressionResult {
  let level = Math.max(1, Math.floor(currentLevel))
  let xp = Math.max(0, Math.floor(currentXp)) + Math.max(0, Math.floor(xpGained))
  let levelsGained = 0

  while (true) {
    const needed = getXpRequiredForLevel(level)
    if (xp >= needed) {
      xp -= needed
      level += 1
      levelsGained += 1
    } else {
      break
    }
  }

  return {
    newLevel: level,
    newXp: xp,
    levelsGained,
    didLevelUp: levelsGained > 0,
    xpRequired: getXpRequiredForLevel(level),
  }
}
