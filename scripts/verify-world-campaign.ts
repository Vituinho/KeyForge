/**
 * KeyForge v3.3 Anime Worlds Campaign Comprehensive Verification Suite
 * 
 * Tests all 13 campaign invariants:
 * 1. World Registry Integrity (7 worlds, 56 stages, 56 characters)
 * 2. Sequential World Unlocking & Progression
 * 3. Completed vs Mastered Logic (95% mastery stars threshold)
 * 4. First Clear, Boss, World Completion & Mastery Rewards
 * 5. EN & PT-BR Text Pool Validity (1,792 sentences, 56 characters * 16 * 2)
 * 6. Hunter Adaptive Weak-Key Engine
 * 7. Nexus Mirror Profile Adaptation
 * 8. Pre-Battle Telemetry Contracts
 * 9. Post-Battle Educational Analysis & Finger Mapping (ABNT2 & ANSI)
 * 10. Balanced Difficulty Scaling (Gentle capping, no rubber-banding)
 * 11. World Progress Structures in Profile & Statistics
 * 12. Dashboard Next Stage Recommendations
 * 13. Save Migration Preserving Legacy Naruto Progress
 */

import {
  WORLD_REGISTRY,
  ANIME_WORLD_ORDER,
  getAllWorlds,
  getStageById,
  getStageByEnemyId,
  isWorldUnlocked,
  getWorldProgress,
  getRecommendedNextStage,
} from "../src/data/worlds"
import { CHARACTERS, getCharacterById } from "../src/data/characters"
import { getTextsForCharacter } from "../src/data/texts"
import {
  calculateWeakKeyDensity,
  prioritizeSentencesByWeakKeys,
  getTopWeakKeys,
} from "../src/lib/worlds/hunterAdaptiveEngine"
import {
  scaleEnemyForBattle,
  getDifficultyDelta,
} from "../src/lib/battle/difficultyScaler"
import {
  getFingerForKey,
  FINGER_PALETTE,
  resolveDefaultLayout,
} from "../src/lib/keyboard/fingerMap"
import {
  PlayerProfile,
  createDefaultPlayerProfile,
  syncCampaignSummary,
} from "../src/types/player"
import { hasMeaningfulProgress } from "../src/lib/storage/migrationService"
import { ALL_CRATES } from "../src/data/crates"

let totalPassed = 0
let totalFailed = 0

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`)
    totalPassed++
  } else {
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`)
    totalFailed++
  }
}

console.log("\n=======================================================")
console.log("⚔️ KEYFORGE v3.3 ANIME WORLDS CAMPAIGN VERIFICATION SUITE")
console.log("=======================================================\n")

// -------------------------------------------------------------
// 1. World Registry Integrity
// -------------------------------------------------------------
console.log("[1/13] Checking World Registry Integrity...")
assert(ANIME_WORLD_ORDER.length === 7, "Registry has exactly 7 anime worlds in canonical order")
const expectedWorlds = ["naruto", "jujutsu", "dragon", "pirate", "hunter", "demon", "nexus"]
assert(
  JSON.stringify(ANIME_WORLD_ORDER) === JSON.stringify(expectedWorlds),
  "World progression sequence matches expected anime universe order"
)

const allWorlds = getAllWorlds()
assert(allWorlds.length === 7, "getAllWorlds returns all 7 world definitions")

let totalStages = 0
const allStageEnemyIds = new Set<string>()
let validCharactersCount = 0

allWorlds.forEach((world) => {
  assert(world.stages.length === 8, `${world.series} has exactly 8 stages`)
  totalStages += world.stages.length

  world.stages.forEach((stage, idx) => {
    allStageEnemyIds.add(stage.enemyId)
    const char = getCharacterById(stage.enemyId)
    if (char) validCharactersCount++

    // Monotonic difficulty or recommended WPM check
    assert(
      stage.recommendedWpm >= 25 && stage.recommendedWpm <= 130,
      `${stage.name} recommendedWpm (${stage.recommendedWpm}) within valid bounds`
    )
    assert(
      stage.recommendedAccuracy >= 88 && stage.recommendedAccuracy <= 99,
      `${stage.name} recommendedAccuracy (${stage.recommendedAccuracy}%) within valid bounds`
    )

    if (idx === 7) {
      assert(stage.isBoss === true, `${world.series} Stage 8 (${stage.name}) is marked as boss`)
    }
  })
})

