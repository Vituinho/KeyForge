import { PlayerProfile } from "@/types/player"
import { BattleHistoryEntry } from "@/types/battle"
import { SkillProfile2, SkillAttributeScore, SkillRating } from "@/types/progression"
import { getFingerForKey, resolveDefaultLayout } from "@/lib/keyboard/fingerMap"

/**
 * KeyForge v3.4 Skill Profile 2.0 Weights & Constants
 * All calculations are 100% deterministic and documented.
 */
export const SKILL_WEIGHTS = {
  MIN_BATTLES_FOR_PROFILE: 3,

  SPEED: {
    MIN_CAMPAIGN_WPM: 20,
    MASTER_CAMPAIGN_WPM: 110,
    RECENT_WEIGHT: 0.65,
    LIFETIME_WEIGHT: 0.35,
  },

  ACCURACY: {
    RECENT_WEIGHT: 0.60,
    LIFETIME_WEIGHT: 0.40,
    MIN_BASE_ACCURACY: 70,
  },

  CONSISTENCY: {
    WPM_PENALTY_FACTOR: 2.2,
    ACCURACY_PENALTY_FACTOR: 3.0,
  },

  TECHNIQUE: {
    FINGER_ACCURACY_WEIGHT: 0.40,
    HOME_ROW_ANCHOR_WEIGHT: 0.30,
    WEAK_KEY_DISCIPLINE_WEIGHT: 0.30,
  },

  ENDURANCE: {
    MIN_BATTLE_DURATION_SEC: 35,
    DRIFT_PENALTY_FACTOR: 1.8,
  },

  OVERALL: {
    SPEED_WEIGHT: 0.25,
    ACCURACY_WEIGHT: 0.25,
    CONSISTENCY_WEIGHT: 0.20,
    TECHNIQUE_WEIGHT: 0.15,
    ENDURANCE_WEIGHT: 0.15,
  },
} as const

function resolveRating(score: number): SkillRating {
  if (score >= 90) return "master"
  if (score >= 80) return "excellent"
  if (score >= 70) return "strong"
  if (score >= 50) return "good"
  return "developing"
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)))
}

/**
 * 1. SPEED SCORE (0–100)
 * Evaluates WPM along the campaign curve (20–110 WPM), balancing recent form (65%) with lifetime records (35%).
 */
export function calculateSpeedScore(
  profile: PlayerProfile,
  recentBattles: BattleHistoryEntry[]
): SkillAttributeScore {
  if (recentBattles.length < SKILL_WEIGHTS.MIN_BATTLES_FOR_PROFILE && profile.stats.battlesPlayed < 2) {
    const reason = "Minimum 3 battles required to evaluate speed rating."
    return {
      score: 0,
      rating: "insufficient_data",
      confidence: "insufficient_data",
      breakdown: reason,
      explainableReason: reason,
      sampleCount: recentBattles.length,
    }
  }

  const recentAvg =
    recentBattles.length > 0
      ? recentBattles.reduce((s, b) => s + (b.battleWpm ?? b.wpm ?? 0), 0) / recentBattles.length
      : profile.stats.averageWpm || profile.stats.avgWpm || 0

  const lifetimeAvg = profile.stats.averageWpm || profile.stats.avgWpm || recentAvg
  const blendedWpm =
    recentAvg * SKILL_WEIGHTS.SPEED.RECENT_WEIGHT +
    lifetimeAvg * SKILL_WEIGHTS.SPEED.LIFETIME_WEIGHT

  // Map 20 -> 0, 110 -> 100
  const normalized =
    ((blendedWpm - SKILL_WEIGHTS.SPEED.MIN_CAMPAIGN_WPM) /
      (SKILL_WEIGHTS.SPEED.MASTER_CAMPAIGN_WPM - SKILL_WEIGHTS.SPEED.MIN_CAMPAIGN_WPM)) *
    100

  const score = clamp(normalized)
  const breakdown = `Derived from blended WPM of ${Math.round(blendedWpm)} (Recent: ${Math.round(recentAvg)}, Lifetime: ${Math.round(lifetimeAvg)}).`
  return {
    score,
    rating: resolveRating(score),
    confidence: recentBattles.length >= 5 ? "high" : "moderate",
    breakdown,
    explainableReason: breakdown,
    sampleCount: recentBattles.length,
  }
}

