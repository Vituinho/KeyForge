/**
 * KeyForge v3.3.1 Balance & Progression Verification Suite
 * 
 * Verifies real combat simulations across 6 standard personas:
 * - BEGINNER: 30 WPM, 92% Acc
 * - CASUAL: 45 WPM, 95% Acc
 * - INTERMEDIATE: 60 WPM, 96% Acc
 * - ADVANCED: 75 WPM, 97% Acc
 * - EXPERT: 90 WPM, 98% Acc
 * - MASTER: 105 WPM, 99% Acc
 * 
 * And executes the priority Pain battle tests (Profiles A, B, and C).
 */

import { calculateDamage } from "../src/lib/battle/calculateDamage"
import { evaluateEnemyMechanics } from "../src/lib/battle/mechanicsEngine"
import { getCharacterById } from "../src/data/characters"
import { getAllWorlds } from "../src/data/worlds"
import { RoundResult } from "../src/types/battle"
import { TypingStats } from "../src/types/typing"
import { MultiPhaseConfig } from "../src/types/mechanics"

interface SimResult {
  victory: boolean
  durationSec: number
  sentences: number
  words: number
  dps: number
  playerHpLeft: number
  enemyHpLeft: number
}

function simulateCombat(
  enemyId: string,
  wpm: number,
  accuracy: number,
  errorRatePerSentence: number = 0.3
): SimResult {
  const enemy = getCharacterById(enemyId)
  if (!enemy) throw new Error(`Enemy ${enemyId} not found`)

  const wordsPerSentence = 13.7
  const secPerSentence = (wordsPerSentence / wpm) * 60

  const multiPhase = enemy.mechanics?.find(
    (m) => m.type === "multi-phase" || m.type === "multi-phase-boss"
  ) as MultiPhaseConfig | undefined

  const totalPhases = multiPhase ? multiPhase.totalPhases : 1
  const getPhaseHp = (phase: number) => {
    if (!multiPhase) return enemy.maxHp
    const ratio = multiPhase.phaseHpRatios[phase - 1] ?? 1 / totalPhases
    return Math.round(enemy.maxHp * ratio)
  }

  let currentPhase = 1
  let currentPhaseHp = getPhaseHp(1)
  let playerHp = 100
  let totalTime = 0
  let sentences = 0
  let combo = 0
  const roundHistory: RoundResult[] = []

  while (currentPhase <= totalPhases && playerHp > 0 && totalTime < 360) {
    sentences++
    // Probabilistic error simulation based on errorRate
    const hasError = Math.random() < errorRatePerSentence ? 1 : 0
    if (hasError === 0) {
      combo += Math.round(wordsPerSentence)
    } else {
      combo = Math.max(0, Math.floor(combo * 0.5))
    }

    const roundStats = {
      currentWpm: wpm,
      currentRawWpm: wpm,
      currentAccuracy: accuracy,
      currentErrors: hasError,
      currentStreak: combo,
      battleWpm: wpm,
      battleAccuracy: accuracy,
      bestWpm: wpm,
      totalTypingAttempts: 100,
      totalErrors: hasError,
      combo,
      bestCombo: combo,
    } as unknown as TypingStats

    const baseResult = calculateDamage({
      wpm,
      accuracy,
      combo,
      errors: hasError,
      baseDamage: 30,
    })

    const mechanicEval = evaluateEnemyMechanics({
      roundStats,
      enemy,
      roundHistory,
      baseCalculatedDamage: baseResult.damage,
      currentPhase,
    })

    const finalDamage = mechanicEval.modifiedDamage
    currentPhaseHp = Math.max(0, currentPhaseHp - finalDamage)

    // Enemy attacks during sentence interval
    const attackCount = Math.floor(secPerSentence / (enemy.attackInterval / 1000))
    const totalEnemyDmg = attackCount * enemy.attack + mechanicEval.extraPlayerDamageTaken
    playerHp = Math.max(0, playerHp - totalEnemyDmg)
    totalTime += secPerSentence

    roundHistory.push({
      wpm,
      accuracy,
      combo,
      errors: hasError,
      damage: finalDamage,
      strikeType: baseResult.strikeType,
      text: "simulation phrase",
      activeEffects: mechanicEval.activeEffects,
    })

    if (currentPhaseHp <= 0) {
      if (currentPhase < totalPhases) {
        currentPhase++
        currentPhaseHp = getPhaseHp(currentPhase)
      } else {
        // All phases cleared!
        break
      }
    }
  }

  const victory = currentPhaseHp <= 0 && currentPhase >= totalPhases
  const totalEnemyDamageDealt = enemy.maxHp - (victory ? 0 : currentPhaseHp)
  const dps = totalTime > 0 ? totalEnemyDamageDealt / totalTime : 0

  return {
    victory,
    durationSec: totalTime,
    sentences,
    words: Math.round(sentences * wordsPerSentence),
    dps,
    playerHpLeft: playerHp,
    enemyHpLeft: victory ? 0 : currentPhaseHp,
  }
}