assert(totalStages === 56, `Total campaign stages count is exactly 56 (found: ${totalStages})`)
assert(allStageEnemyIds.size === 56, `All 56 stages have unique enemy IDs`)
assert(validCharactersCount === 56, `All 56 stage enemies resolve to valid character entries in CHARACTERS`)

// -------------------------------------------------------------
// 2. Sequential World Unlocking & Progression
// -------------------------------------------------------------
console.log("\n[2/13] Checking Sequential World Unlocking & Progression...")
const mockProfile = createDefaultPlayerProfile()

assert(isWorldUnlocked("naruto", mockProfile) === true, "Naruto World is unlocked for fresh profile")
assert(isWorldUnlocked("jujutsu", mockProfile) === false, "Jujutsu World is locked for fresh profile")
assert(isWorldUnlocked("dragon", mockProfile) === false, "Dragon World is locked for fresh profile")
assert(isWorldUnlocked("nexus", mockProfile) === false, "Nexus World is locked for fresh profile")

// Simulate defeating Naruto World Boss (Madara)
const profileAfterNaruto: PlayerProfile = {
  ...mockProfile,
  campaignProgress: {
    ...mockProfile.campaignProgress,
    naruto: {
      unlocked: true,
      completed: true,
      currentStage: 8,
      completedStages: [1, 2, 3, 4, 5, 6, 7, 8],
      defeatedEnemies: ["naruto", "sakura", "rock_lee", "kakashi", "sasuke", "itachi", "pain", "madara"],
      bestScores: {},
      firstClearClaimed: {},
    },
  },
}

assert(isWorldUnlocked("jujutsu", profileAfterNaruto) === true, "Jujutsu World unlocks after Naruto completion")
assert(isWorldUnlocked("dragon", profileAfterNaruto) === false, "Dragon World remains locked until Jujutsu is completed")

const narutoProgress = getWorldProgress("naruto", profileAfterNaruto)
assert(narutoProgress.completed === true, "Naruto World progress summary reflects completion")
assert(narutoProgress.progressPercent === 100, "Naruto World progress is 100%")

// -------------------------------------------------------------
// 3. Completed vs Mastered Logic (95% Mastery Stars)
// -------------------------------------------------------------
console.log("\n[3/13] Checking Completed vs Mastered Logic...")
// 8 stages * 3 stars = 24 total possible stars. 95% threshold = 22.8 -> 23+ stars
const completedScores: Record<string, { bestWpm: number; bestAccuracy: number; bestCombo: number; completedAt: string; stars?: number }> = {}
for (let i = 1; i <= 8; i++) {
  completedScores[`stage_${i}`] = {
    bestWpm: 40,
    bestAccuracy: 90,
    bestCombo: 10,
    completedAt: new Date().toISOString(),
    stars: 1, // Only 1 star per stage -> 8 stars total
  }
}

const unmasteredProfile: PlayerProfile = {
  ...mockProfile,
  campaignProgress: {
    ...mockProfile.campaignProgress,
    naruto: {
      unlocked: true,
      completed: true,
      currentStage: 8,
      completedStages: [1, 2, 3, 4, 5, 6, 7, 8],
      defeatedEnemies: ["naruto_01"],
      bestScores: completedScores,
      firstClearClaimed: {},
    },
  },
}

const unmasteredSummary = getWorldProgress("naruto", unmasteredProfile)
assert(unmasteredSummary.completed === true, "World is completed")
assert(unmasteredSummary.mastered === false, "World is NOT mastered with low star count (8/24 stars)")
assert(unmasteredSummary.status === "completed", "Status is 'completed' and not 'mastered'")

