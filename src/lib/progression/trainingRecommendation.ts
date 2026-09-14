import { PlayerProfile } from "@/types/player"
import { RecommendedTrainingTarget } from "@/types/progression"
import { getFingerForKey, resolveDefaultLayout } from "@/lib/keyboard/fingerMap"

/**
 * Deterministically generates stable, high-impact training recommendations.
 * Prevents thrashing: a single typo on one key will NOT displace chronic weaknesses.
 */
export function getRecommendedTraining(
  profile: PlayerProfile,
  currentWorldId?: string,
  locale: string = "pt-BR"
): RecommendedTrainingTarget {
  const keyErrors = profile.keyErrors ?? {}
  const layout = resolveDefaultLayout(locale)

  // 1. Calculate persistent error distribution by finger group
  const fingerErrorCounts: Record<string, { totalErrors: number; keys: string[] }> = {}

  for (const [key, count] of Object.entries(keyErrors)) {
    if (count <= 0) continue
    const k = key.toLowerCase()
    const finger = getFingerForKey(k, layout)?.finger ?? "unknown"

    if (!fingerErrorCounts[finger]) {
      fingerErrorCounts[finger] = { totalErrors: 0, keys: [] }
    }
    fingerErrorCounts[finger].totalErrors += count
    if (!fingerErrorCounts[finger].keys.includes(k)) {
      fingerErrorCounts[finger].keys.push(k)
    }
  }

  // Find most chronically flawed finger (must have at least 3 total errors)
  let worstFinger: string | null = null
  let maxFingerErrors = 2

  for (const [finger, data] of Object.entries(fingerErrorCounts)) {
    if (finger !== "unknown" && data.totalErrors > maxFingerErrors) {
      maxFingerErrors = data.totalErrors
      worstFinger = finger
    }
  }

  // 2. Prioritize by finger weakness if severe (>= 5 errors)
  if (worstFinger && maxFingerErrors >= 5) {
    const data = fingerErrorCounts[worstFinger]
    const sortedFingerKeys = [...data.keys].sort(
      (a, b) => (keyErrors[b] ?? 0) - (keyErrors[a] ?? 0)
    )
    const targetKeys = sortedFingerKeys.slice(0, 4)
    const primaryKey = targetKeys[0]

    return {
      id: `finger_weakness_${worstFinger}`,
      type: "finger",
      titleKey: "trainingRecommendation.fingerWeaknessTitle",
      descKey: "trainingRecommendation.fingerWeaknessDesc",
      targetKeys,
      targetKey: primaryKey,
      targetFinger: worstFinger,
      finger: worstFinger,
      severity: maxFingerErrors >= 10 ? "high" : "medium",
      actionUrl: `/training?mode=weak-keys&keys=${targetKeys.join(",")}`,
      reason: `Chronic error concentration (${maxFingerErrors} mistakes) identified on ${worstFinger}.`,
    }
  }

  // 3. Fallback to top weak keys if any have >= 3 errors
  const sortedKeys = Object.entries(keyErrors)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])

  if (sortedKeys.length >= 2) {
    const topKeys = sortedKeys.slice(0, 3).map(([k]) => k)
    const primaryKey = topKeys[0]
    const finger = getFingerForKey(primaryKey, layout)?.finger ?? undefined

    return {
      id: "weak_keys_target",
      type: "keys",
      titleKey: "trainingRecommendation.weakKeysTitle",
      descKey: "trainingRecommendation.weakKeysDesc",
      targetKeys: topKeys,
      targetKey: primaryKey,
      targetFinger: finger,
      finger,
      severity: "medium",
      actionUrl: `/training?mode=weak-keys&keys=${topKeys.join(",")}`,
      reason: `Repeated mistypes on ${topKeys.map((k) => k.toUpperCase()).join(", ")}.`,
    }
  }

  // 4. World Pedagogical Focus if currentWorldId is provided
  if (currentWorldId) {
    if (currentWorldId === "jujutsu") {
      return {
        id: "world_focus_precision",
        type: "focus",
        titleKey: "trainingRecommendation.precisionFocusTitle",
        descKey: "trainingRecommendation.precisionFocusDesc",
        targetKeys: [".", ",", "!", "?", "-", "'"],
        severity: "low",
        actionUrl: "/training?mode=punctuation",
        reason: "Jujutsu World demands high punctuation discipline and symbol precision.",
      }
    }
    if (currentWorldId === "demon") {
      return {
        id: "world_focus_home_row",
        type: "focus",
        titleKey: "trainingRecommendation.homeRowFocusTitle",
        descKey: "trainingRecommendation.homeRowFocusDesc",
        targetKeys: ["f", "j", "a", "s", "d", "k", "l", ";"],
        severity: "low",
        actionUrl: "/academy",
        reason: "Demon World emphasizes Home Row finger discipline and anchor posture.",
      }
    }
    if (currentWorldId === "dragon") {
      return {
        id: "world_focus_velocity",
        type: "focus",
        titleKey: "trainingRecommendation.velocityFocusTitle",
        descKey: "trainingRecommendation.velocityFocusDesc",
        severity: "low",
        actionUrl: "/training?mode=speed",
        reason: "Dragon World challenges sustained high-burst typing tempo.",
      }
    }
  }

  // 5. Default baseline maintenance
  return {
    id: "general_accuracy_drill",
    type: "endurance",
    titleKey: "trainingRecommendation.generalAccuracyTitle",
    descKey: "trainingRecommendation.generalAccuracyDesc",
    severity: "low",
    actionUrl: "/training",
    reason: "Consistent general warm-up to sharpen cadence and reflex.",
  }
}

export const getRecommendedTrainingTarget = getRecommendedTraining