let totalAsserts = 0
let failedAsserts = 0

function assert(condition: boolean, testName: string, detail?: string) {
  totalAsserts++
  if (condition) {
    console.log(`  ✓ [PASS] ${testName}`)
  } else {
    failedAsserts++
    console.error(`  ✗ [FAIL] ${testName}${detail ? ` (${detail})` : ""}`)
  }
}

console.log("\n=======================================================")
console.log("⚔️ KEYFORGE v3.3.1 DIFFICULTY & PROGRESSION BALANCE SUITE")
console.log("=======================================================\n")

// -------------------------------------------------------------
// 1. Pain Priority Simulation (Profiles A, B, C)
// -------------------------------------------------------------
console.log("--- 1. Pain Priority Rebalance Simulation ---")

// Run multiple deterministic runs to average
function runAveragedSim(enemyId: string, wpm: number, acc: number, errRate: number, runs: number = 10): SimResult {
  let totalDur = 0
  let totalSent = 0
  let totalWords = 0
  let totalHp = 0
  let totalDps = 0
  let wins = 0

  for (let i = 0; i < runs; i++) {
    const res = simulateCombat(enemyId, wpm, acc, errRate)
    if (res.victory) wins++
    totalDur += res.durationSec
    totalSent += res.sentences
    totalWords += res.words
    totalHp += res.playerHpLeft
    totalDps += res.dps
  }

  return {
    victory: wins >= runs / 2,
    durationSec: totalDur / runs,
    sentences: Math.round(totalSent / runs),
    words: Math.round(totalWords / runs),
    dps: totalDps / runs,
    playerHpLeft: Math.round(totalHp / runs),
    enemyHpLeft: 0,
  }
}

const painA = runAveragedSim("pain", 40, 98, 0.05)
console.log(`\nPROFILE A (40 WPM, 98% Acc - Patient/Precision):`)
console.log(`  Result: ${painA.victory ? "VICTORY" : "DEFEAT"} | Duration: ${painA.durationSec.toFixed(1)}s | Words: ${painA.words} | DPS: ${painA.dps.toFixed(1)} | HP Left: ${painA.playerHpLeft}/100`)
assert(painA.victory, "Profile A achieves victory vs Pain despite lower WPM (40 WPM)")
assert(painA.durationSec >= 60 && painA.durationSec <= 120, "Profile A battle duration is reasonable (60-120s)", `${painA.durationSec.toFixed(1)}s`)

const painB = runAveragedSim("pain", 45, 95, 0.25)
console.log(`\nPROFILE B (45 WPM, 95% Acc - Baseline Expected):`)
console.log(`  Result: ${painB.victory ? "VICTORY" : "DEFEAT"} | Duration: ${painB.durationSec.toFixed(1)}s | Words: ${painB.words} | DPS: ${painB.dps.toFixed(1)} | HP Left: ${painB.playerHpLeft}/100`)
assert(painB.victory, "Profile B achieves victory vs Pain comfortably")
assert(painB.durationSec >= 60 && painB.durationSec <= 100, "Profile B battle duration is in target window (60-100s)", `${painB.durationSec.toFixed(1)}s`)

const painC = runAveragedSim("pain", 50, 97, 0.1)
console.log(`\nPROFILE C (50 WPM, 97% Acc - Momentum):`)
console.log(`  Result: ${painC.victory ? "VICTORY" : "DEFEAT"} | Duration: ${painC.durationSec.toFixed(1)}s | Words: ${painC.words} | DPS: ${painC.dps.toFixed(1)} | HP Left: ${painC.playerHpLeft}/100`)
assert(painC.victory, "Profile C achieves fast victory vs Pain")
assert(painC.durationSec < painB.durationSec, "Profile C defeats Pain faster than Profile B")