/**
 * 2. ACCURACY SCORE (0–100)
 * Evaluates precision with heavy emphasis on recent control (60%) and lifetime accuracy (40%).
 */
export function calculateAccuracyScore(
  profile: PlayerProfile,
  recentBattles: BattleHistoryEntry[]
): SkillAttributeScore {
  if (recentBattles.length < SKILL_WEIGHTS.MIN_BATTLES_FOR_PROFILE && profile.stats.battlesPlayed < 2) {
    const reason = "Minimum 3 battles required to evaluate accuracy rating."
    return {
      score: 0,
      rating: "insufficient_data",
      confidence: "insufficient_data",
      breakdown: reason,
      explainableReason: reason,
      sampleCount: recentBattles.length,
    }
  }

  const recentAvg =
    recentBattles.length > 0
      ? recentBattles.reduce((s, b) => s + (b.battleAccuracy ?? b.accuracy ?? 0), 0) / recentBattles.length
      : profile.stats.averageAccuracy || profile.stats.avgAccuracy || 100

  const lifetimeAvg = profile.stats.averageAccuracy || profile.stats.avgAccuracy || recentAvg
  const blendedAcc =
    recentAvg * SKILL_WEIGHTS.ACCURACY.RECENT_WEIGHT +
    lifetimeAvg * SKILL_WEIGHTS.ACCURACY.LIFETIME_WEIGHT

  // Map 70% -> 0, 100% -> 100
  const normalized =
    ((blendedAcc - SKILL_WEIGHTS.ACCURACY.MIN_BASE_ACCURACY) /
      (100 - SKILL_WEIGHTS.ACCURACY.MIN_BASE_ACCURACY)) *
    100

  const score = clamp(normalized)
  const breakdown = `Blended accuracy of ${blendedAcc.toFixed(1)}% across ${recentBattles.length} battles.`
  return {
    score,
    rating: resolveRating(score),
    confidence: recentBattles.length >= 5 ? "high" : "moderate",
    breakdown,
    explainableReason: breakdown,
    sampleCount: recentBattles.length,
  }
}

/**
 * 3. CONSISTENCY SCORE (0–100)
 * Evaluates rhythm stability by computing standard deviation of WPM and accuracy across recent battles.
 */
export function calculateConsistencyScore(
  recentBattles: BattleHistoryEntry[]
): SkillAttributeScore {
  if (recentBattles.length < SKILL_WEIGHTS.MIN_BATTLES_FOR_PROFILE) {
    const reason = "Minimum 3 battles required to evaluate cadence consistency."
    return {
      score: 0,
      rating: "insufficient_data",
      confidence: "insufficient_data",
      breakdown: reason,
      explainableReason: reason,
      sampleCount: recentBattles.length,
    }
  }

  const wpms = recentBattles.map((b) => b.battleWpm ?? b.wpm ?? 0)
  const accs = recentBattles.map((b) => b.battleAccuracy ?? b.accuracy ?? 0)

  const meanWpm = wpms.reduce((a, b) => a + b, 0) / wpms.length
  const meanAcc = accs.reduce((a, b) => a + b, 0) / accs.length

  const wpmStd = Math.sqrt(wpms.reduce((s, v) => s + Math.pow(v - meanWpm, 2), 0) / wpms.length)
  const accStd = Math.sqrt(accs.reduce((s, v) => s + Math.pow(v - meanAcc, 2), 0) / accs.length)

  const variancePenalty =
    wpmStd * SKILL_WEIGHTS.CONSISTENCY.WPM_PENALTY_FACTOR +
    accStd * SKILL_WEIGHTS.CONSISTENCY.ACCURACY_PENALTY_FACTOR

  const score = clamp(100 - variancePenalty)
  const breakdown = `Variance penalty of ${Math.round(variancePenalty)} (WPM std-dev: ${wpmStd.toFixed(1)}, Acc std-dev: ${accStd.toFixed(1)}).`
  return {
    score,
    rating: resolveRating(score),
    confidence: recentBattles.length >= 5 ? "high" : "moderate",
    breakdown,
    explainableReason: breakdown,
    sampleCount: recentBattles.length,
  }
}

/**
 * 4. TECHNIQUE SCORE (0–100)
 * Evaluates finger ergonomics: checks weak key error concentration, home-row anchor stability,
 * and finger mapping balance from v3.2 diagnostics.
 */