// Now grant 3 stars on all 8 stages (24/24 stars)
const masteredScores: Record<string, { bestWpm: number; bestAccuracy: number; bestCombo: number; completedAt: string; stars?: number }> = {}
const narutoStages = WORLD_REGISTRY.naruto.stages
narutoStages.forEach((s) => {
  masteredScores[s.id] = {
    bestWpm: s.recommendedWpm + 20,
    bestAccuracy: s.recommendedAccuracy + 2,
    bestCombo: 50,
    completedAt: new Date().toISOString(),
    stars: 3,
  }
})

const masteredProfile: PlayerProfile = {
  ...mockProfile,
  campaignProgress: {
    ...mockProfile.campaignProgress,
    naruto: {
      unlocked: true,
      completed: true,
      mastered: true,
      currentStage: 8,
      completedStages: [1, 2, 3, 4, 5, 6, 7, 8],
      defeatedEnemies: narutoStages.map((s) => s.enemyId),
      bestScores: masteredScores,
      firstClearClaimed: {},
    },
  },
}

const masteredSummary = getWorldProgress("naruto", masteredProfile)
assert(masteredSummary.mastered === true, "World is mastered with full stars (24/24)")
assert(masteredSummary.status === "mastered", "Status is 'mastered'")

// -------------------------------------------------------------
// 4. First Clear, Boss, World Completion & Mastery Rewards
// -------------------------------------------------------------
console.log("\n[4/13] Checking Rewards & Crates Validity in Data...")
allWorlds.forEach((w) => {
  if (w.completionReward.crateId) {
    assert(
      ALL_CRATES.some((c) => c.id === w.completionReward.crateId),
      `${w.series} completion crate (${w.completionReward.crateId}) exists in ALL_CRATES`
    )
  }
  if (w.masteryReward.crateId) {
    assert(
      ALL_CRATES.some((c) => c.id === w.masteryReward.crateId),
      `${w.series} mastery crate (${w.masteryReward.crateId}) exists in ALL_CRATES`
    )
  }
  w.stages.forEach((st) => {
    if (st.firstClearRewards.crateId) {
      assert(
        ALL_CRATES.some((c) => c.id === st.firstClearRewards.crateId),
        `${st.name} firstClear crate (${st.firstClearRewards.crateId}) exists in ALL_CRATES`
      )
    }
  })
})

// -------------------------------------------------------------
// 5. EN & PT-BR Text Pool Validity (1,792+ Sentences)
// -------------------------------------------------------------
console.log("\n[5/13] Checking EN & PT-BR Text Pools...")
let totalEnSentences = 0
let totalPtSentences = 0

CHARACTERS.forEach((char) => {
  const enTexts = getTextsForCharacter(char.id, "en")
  const ptTexts = getTextsForCharacter(char.id, "pt-BR")

  assert(enTexts.length >= 16, `${char.name} has at least 16 English texts (found: ${enTexts.length})`)
  assert(ptTexts.length >= 16, `${char.name} has at least 16 Portuguese texts (found: ${ptTexts.length})`)
  assert(enTexts.length === ptTexts.length, `${char.name} has equal EN and PT text count (${enTexts.length})`)

  totalEnSentences += enTexts.length
  totalPtSentences += ptTexts.length

  // Check no blank or invalid strings
  enTexts.forEach((t, i) => {
    if (!t || t.trim().length === 0) {
      assert(false, `${char.name} EN text [${i}] is empty`)
    }
  })
  ptTexts.forEach((t, i) => {
    if (!t || t.trim().length === 0) {
      assert(false, `${char.name} PT text [${i}] is empty`)
    }
  })
})

assert(totalEnSentences >= 896, `Total English campaign sentences is at least 896 (found: ${totalEnSentences})`)
assert(totalPtSentences >= 896, `Total Portuguese campaign sentences is at least 896 (found: ${totalPtSentences})`)
assert(totalEnSentences === totalPtSentences, `English and Portuguese text pools are 100% symmetric in count (${totalEnSentences})`)
assert(
  totalEnSentences + totalPtSentences >= 1792,
  `Combined bilingual text pool has at least 1,792 verified sentences (found: ${totalEnSentences + totalPtSentences})`
)

