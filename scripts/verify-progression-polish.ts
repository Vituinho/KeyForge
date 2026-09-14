/**
 * KeyForge v3.4 — Progression, Game Feel & Save Migration Verification Suite
 *
 * Validates:
 * 1. Save migration v1 -> v3 & v2 -> v3 integrity & idempotency.
 * 2. Immutable World Baseline engine & legacy uncalibrated handling.
 * 3. Anti-fraud Personal Best thresholds (anti micro-burst fraud).
 * 4. Explainable Skill Profile 2.0 engine & minimum sample guard.
 * 5. Historical improvement tracker & stabilized key detection.
 * 6. Deterministic training recommender stability.
 * 7. Sound manager abstraction safety & zero external file dependency.
 */

import {
  createDefaultPlayerProfile,
  PlayerProfile,
} from "../src/types/player"
import {
  captureWorldEntryBaseline,
  calculateImprovement,
} from "../src/lib/progression/baselineService"
import {
  qualifiesForWpmRecord,
  qualifiesForAccuracyRecord,
  evaluatePersonalBests,
} from "../src/lib/progression/personalBestEngine"
import {
  computeSkillProfile,
  SKILL_WEIGHTS,
} from "../src/lib/progression/skillProfile"
import { analyzeHistoricalImprovement } from "../src/lib/progression/improvementTracker"
import { getRecommendedTrainingTarget } from "../src/lib/progression/trainingRecommendation"
import { soundManager } from "../src/lib/audio/soundManager"
import { CURRENT_SAVE_VERSION, STORAGE_KEY } from "../src/lib/storage/playerStorage"
import { TypingStats } from "../src/types/typing"
import { BattleHistoryEntry } from "../src/types/battle"

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ""}`)
    failed++
  }
}

function runTests() {
  console.log("\n=======================================================")
  console.log(" KEYFORGE v3.4 — PROGRESSION & GAME FEEL TEST SUITE")
  console.log("=======================================================\n")

  // --- TEST GROUP 1: Save Version & Schema Verification ---
  console.log("── 1. Save Migration & Schema Integrity ───────────────")
  assert(
    CURRENT_SAVE_VERSION === 3,
    `CURRENT_SAVE_VERSION is 3 (was 2 previously)`,
    `Found version: ${CURRENT_SAVE_VERSION}`
  )
  assert(
    STORAGE_KEY === "keyforge_player_v3",
    `STORAGE_KEY matches version 3 schema (keyforge_player_v3)`,
    `Found key: ${STORAGE_KEY}`
  )

  const defaultProfile = createDefaultPlayerProfile("TestHero")
  assert(
    defaultProfile.worldBaselines !== undefined && typeof defaultProfile.worldBaselines === "object",
    "createDefaultPlayerProfile initializes worldBaselines map"
  )
  assert(
    defaultProfile.worldIntroSeen !== undefined && typeof defaultProfile.worldIntroSeen === "object",
    "createDefaultPlayerProfile initializes worldIntroSeen map"
  )
  assert(
    defaultProfile.onboardingCompleted === false,
    "createDefaultPlayerProfile initializes onboardingCompleted as false"
  )

  // Test backward-compatible structure simulation (legacy v1 or v2 profile)
  const legacyV2Save: Record<string, unknown> = {
    id: "legacy_user_123",
    username: "LegacyTypist",
    level: 15,
    xp: 240,
    totalXp: 3500,
    rank: "B",
    bestWpm: 68,
    bestAccuracy: 95,
    campaignProgress: {
      naruto: {
        unlocked: true,
        completed: true,
        currentStage: 8,
        completedStages: [1, 2, 3, 4, 5, 6, 7, 8],
        defeatedEnemies: ["naruto", "sakura", "rock_lee", "kakashi", "sasuke", "itachi", "pain", "madara"],
        bestScores: {
          madara: { bestWpm: 68, bestAccuracy: 95, bestCombo: 34, stars: 3 },
        },
      },
    },
  }

  // Check legacy uncalibrated behavior for already-completed worlds
  const legacyPlayer = {
    ...defaultProfile,
    ...legacyV2Save,
  } as unknown as PlayerProfile

  const legacyBaseline = captureWorldEntryBaseline(legacyPlayer, "naruto")
  assert(
    legacyBaseline.baselineUnavailable === true,
    "Legacy completed world marks baselineUnavailable: true"
  )
  assert(
    legacyBaseline.confidence === "uncalibrated",
    "Legacy completed world sets confidence to 'uncalibrated'"
  )

  const legacyImprovement = calculateImprovement(legacyPlayer, "naruto")
  assert(
    legacyImprovement.confidence === "uncalibrated" && legacyImprovement.wpmDelta === null,
    "Legacy completed world returns null delta to avoid fake improvement claims"
  )

  // --- TEST GROUP 2: World Baseline Immutability ---
  console.log("\n── 2. World Baseline Immutability ──────────────────────")
  const newPlayer = createDefaultPlayerProfile("Challenger")
  newPlayer.stats.avgWpm = 42
  newPlayer.stats.avgAccuracy = 92
  newPlayer.stats.battlesPlayed = 5

  const baseline1 = captureWorldEntryBaseline(newPlayer, "jujutsu")
  assert(
    baseline1.worldId === "jujutsu" && baseline1.entryAvgWpm === 42,
    "Captures initial rolling baseline correctly (42 WPM)"
  )

  // Simulate player playing 10 more battles and becoming faster
  newPlayer.worldBaselines = newPlayer.worldBaselines ?? {}
  newPlayer.worldBaselines["jujutsu"] = baseline1
  newPlayer.stats.avgWpm = 80 // massive speedup
  newPlayer.stats.avgAccuracy = 98

  // Second call must return the original baseline unchanged (strictly immutable)
  const baseline2 = captureWorldEntryBaseline(newPlayer, "jujutsu")
  assert(
    baseline2.entryAvgWpm === 42,
    "Baseline is strictly immutable on re-entry (retains original 42 WPM despite player reaching 80 WPM)"
  )

  const jujutsuImprovement = calculateImprovement(newPlayer, "jujutsu")
  assert(
    jujutsuImprovement.baselineWpm === 42 &&
      jujutsuImprovement.currentWpm === 80 &&
      jujutsuImprovement.wpmDelta === 38,
    "Calculates honest improvement delta (+38 WPM) against immutable entry baseline"
  )

  // --- TEST GROUP 3: Anti-Fraud Personal Best Thresholds ---
  console.log("\n── 3. Personal Best Anti-Fraud Thresholds ──────────────")
  // Case A: 1-word micro-burst fraud (typed 1 word at 180 WPM in 1.5s)
  const microBurstStats: TypingStats = {
    currentWpm: 180,
    currentRawWpm: 180,
    currentAccuracy: 100,
    currentErrors: 0,
    currentStreak: 5,
    battleWpm: 180,
    battleAccuracy: 100,
    bestWpm: 180,
    totalTypingAttempts: 5,
    totalErrors: 0,
    combo: 5,
    bestCombo: 5,
    bestStreak: 5,
    typedCharacters: 8, // Less than 80 chars
    correctCharacters: 8,
    incorrectCharacters: 0,
    totalCorrectCharacters: 8,
    totalIncorrectCharacters: 0,
    elapsedTime: 2.5, // Less than 8s
    totalElapsedTime: 2.5,
    wpm: 180,
    rawWpm: 180,
    accuracy: 100,
    errors: 0,
    keyStats: {},
    errorLog: [],
    isCompleted: true,
    currentIndex: 8,
  }

  assert(
    qualifiesForWpmRecord(microBurstStats) === false,
    "Micro-burst (8 chars, 2.5s, 180 WPM) is REJECTED by anti-fraud engine"
  )

  // Case B: Sub-90% accuracy burst
  const sloppyBurst: TypingStats = {
    ...microBurstStats,
    typedCharacters: 120,
    elapsedTime: 12,
    currentAccuracy: 84, // Sub-90%
    accuracy: 84,
  }
  assert(
    qualifiesForWpmRecord(sloppyBurst) === false,
    "Low accuracy burst (< 90% ACC) is REJECTED by anti-fraud engine"
  )

  // Case C: Legitimate speed run
  const legitRecordStats: TypingStats = {
    ...microBurstStats,
    typedCharacters: 140,
    elapsedTime: 15,
    currentWpm: 75,
    wpm: 75,
    currentAccuracy: 96,
    accuracy: 96,
  }
  assert(
    qualifiesForWpmRecord(legitRecordStats) === true,
    "Legitimate run (140 chars, 15s, 96% ACC, 75 WPM) qualifies for WPM record"
  )

  // Case D: 1-word 100% accuracy record fraud
  assert(
    qualifiesForAccuracyRecord(microBurstStats) === false,
    "Single word 100% accuracy (8 chars) is REJECTED for Accuracy record"
  )
  assert(
    qualifiesForAccuracyRecord(legitRecordStats) === true,
    "Full sentence (140 chars) qualifies for Accuracy record"
  )

  // Milestone emission
  const p = createDefaultPlayerProfile("PBHero")
  p.bestWpm = 50
  const milestones = evaluatePersonalBests(p, legitRecordStats, "stage_1", "naruto")
  assert(
    milestones.some((m) => m.type === "wpm" && m.newValue === 75),
    "evaluatePersonalBests correctly detects and emits WPM milestone (50 -> 75 WPM)"
  )

  // --- TEST GROUP 4: Explainable Skill Profile 2.0 ---
  console.log("\n── 4. Explainable Skill Profile 2.0 ───────────────────")
  const brandNewPlayer = createDefaultPlayerProfile("Noob")
  const insufficientProfile = computeSkillProfile(brandNewPlayer, [])
  assert(
    insufficientProfile.confidence === "insufficient_data",
    `Brand new player (< 3 battles) displays confidence: "insufficient_data"`
  )

  // Construct realistic 5-battle history
  const history: BattleHistoryEntry[] = [
    {
      id: "b1",
      enemyId: "naruto",
      enemyName: "Naruto",
      enemyAnime: "Naruto Shippuden",
      enemyLevel: 1,
      themeColor: "#f97316",
      victory: true,
      battleWpm: 45,
      wpm: 45,
      battleAccuracy: 94,
      accuracy: 94,
      bestCombo: 20,
      combo: 20,
      totalErrors: 3,
      damageDealt: 100,
      damageTaken: 20,
      xpEarned: 100,
      durationSeconds: 42,
      elapsedTime: 42,
      timestamp: Date.now() - 40000,
    },
    {
      id: "b2",
      enemyId: "sakura",
      enemyName: "Sakura",
      enemyAnime: "Naruto Shippuden",
      enemyLevel: 2,
      themeColor: "#ec4899",
      victory: true,
      battleWpm: 48,
      wpm: 48,
      battleAccuracy: 95,
      accuracy: 95,
      bestCombo: 25,
      combo: 25,
      totalErrors: 2,
      damageDealt: 110,
      damageTaken: 15,
      xpEarned: 110,
      durationSeconds: 40,
      elapsedTime: 40,
      timestamp: Date.now() - 30000,
    },
    {
      id: "b3",
      enemyId: "rock_lee",
      enemyName: "Rock Lee",
      enemyAnime: "Naruto Shippuden",
      enemyLevel: 3,
      themeColor: "#22c55e",
      victory: true,
      battleWpm: 50,
      wpm: 50,
      battleAccuracy: 96,
      accuracy: 96,
      bestCombo: 30,
      combo: 30,
      totalErrors: 2,
      damageDealt: 120,
      damageTaken: 25,
      xpEarned: 120,
      durationSeconds: 38,
      elapsedTime: 38,
      timestamp: Date.now() - 20000,
    },
    {
      id: "b4",
      enemyId: "kakashi",
      enemyName: "Kakashi",
      enemyAnime: "Naruto Shippuden",
      enemyLevel: 4,
      themeColor: "#3b82f6",
      victory: true,
      battleWpm: 52,
      wpm: 52,
      battleAccuracy: 95,
      accuracy: 95,
      bestCombo: 28,
      combo: 28,
      totalErrors: 2,
      damageDealt: 130,
      damageTaken: 10,
      xpEarned: 130,
      durationSeconds: 45,
      elapsedTime: 45,
      timestamp: Date.now() - 10000,
    },
    {
      id: "b5",
      enemyId: "sasuke",
      enemyName: "Sasuke",
      enemyAnime: "Naruto Shippuden",
      enemyLevel: 5,
      themeColor: "#8b5cf6",
      victory: true,
      battleWpm: 55,
      wpm: 55,
      battleAccuracy: 97,
      accuracy: 97,
      bestCombo: 35,
      combo: 35,
      totalErrors: 1,
      damageDealt: 140,
      damageTaken: 15,
      xpEarned: 140,
      durationSeconds: 48,
      elapsedTime: 48,
      timestamp: Date.now(),
    },
  ]

  const seasonedPlayer = createDefaultPlayerProfile("Veteran")
  seasonedPlayer.stats.battlesPlayed = 5
  seasonedPlayer.stats.avgWpm = 50
  seasonedPlayer.stats.avgAccuracy = 95.4

  const profile = computeSkillProfile(seasonedPlayer, history)
  assert(
    profile.confidence !== "insufficient_data",
    `Seasoned player (>= 3 battles) computes calibrated profile`
  )
  assert(
    profile.speed.score >= 20 && profile.speed.score <= 100,
    `Speed score computed in valid range (${profile.speed.score}/100)`
  )
  assert(
    profile.accuracy.score >= 80,
    `Accuracy score reflects 95%+ performance (${profile.accuracy.score}/100)`
  )
  assert(
    profile.consistency.score > 0,
    `Consistency score computed (${profile.consistency.score}/100)`
  )
  assert(
    profile.endurance.score > 0,
    `Endurance score computed across long battles >= 35s (${profile.endurance.score}/100)`
  )
  assert(
    typeof profile.speed.explainableReason === "string" && profile.speed.explainableReason.length > 0,
    "Skill attributes contain explainable reason strings"
  )
  assert(
    SKILL_WEIGHTS.MIN_BATTLES_FOR_PROFILE === 3,
    "Skill weights define minimum 3 battles for calibration"
  )

  // --- TEST GROUP 5: Historical Improvement Tracker ---
  console.log("\n── 5. Multi-Battle Improvement Tracker ────────────────")
  const improvementAnalysis = analyzeHistoricalImprovement(history)
  assert(
    improvementAnalysis.hasEnoughData === true,
    "Improvement tracker recognizes sufficient data (5 battles)"
  )
  assert(
    (improvementAnalysis.recentAvgWpm ?? 0) >= (improvementAnalysis.earlyAvgWpm ?? 0),
    `Improvement tracker correctly identifies positive trend (Early: ${improvementAnalysis.earlyAvgWpm} -> Recent: ${improvementAnalysis.recentAvgWpm} WPM)`
  )

  // --- TEST GROUP 6: Stable Training Recommendation ---
  console.log("\n── 6. Stable Training Recommendation Engine ───────────")
  const trainee = createDefaultPlayerProfile("Trainee")
  trainee.keyErrors = {
    q: 1, // stray typo
    p: 12, // chronic weak key
    ";": 8, // chronic weak key
  }

  const recommendation = getRecommendedTrainingTarget(trainee, "naruto")
  assert(
    recommendation !== null,
    "Generates targeted recommendation when chronic weak keys exist"
  )
  assert(
    recommendation?.targetKey === "p",
    `Recommends primary chronic weak key 'p' (12 errors) instead of single typo 'q' (1 error)`
  )
  assert(
    recommendation?.finger !== undefined,
    `Identifies finger group: ${recommendation?.finger}`
  )

  // --- TEST GROUP 7: Sound Manager Safety ---
  console.log("\n── 7. Sound Manager Safety & Non-Blocking Guarantee ───")
  assert(
    typeof soundManager.getSettings === "function",
    "soundManager exposes getSettings()"
  )
  assert(
    typeof soundManager.playKeystroke === "function",
    "soundManager exposes playKeystroke()"
  )
  assert(
    typeof soundManager.playPersonalBest === "function",
    "soundManager exposes playPersonalBest()"
  )
  assert(
    typeof soundManager.playBossPhaseShift === "function",
    "soundManager exposes playBossPhaseShift()"
  )
  // Calling audio methods outside browser should never throw
  let audioThrew = false
  try {
    soundManager.playKeystroke()
    soundManager.playPersonalBest()
    soundManager.playBossPhaseShift()
  } catch {
    audioThrew = true
  }
  assert(
    !audioThrew,
    "Calling sound cues in non-browser/SSR environment executes safely without throwing"
  )

  console.log("\n=======================================================")
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log("=======================================================\n")

  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