export function calculateTechniqueScore(
  profile: PlayerProfile,
  locale: string = "pt-BR"
): SkillAttributeScore {
  const keyErrors = profile.keyErrors ?? {}
  const totalErrors = Object.values(keyErrors).reduce((a, b) => a + b, 0)
  const battlesPlayed = profile.stats.battlesPlayed

  if (battlesPlayed < 2) {
    const reason = "Minimum 2 battles required for ergonomic technique assessment."
    return {
      score: 0,
      rating: "insufficient_data",
      confidence: "insufficient_data",
      breakdown: reason,
      explainableReason: reason,
      sampleCount: battlesPlayed,
    }
  }

  const layout = resolveDefaultLayout(locale)
  const homeRowAnchors = ["a", "s", "d", "f", "j", "k", "l", ";", "ç"]

  // Count errors on home-row anchors vs peripheral keys
  let anchorErrors = 0
  let pinkyRingErrors = 0

  for (const [key, errCount] of Object.entries(keyErrors)) {
    const k = key.toLowerCase()
    if (homeRowAnchors.includes(k)) {
      anchorErrors += errCount
    }
    const fingerInfo = getFingerForKey(k, layout)
    if (fingerInfo?.finger?.includes("Pinky") || fingerInfo?.finger?.includes("Ring")) {
      pinkyRingErrors += errCount
    }
  }

  // Anchor discipline (fewer errors on core home-row = better score)
  const anchorDiscipline =
    totalErrors > 0 ? 100 - Math.min(80, (anchorErrors / totalErrors) * 100) : 95

  // Weak key dispersal (errors spread evenly vs concentrated on a single flaw)
  const uniqueErrorKeys = Object.keys(keyErrors).length
  const dispersionScore =
    totalErrors > 0
      ? Math.min(100, Math.round((uniqueErrorKeys / Math.max(1, totalErrors)) * 250))
      : 90

  // Academy lessons completed boost
  const academyBonus = Math.min(15, (profile.stats.academyLessonsCompleted ?? 0) * 3)

  const rawScore =
    anchorDiscipline * SKILL_WEIGHTS.TECHNIQUE.HOME_ROW_ANCHOR_WEIGHT +
    dispersionScore * SKILL_WEIGHTS.TECHNIQUE.WEAK_KEY_DISCIPLINE_WEIGHT +
    (100 - Math.min(60, pinkyRingErrors * 1.5)) * SKILL_WEIGHTS.TECHNIQUE.FINGER_ACCURACY_WEIGHT +
    academyBonus

  const score = clamp(rawScore)
  const breakdown = `Home-row anchor discipline: ${Math.round(anchorDiscipline)}%, weak-key dispersion: ${Math.round(dispersionScore)}%, Academy bonus: +${academyBonus}.`
  return {
    score,
    rating: resolveRating(score),
    confidence: battlesPlayed >= 5 ? "high" : "moderate",
    breakdown,
    explainableReason: breakdown,
    sampleCount: battlesPlayed,
  }
}

/**
 * 5. ENDURANCE SCORE (0–100)
 * Evaluates performance stability across long sessions / battles (>= 35s duration).
 * If battles are too short, does not penalize or guess.
 */
export function calculateEnduranceScore(
  recentBattles: BattleHistoryEntry[]
): SkillAttributeScore {
  const longBattles = recentBattles.filter(
    (b) => (b.durationSeconds ?? b.elapsedTime ?? 0) >= SKILL_WEIGHTS.ENDURANCE.MIN_BATTLE_DURATION_SEC
  )

  if (longBattles.length < 2) {
    const reason = "Requires at least 2 long-form battles (>= 35 seconds) to evaluate endurance."
    return {
      score: 0,
      rating: "insufficient_data",
      confidence: "insufficient_data",
      breakdown: reason,
      explainableReason: reason,
      sampleCount: longBattles.length,
    }
  }

  // Check victory rate and WPM maintenance in long battles
  const avgWpmLong =
    longBattles.reduce((s, b) => s + (b.battleWpm ?? b.wpm ?? 0), 0) / longBattles.length
  const avgAccLong =
    longBattles.reduce((s, b) => s + (b.battleAccuracy ?? b.accuracy ?? 0), 0) / longBattles.length
  const wins = longBattles.filter((b) => b.victory).length
  const winRate = wins / longBattles.length

  // High endurance = maintaining high accuracy and win rate in battles taking 40–120s
  const score = clamp(avgAccLong * 0.6 + winRate * 30 + Math.min(10, avgWpmLong / 8))
  const breakdown = `Evaluated across ${longBattles.length} battles exceeding 35s. Sustained accuracy: ${avgAccLong.toFixed(1)}%, win-rate: ${Math.round(winRate * 100)}%.`
  return {
    score,
    rating: resolveRating(score),
    confidence: longBattles.length >= 4 ? "high" : "moderate",
    breakdown,
    explainableReason: breakdown,
    sampleCount: longBattles.length,
  }
}

