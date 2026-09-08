/**
 * KeyForge Multiplayer Match Configuration & Battle Tuning Rules
 */

export interface MultiplayerMatchConfig {
  initialHealth: number
  countdownSeconds: number
  baseDamagePerWord: number
  wordsPerMatch: number
  errorChakraRecoilMs: number
  errorHealthPenalty: number
  minComboMultiplier: number
  maxComboMultiplier: number
  comboStep: number
  ultimateGainPerWord: number
  maxUltimateCharge: number
  roundTimeoutSeconds: number
}

export const DEFAULT_MULTIPLAYER_CONFIG: MultiplayerMatchConfig = {
  initialHealth: 1000,
  countdownSeconds: 3,
  baseDamagePerWord: 35,
  wordsPerMatch: 30,
  errorChakraRecoilMs: 500, // 0.5s lockout on typo
  errorHealthPenalty: 15, // chip damage on mistake
  minComboMultiplier: 1.0,
  maxComboMultiplier: 2.5,
  comboStep: 10, // increments multiplier every 10 combo
  ultimateGainPerWord: 5, // +5% ultimate charge per correct word
  maxUltimateCharge: 100,
  roundTimeoutSeconds: 90,
}

/**
 * Calculates dynamic damage dealt for completing a word with an active combo streak.
 */
export function calculateWordDamage(
  combo: number,
  config: MultiplayerMatchConfig = DEFAULT_MULTIPLAYER_CONFIG
): number {
  const bonusSteps = Math.floor(Math.max(0, combo) / config.comboStep)
  const multiplier = Math.min(
    config.maxComboMultiplier,
    config.minComboMultiplier + bonusSteps * 0.25
  )
  return Math.round(config.baseDamagePerWord * multiplier)
}

/**
 * Calculates next ultimate gauge charge percentage after a correct word.
 */
export function calculateNextUltimate(
  currentCharge: number,
  config: MultiplayerMatchConfig = DEFAULT_MULTIPLAYER_CONFIG
): number {
  return Math.min(
    config.maxUltimateCharge,
    Math.max(0, currentCharge) + config.ultimateGainPerWord
  )
}
