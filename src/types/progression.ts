/**
 * KeyForge v3.4 Progression & Game Feel Domain Types
 * Defines data structures for skill profiling, world baselines,
 * combat feedback priority, and world completion recaps.
 */

export type SkillRating =
  | "developing"
  | "good"
  | "strong"
  | "excellent"
  | "master"
  | "insufficient_data"

export interface SkillAttributeScore {
  score: number // 0–100 normalized score
  rating: SkillRating
  confidence: "high" | "moderate" | "low" | "insufficient_data"
  breakdown: string
  sampleCount: number
}

export interface SkillProfile2 {
  speed: SkillAttributeScore
  accuracy: SkillAttributeScore
  consistency: SkillAttributeScore
  technique: SkillAttributeScore
  endurance: SkillAttributeScore
  overall: number // 0–100 composite
  overallRating: SkillRating
  evaluatedAt: string
  hasSufficientData: boolean
}

export interface WorldEntryBaseline {
  worldId: string
  capturedAt: string
  wpm: number
  accuracy: number
  consistency: number
  keyErrors: Record<string, number>
  sampleSize: number
  source: "recent_battles" | "aggregated_profile" | "initial_session"
  confidence: "high" | "moderate" | "low" | "uncalibrated"
  baselineUnavailable?: boolean
}

export interface WorldCompletionRecap {
  worldId: string
  series: string
  completedAt: string
  startingWpm: number | null
  currentWpm: number
  wpmDelta: number | null
  wpmPercentImprovement: number | null
  startingAccuracy: number | null
  currentAccuracy: number
  accuracyDelta: number | null
  allTimeBestWpm: number
  allTimeBestAccuracy: number
  bestCombo: number
  averageConsistency: number
  battlesFought: number
  stagesCleared: number
  masteryStars: number
  totalMasteryStars: number
  weakKeysImproved: string[]
  strongestSkill: string
  skillToTrain: string
  nextWorldId?: string
  nextWorldFocus?: string
  nextWorldRecommendation?: string
  baselineUnavailable?: boolean
}

export interface PersonalBestMilestone {
  type: "wpm" | "accuracy" | "combo"
  value: number
  previousValue: number
  timestamp: number
  messageKey: string
}

export type CombatFeedbackPriority = 1 | 2 | 3 | 4 | 5 | 6

export interface CombatFeedbackEvent {
  id: string
  type:
    | "personal_best" // Priority 1
    | "boss_phase" // Priority 2
    | "perfect_sentence" // Priority 3
    | "combo_milestone" // Priority 4
    | "speed_surge" // Priority 5
    | "precision_strike" // Priority 5
    | "perfect_word" // Priority 6
  priority: CombatFeedbackPriority
  title: string
  detail?: string
  timestamp: number
  badgeColor?: string
}

export interface OnboardingState {
  completed: boolean
  completedAt?: string
  skipped?: boolean
}

export interface RecommendedTrainingTarget {
  id: string
  type: "finger" | "keys" | "focus" | "endurance"
  titleKey: string
  descKey: string
  targetKeys?: string[]
  targetFinger?: string
  severity: "high" | "medium" | "low"
  actionUrl: string
  reason: string
}