// -------------------------------------------------------------
// 2. Madara Simulation (50 WPM Baseline)
// -------------------------------------------------------------
console.log("\n--- 2. Madara Uchiha Rebalance Simulation ---")
const madaraSim = runAveragedSim("madara", 50, 95, 0.2)
console.log(`MADARA (50 WPM, 95% Acc):`)
console.log(`  Result: ${madaraSim.victory ? "VICTORY" : "DEFEAT"} | Duration: ${madaraSim.durationSec.toFixed(1)}s | Words: ${madaraSim.words} | DPS: ${madaraSim.dps.toFixed(1)} | HP Left: ${madaraSim.playerHpLeft}/100`)
assert(madaraSim.victory, "Madara is defeated by 50 WPM / 95% Acc player")
assert(madaraSim.durationSec >= 80 && madaraSim.durationSec <= 130, "Madara battle duration is within 80-130s target", `${madaraSim.durationSec.toFixed(1)}s`)

// -------------------------------------------------------------
// 3. World Progression Curve & Persona Reach Checks
// -------------------------------------------------------------
console.log("\n--- 3. Persona Progression Simulation ---")

// BEGINNER (30 WPM, 92% Acc): beats early Naruto stages (Naruto, Sakura, Rock Lee)
const begNaruto = runAveragedSim("naruto", 30, 92, 0.25)
const begSakura = runAveragedSim("sakura", 30, 92, 0.25)
const begLee = runAveragedSim("rock-lee", 32, 92, 0.25)
console.log(`BEGINNER (30 WPM) vs Naruto: ${begNaruto.victory ? "VICTORY" : "DEFEAT"} | Duration: ${begNaruto.durationSec.toFixed(1)}s | DPS: ${begNaruto.dps.toFixed(1)} | HP Left: ${begNaruto.playerHpLeft}/100`)
assert(begNaruto.victory, "Beginner (30 WPM) clears Stage 1 Naruto")
assert(begSakura.victory, "Beginner (30 WPM) clears Stage 2 Sakura")
assert(begLee.victory, "Beginner (32 WPM) clears Stage 3 Rock Lee")
assert(begNaruto.durationSec <= 65, "Stage 1 tutorial battle completes under 65 seconds", `${begNaruto.durationSec.toFixed(1)}s`)

// CASUAL (45 WPM, 95% Acc): clears all of Naruto World and early Jujutsu
const casGojo = runAveragedSim("yuji", 45, 95, 0.15)
console.log(`CASUAL (45 WPM) vs Yuji: ${casGojo.victory ? "VICTORY" : "DEFEAT"} | Duration: ${casGojo.durationSec.toFixed(1)}s | DPS: ${casGojo.dps.toFixed(1)} | HP Left: ${casGojo.playerHpLeft}/100`)
assert(casGojo.victory, "Casual (45 WPM) clears early Jujutsu (Yuji)")

// INTERMEDIATE (60 WPM, 96% Acc): clears Jujutsu Gojo and early Dragon
const intGojo = runAveragedSim("gojo", 58, 97, 0.15)
console.log(`INTERMEDIATE (58 WPM) vs Gojo: ${intGojo.victory ? "VICTORY" : "DEFEAT"} | Duration: ${intGojo.durationSec.toFixed(1)}s | DPS: ${intGojo.dps.toFixed(1)} | HP Left: ${intGojo.playerHpLeft}/100`)
assert(intGojo.victory, "Intermediate clears Jujutsu Boss Gojo")
assert(intGojo.durationSec >= 60 && intGojo.durationSec <= 120, "Gojo battle duration is balanced (60-120s)", `${intGojo.durationSec.toFixed(1)}s`)

const intGoku = runAveragedSim("goku", 65, 95, 0.15)
console.log(`INTERMEDIATE (65 WPM) vs Goku: ${intGoku.victory ? "VICTORY" : "DEFEAT"} | Duration: ${intGoku.durationSec.toFixed(1)}s | DPS: ${intGoku.dps.toFixed(1)} | HP Left: ${intGoku.playerHpLeft}/100`)
assert(intGoku.victory, "Intermediate (65 WPM) clears Dragon Boss Goku without requiring 100 WPM")
assert(intGoku.durationSec >= 60 && intGoku.durationSec <= 120, "Goku battle duration is balanced (60-120s)", `${intGoku.durationSec.toFixed(1)}s`)