/**
 * Computes the complete Skill Profile 2.0 with all 5 explainable attributes.
 */
export function evaluateSkillProfile(
  profile: PlayerProfile,
  recentBattles: BattleHistoryEntry[] = [],
  locale: string = "pt-BR"
): SkillProfile2 {
  const speed = calculateSpeedScore(profile, recentBattles)
  const accuracy = calculateAccuracyScore(profile, recentBattles)
  const consistency = calculateConsistencyScore(recentBattles)
  const technique = calculateTechniqueScore(profile, locale)
  const endurance = calculateEnduranceScore(recentBattles)

  // Check if at least Speed, Accuracy and Consistency have sufficient data
  const hasSufficientData =
    speed.confidence !== "insufficient_data" &&
    accuracy.confidence !== "insufficient_data"

  if (!hasSufficientData) {
    const reason = "Requires at least 3 battles to compute overall power rating."
    return {
      speed,
      accuracy,
      consistency,
      technique,
      endurance,
      overall: {
        score: 0,
        rating: "insufficient_data",
        confidence: "insufficient_data",
        breakdown: reason,
        explainableReason: reason,
        sampleCount: recentBattles.length,
      },
      overallRating: "insufficient_data",
      evaluatedAt: new Date().toISOString(),
      hasSufficientData: false,
      confidence: "insufficient_data",
    }
  }

  // Weight attributes that have data
  let totalScore = 0
  let totalWeight = 0

  if (speed.confidence !== "insufficient_data") {
    totalScore += speed.score * SKILL_WEIGHTS.OVERALL.SPEED_WEIGHT
    totalWeight += SKILL_WEIGHTS.OVERALL.SPEED_WEIGHT
  }
  if (accuracy.confidence !== "insufficient_data") {
    totalScore += accuracy.score * SKILL_WEIGHTS.OVERALL.ACCURACY_WEIGHT
    totalWeight += SKILL_WEIGHTS.OVERALL.ACCURACY_WEIGHT
  }
  if (consistency.confidence !== "insufficient_data") {
    totalScore += consistency.score * SKILL_WEIGHTS.OVERALL.CONSISTENCY_WEIGHT
    totalWeight += SKILL_WEIGHTS.OVERALL.CONSISTENCY_WEIGHT
  }
  if (technique.confidence !== "insufficient_data") {
    totalScore += technique.score * SKILL_WEIGHTS.OVERALL.TECHNIQUE_WEIGHT
    totalWeight += SKILL_WEIGHTS.OVERALL.TECHNIQUE_WEIGHT
  }
  if (endurance.confidence !== "insufficient_data") {
    totalScore += endurance.score * SKILL_WEIGHTS.OVERALL.ENDURANCE_WEIGHT
    totalWeight += SKILL_WEIGHTS.OVERALL.ENDURANCE_WEIGHT
  }

  const overallScore = totalWeight > 0 ? clamp(totalScore / totalWeight) : 0
  const overallRating = resolveRating(overallScore)
  const conf = recentBattles.length >= 5 ? "high" : "moderate"
  const overallBreakdown = `Composite power rating across all calibrated typing disciplines.`

  return {
    speed,
    accuracy,
    consistency,
    technique,
    endurance,
    overall: {
      score: overallScore,
      rating: overallRating,
      confidence: conf,
      breakdown: overallBreakdown,
      explainableReason: overallBreakdown,
      sampleCount: recentBattles.length,
    },
    overallRating,
    evaluatedAt: new Date().toISOString(),
    hasSufficientData: true,
    confidence: conf,
  }
}

export const computeSkillProfile = evaluateSkillProfile