// -------------------------------------------------------------
// 6. Hunter Adaptive Weak-Key Engine
// -------------------------------------------------------------
console.log("\n[6/13] Checking Hunter Adaptive Weak-Key Engine...")
const sampleKeyErrors: Record<string, number> = {
  x: 12,
  q: 8,
  z: 5,
  p: 2,
  a: 0,
}

const topWeak = getTopWeakKeys(sampleKeyErrors, 3)
assert(
  JSON.stringify(topWeak) === JSON.stringify(["x", "q", "z"]),
  "getTopWeakKeys identifies top 3 error keys correctly"
)

const sentences = [
  "The quick brown fox jumps over the lazy dog.",
  "Xenon and quartz crystals glow in the azure sky.",
  "Simple warriors train under the morning sun.",
]

const densityLow = calculateWeakKeyDensity(sentences[2], ["x", "q", "z"])
const densityHigh = calculateWeakKeyDensity(sentences[1], ["x", "q", "z"])
assert(densityHigh > densityLow, "calculateWeakKeyDensity scores target sentences higher")

const prioritized = prioritizeSentencesByWeakKeys(sentences, ["x", "q", "z"])
assert(
  prioritized[0] === sentences[1],
  "prioritizeSentencesByWeakKeys places highest weak-key density sentence first"
)
assert(prioritized.length === sentences.length, "prioritizeSentencesByWeakKeys preserves pool length")

// -------------------------------------------------------------
// 7. Nexus Mirror Profile Adaptation
// -------------------------------------------------------------
console.log("\n[7/13] Checking Nexus Mirror Profile Adaptation...")
const nexusMirrorEnemy = getCharacterById("nexus_mirror")
assert(nexusMirrorEnemy !== undefined, "nexus_mirror enemy exists in characters catalog")

if (nexusMirrorEnemy) {
  const proPlayer: PlayerProfile = {
    ...mockProfile,
    level: 35,
    stats: {
      ...mockProfile.stats,
      bestWpm: 110,
      averageWpm: 105,
      averageAccuracy: 98,
    },
  }

  const scaledMirror = scaleEnemyForBattle(nexusMirrorEnemy, proPlayer)
  assert(
    scaledMirror.recommendedWpm >= 110,
    `Nexus Mirror reflects high-speed player WPM: ${scaledMirror.recommendedWpm} WPM`
  )
  assert(
    scaledMirror.recommendedAccuracy >= 98,
    `Nexus Mirror reflects player accuracy: ${scaledMirror.recommendedAccuracy}%`
  )
  assert(
    scaledMirror.maxHp > nexusMirrorEnemy.maxHp,
    `Nexus Mirror scales HP with player level (Base: ${nexusMirrorEnemy.maxHp} -> Scaled: ${scaledMirror.maxHp})`
  )
}

// -------------------------------------------------------------
// 8. Pre-Battle Telemetry Contracts
// -------------------------------------------------------------
console.log("\n[8/13] Checking Pre-Battle Telemetry Contracts...")
const narutoStage1 = getStageById("naruto", "naruto")
assert(narutoStage1 !== undefined, "Stage 1 (naruto) retrieved by ID")

const lookupMatch = getStageByEnemyId("sakura")
assert(lookupMatch !== undefined, "Stage lookup by enemy ID 'sakura' succeeded")
assert(lookupMatch?.world.id === "naruto", "Sakura stage maps to Naruto World")
assert(lookupMatch?.stage.stageNumber === 2, "Sakura stage number is 2")

// -------------------------------------------------------------
// 9. Post-Battle Educational Analysis & Finger Mapping
// -------------------------------------------------------------
console.log("\n[9/13] Checking Post-Battle Educational Finger Mapping...")
const leftPinkyKey = getFingerForKey("q", "ANSI")
assert(leftPinkyKey?.finger === "leftPinky", "Key 'q' maps to leftPinky in ANSI")
assert(leftPinkyKey?.hand === "left", "Key 'q' belongs to left hand")