// ADVANCED (75 WPM, 97% Acc): clears Pirate Luffy and Hunter Jin-Woo
const advLuffy = runAveragedSim("luffy", 70, 95, 0.15)
console.log(`ADVANCED (70 WPM) vs Luffy: ${advLuffy.victory ? "VICTORY" : "DEFEAT"} | Duration: ${advLuffy.durationSec.toFixed(1)}s | DPS: ${advLuffy.dps.toFixed(1)} | HP Left: ${advLuffy.playerHpLeft}/100`)
assert(advLuffy.victory, "Advanced (70 WPM) clears Pirate Boss Luffy")
assert(advLuffy.durationSec >= 60 && advLuffy.durationSec <= 120, "Luffy battle duration is balanced (60-120s)", `${advLuffy.durationSec.toFixed(1)}s`)

const advJinwoo = runAveragedSim("jinwoo", 75, 95, 0.15)
console.log(`ADVANCED (75 WPM) vs Jin-Woo: ${advJinwoo.victory ? "VICTORY" : "DEFEAT"} | Duration: ${advJinwoo.durationSec.toFixed(1)}s | DPS: ${advJinwoo.dps.toFixed(1)} | HP Left: ${advJinwoo.playerHpLeft}/100`)
assert(advJinwoo.victory, "Advanced (75 WPM) clears Hunter Boss Sung Jin-Woo at 95% Acc without strict 96%+ cliff")
assert(advJinwoo.durationSec >= 60 && advJinwoo.durationSec <= 125, "Jin-Woo battle duration is balanced (60-125s)", `${advJinwoo.durationSec.toFixed(1)}s`)

// EXPERT (90 WPM, 98% Acc): clears Demon Muzan
const expMuzan = runAveragedSim("muzan", 85, 96, 0.1)
console.log(`EXPERT (85 WPM) vs Muzan: ${expMuzan.victory ? "VICTORY" : "DEFEAT"} | Duration: ${expMuzan.durationSec.toFixed(1)}s | DPS: ${expMuzan.dps.toFixed(1)} | HP Left: ${expMuzan.playerHpLeft}/100`)
assert(expMuzan.victory, "Expert (85 WPM) clears Demon Boss Muzan without strict 97%+ cliff")
assert(expMuzan.durationSec >= 60 && expMuzan.durationSec <= 130, "Muzan battle duration is balanced (60-130s)", `${expMuzan.durationSec.toFixed(1)}s`)

// MASTER (105 WPM, 99% Acc): clears The Nexus Mirror
const masNexus = runAveragedSim("nexus_mirror", 105, 98, 0.05)
console.log(`MASTER (105 WPM) vs Nexus Mirror: ${masNexus.victory ? "VICTORY" : "DEFEAT"} | Duration: ${masNexus.durationSec.toFixed(1)}s | DPS: ${masNexus.dps.toFixed(1)} | HP Left: ${masNexus.playerHpLeft}/100`)
assert(masNexus.victory, "Master (105 WPM) conquers The Nexus Mirror")
assert(masNexus.durationSec >= 75 && masNexus.durationSec <= 150, "Nexus Mirror battle duration fits grand climax (75-150s)", `${masNexus.durationSec.toFixed(1)}s`)

// -------------------------------------------------------------
// 4. Invariant Checks: Only World 7 Reaches 100+ WPM
// -------------------------------------------------------------
console.log("\n--- 4. World Speed Ceiling Invariant ---")
const worlds = getAllWorlds()
for (const w of worlds) {
  for (const s of w.stages) {
    if (w.id !== "nexus") {
      assert(
        s.recommendedWpm < 100,
        `${w.series} Stage ${s.stageNumber} (${s.name}) recommendedWpm is below 100 WPM (Actual: ${s.recommendedWpm})`
      )
    }
  }
}

console.log(`\n=======================================================`)
console.log(`BALANCE VERIFICATION SUMMARY:`)
console.log(`TOTAL CHECKS: ${totalAsserts} | PASSED: ${totalAsserts - failedAsserts} | FAILED: ${failedAsserts}`)
console.log(`=======================================================\n`)

if (failedAsserts > 0) {
  process.exit(1)
}