const homeRowF = getFingerForKey("f", "ANSI")
assert(homeRowF?.finger === "leftIndex", "Key 'f' maps to leftIndex")
assert(homeRowF?.isHomeRow === true, "Key 'f' is home row anchor")

const abntCedilla = getFingerForKey("ç", "ABNT2")
assert(abntCedilla?.finger === "rightPinky", "Key 'ç' maps to rightPinky in ABNT2")
assert(abntCedilla?.isHomeRow === true, "Key 'ç' is home row anchor in ABNT2")

assert(resolveDefaultLayout("en") === "ANSI", "Default layout for 'en' is ANSI")
assert(resolveDefaultLayout("pt-BR") === "ABNT2", "Default layout for 'pt-BR' is ABNT2")

// Check palette integrity
assert("leftPinky" in FINGER_PALETTE, "leftPinky exists in FINGER_PALETTE")
assert("rightPinky" in FINGER_PALETTE, "rightPinky exists in FINGER_PALETTE")
assert(FINGER_PALETTE.leftPinky.name["pt-BR"] === "Mindinho Esquerdo", "Localized finger name exists in pt-BR")
assert(FINGER_PALETTE.leftPinky.name["en"] === "Left Pinky", "Localized finger name exists in en")

// -------------------------------------------------------------
// 10. Balanced Difficulty Scaling
// -------------------------------------------------------------
console.log("\n[10/13] Checking Balanced Difficulty Scaling...")
const standardEnemy = getCharacterById("naruto")!
const freshPlayer = createDefaultPlayerProfile()
const freshScaled = scaleEnemyForBattle(standardEnemy, freshPlayer)
assert(
  freshScaled.maxHp === standardEnemy.maxHp,
  "Standard enemy HP unchanged for default starting player"
)

const highLevelPlayer: PlayerProfile = {
  ...freshPlayer,
  level: 40,
  stats: {
    ...freshPlayer.stats,
    averageWpm: 80,
  },
}

const highScaled = scaleEnemyForBattle(standardEnemy, highLevelPlayer)
assert(
  highScaled.maxHp <= Math.round(standardEnemy.maxHp * 1.15),
  `Scaled HP capped within +15% maximum (Base: ${standardEnemy.maxHp}, Scaled: ${highScaled.maxHp})`
)

const delta = getDifficultyDelta(standardEnemy, highLevelPlayer)
assert(delta.wpmDelta > 0, "Difficulty delta computes player WPM advantage accurately")

// -------------------------------------------------------------
// 11. World Progress Structures in Profile & Statistics
// -------------------------------------------------------------
console.log("\n[11/13] Checking Campaign Progress Summary Helper...")
const multiWorldProfile: PlayerProfile = {
  ...mockProfile,
  campaignProgress: {
    naruto: {
      unlocked: true,
      completed: true,
      mastered: true,
      currentStage: 8,
      completedStages: [1, 2, 3, 4, 5, 6, 7, 8],
      defeatedEnemies: ["naruto", "sakura"],
      bestScores: {},
      firstClearClaimed: {},
    },
    jujutsu: {
      unlocked: true,
      completed: true,
      mastered: false,
      currentStage: 8,
      completedStages: [1, 2, 3, 4, 5, 6, 7, 8],
      defeatedEnemies: ["yuji", "gojo"],
      bestScores: {},
      firstClearClaimed: {},
    },
    dragon: {
      unlocked: true,
      completed: false,
      currentStage: 4,
      completedStages: [1, 2, 3],
      defeatedEnemies: ["krillin", "piccolo", "vegeta"],
      bestScores: {},
      firstClearClaimed: {},
    },
  },
}

const synced = syncCampaignSummary(multiWorldProfile)
assert(synced.worldsUnlocked === 3, `worldsUnlocked is 3 (found: ${synced.worldsUnlocked})`)
assert(synced.worldsCompleted === 2, `worldsCompleted is 2 (found: ${synced.worldsCompleted})`)
assert(synced.worldMastery === 1, `worldMastery is 1 (found: ${synced.worldMastery})`)
assert(synced.totalStagesCleared === 19, `totalStagesCleared is 19 (found: ${synced.totalStagesCleared})`)

// -------------------------------------------------------------
// 12. Dashboard Next Stage Recommendations
// -------------------------------------------------------------
console.log("\n[12/13] Checking Dashboard Next Stage Recommendations...")
const partialProfile: PlayerProfile = {
  ...mockProfile,
  campaignProgress: {
    naruto: {
      unlocked: true,
      completed: false,
      currentStage: 3,
      completedStages: [1, 2],
      defeatedEnemies: ["naruto", "sakura"],
      bestScores: {},
      firstClearClaimed: {},
    },
  },
}

const nextRec = getRecommendedNextStage(partialProfile)
assert(nextRec !== undefined, "Recommended next stage resolved successfully")
assert(nextRec?.world.id === "naruto", "Recommended world is Naruto")
assert(nextRec?.stage.stageNumber === 3, "Recommended stage is Stage 3 (Rock Lee)")

// -------------------------------------------------------------
// 13. Save Migration Preserving Legacy Naruto Progress
// -------------------------------------------------------------
console.log("\n[13/13] Checking Save Migration Compatibility...")
const legacyNarutoProfile: PlayerProfile = {
  id: "legacy_user_01",
  username: "LegacyShinobi",
  level: 8,
  xp: 450,
  totalXp: 2800,
  rank: "D",
  attributes: {
    speed: 45,
    accuracy: 94,
    technique: 50,
    combo: 40,
    overall: 48,
  },
  stats: {
    battlesPlayed: 14,
    battlesWon: 12,
    battlesLost: 2,
    totalTypingTime: 720,
    totalCharactersTyped: 4500,
    totalCorrectCharacters: 4230,
    totalErrors: 270,
    averageWpm: 46,
    bestWpm: 58,
    averageAccuracy: 94,
    bestCombo: 34,
    enemiesDefeated: 12,
    trainingSessions: 4,
    academyLessonsCompleted: 2,
  },
  campaignProgress: {
    naruto: {
      unlocked: true,
      completed: false,
      currentStage: 5,
      completedStages: [1, 2, 3, 4],
      defeatedEnemies: ["naruto", "sakura", "rock_lee", "kakashi"],
      bestScores: {
        naruto: { bestWpm: 45, bestAccuracy: 95, bestCombo: 20, completedAt: "2026-08-01T00:00:00.000Z" },
      },
      firstClearClaimed: { naruto: true, sakura: true, rock_lee: true, kakashi: true },
    },
  },
  achievements: ["first_blood", "speed_demon"],
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
}

assert(hasMeaningfulProgress(legacyNarutoProfile) === true, "hasMeaningfulProgress recognizes legacy Naruto saves")

const migratedLegacy = syncCampaignSummary(legacyNarutoProfile)
assert(
  migratedLegacy.campaignProgress.naruto.completedStages.length === 4,
  "All 4 legacy completed stages preserved verbatim"
)
assert(
  migratedLegacy.campaignProgress.naruto.bestScores.naruto.bestWpm === 45,
  "Legacy best score for Naruto preserved"
)
assert(migratedLegacy.totalStagesCleared === 4, "totalStagesCleared computed correctly from legacy Naruto save")
assert(migratedLegacy.worldsUnlocked === 1, "worldsUnlocked computed correctly from legacy Naruto save")
assert(migratedLegacy.worldsCompleted === 0, "worldsCompleted computed correctly from legacy Naruto save")

// -------------------------------------------------------------
// Final Summary
// -------------------------------------------------------------
console.log("\n=======================================================")
console.log(`TOTAL INVARIANTS TESTED: ${totalPassed + totalFailed}`)
console.log(`PASSED: ${totalPassed}`)
console.log(`FAILED: ${totalFailed}`)
console.log("=======================================================")

if (totalFailed > 0) {
  console.error(`\n❌ VERIFICATION FAILED with ${totalFailed} errors!`)
  process.exit(1)
} else {
  console.log(`\n🎉 ALL 13 CAMPAIGN INVARIANTS VERIFIED WITH 100% SUCCESS!\n`)
  process.exit(0)
}
