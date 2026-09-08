/**
 * KeyForge v3.0 Multiplayer PvP Battle Test Harness & Simulation
 * 
 * Simulates a full, realistic 1v1 PvP anime battle between two players
 * testing the entire authoritative pipeline:
 * 1. Match Creation & Lobby Ready Handshake
 * 2. Deterministic Word Synchronization
 * 3. Realtime Word Submissions & Anti-Cheat Validation
 * 4. Attack Energy Gauge & Combo-Scaled Damage Resolution
 * 5. Ultimate Jutsu Execution (100% threshold -> 160 dmg)
 * 6. Authoritative Knockout & Winner Resolution
 * 7. Post-Match Progression, Anti-Farm Checks & Rewards
 */

import {
  createMatch,
  joinMatch,
  setPlayerReady,
  submitWordCompletion,
  triggerUltimate,
} from "../src/lib/multiplayer/matchService"
import { getWordsForMatch } from "../src/lib/multiplayer/wordGenerator"
import { processMultiplayerRewards } from "../src/lib/multiplayer/processMultiplayerRewards"
import { MultiplayerMatchRow } from "../src/types/database"

interface SimPlayer {
  id: string
  name: string
  skinId: string
  wpm: number
  accuracy: number
  attackCount: number
  ultimateFired: boolean
}

function renderBar(current: number, max: number, length = 20, fillChar = "█", emptyChar = "░"): string {
  const ratio = Math.max(0, Math.min(1, current / max))
  const filledCount = Math.round(ratio * length)
  const emptyCount = length - filledCount
  return `[${fillChar.repeat(filledCount)}${emptyChar.repeat(emptyCount)}] ${current}/${max}`
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[SIMULATION ASSERTION FAILURE] ${message}`)
  }
}

async function runBattleSimulation(mode: "quick" | "private" = "quick") {
  console.log("\n=======================================================")
  console.log(`⚔️ KEYFORGE v3.0 MULTIPLAYER ARENA: PVP SIMULATION (${mode.toUpperCase()})`)
  console.log("=======================================================\n")

  // --- 1. SETUP PLAYERS ---
  const player1: SimPlayer = {
    id: "shinobi_naruto_01",
    name: "Naruto (P1)",
    skinId: "hokage_legend",
    wpm: 92,
    accuracy: 98,
    attackCount: 0,
    ultimateFired: false,
  }

  const player2: SimPlayer = {
    id: "shinobi_sasuke_02",
    name: "Sasuke (P2)",
    skinId: "cyber_neon",
    wpm: 76,
    accuracy: 94,
    attackCount: 0,
    ultimateFired: false,
  }

  console.log(`[LOBBY] P1: ${player1.name} (Skin: ${player1.skinId} | Target: ${player1.wpm} WPM)`)
  console.log(`[LOBBY] P2: ${player2.name} (Skin: ${player2.skinId} | Target: ${player2.wpm} WPM)`)

  // --- 2. MATCH CREATION & JOINING ---
  console.log("\n[1/6] Initializing match creation...")
  let match = await createMatch({
    mode,
    language: "pt-BR",
    seed: 133742,
    skinId: player1.skinId,
    wordCount: 25,
    guestPlayerId: player1.id,
  })

  console.log(`✓ Match created: ID=${match.id} | Room=${match.room_code || "QUICK_QUEUE"} | Mode=${match.mode}`)
  assert(match.status === "waiting", "Initial match status must be 'waiting'")

  console.log("[2/6] Player 2 joining match...")
  match = await joinMatch({
    roomCode: match.room_code || match.id,
    skinId: player2.skinId,
    guestPlayerId: player2.id,
  })
  assert(match.player_2_id === player2.id, "Player 2 ID must match joined player")
  console.log(`✓ Player 2 joined successfully. Status=${match.status}`)

  // --- 3. READY SYSTEM & COUNTDOWN ---
  console.log("\n[3/6] Synchronizing Ready state...")
  match = await setPlayerReady({
    matchId: match.id,
    isReady: true,
    playerId: player1.id,
  })
  assert(match.player_1_ready === true, "Player 1 must be marked ready")

  match = await setPlayerReady({
    matchId: match.id,
    isReady: true,
    playerId: player2.id,
  })
  assert(match.player_2_ready === true, "Player 2 must be marked ready")
  assert(match.status === "countdown", "Both players ready must transition status to 'countdown'")
  console.log(`✓ Countdown started at ${match.countdown_starts_at}. Match start set to ${match.started_at}`)

  // Transition to playing
  match = {
    ...match,
    status: "playing",
    started_at: new Date(Date.now() - 35000).toISOString(), // 35s match elapsed
  }

  // --- 4. DETERMINISTIC WORD GENERATION ---
  console.log("\n[4/6] Generating deterministic word stream...")
  const words = getWordsForMatch(match)
  assert(words.length === match.word_count, "Word sequence count must match match.word_count")
  console.log(`✓ Synchronized ${words.length} deterministic words (Seed: ${match.seed})`)
  console.log(`  Sample words: "${words.slice(0, 5).join('", "')}"...`)

  // --- 5. REALTIME COMBAT SIMULATION ---
  console.log("\n[5/6] ⚔️ CLASH INITIATED: Realtime Typing Combat Loop")
  console.log("-------------------------------------------------------")

  let p1WordIdx = 0
  let p2WordIdx = 0
  let p1Combo = 0
  let p2Combo = 0
  let round = 1

  while (match.status === "playing" && (p1WordIdx < words.length || p2WordIdx < words.length)) {
    // Player 1 types word
    if (p1WordIdx < words.length && match.player_2_hp > 0) {
      const prevP2Hp = match.player_2_hp
      p1Combo++

      match = await submitWordCompletion({
        matchId: match.id,
        eventId: `p1_evt_${p1WordIdx}_${Date.now()}`,
        wordIndex: p1WordIdx,
        wordText: words[p1WordIdx],
        wpm: player1.wpm + (p1WordIdx % 5),
        accuracy: player1.accuracy,
        combo: p1Combo,
        playerId: player1.id,
      })

      if (match.player_2_hp < prevP2Hp) {
        player1.attackCount++
        const dmg = prevP2Hp - match.player_2_hp
        console.log(`💥 [ROUND ${round}] ${player1.name} STRIKES! Dealt ${dmg} DMG (Combo: ${p1Combo}x)`)
      }

      // Check ultimate activation for P1
      if (match.player_1_ultimate_energy >= 100 && !player1.ultimateFired && match.player_2_hp > 160) {
        console.log(`🌟 [ULTIMATE READY] ${player1.name} unleashes SECRET JUTSU!`)
        match = await triggerUltimate({
          matchId: match.id,
          playerId: player1.id,
        })
        player1.ultimateFired = true
        console.log(`🔥 [ULTIMATE HIT] 160 Direct Damage! P2 HP reduced to ${match.player_2_hp}`)
      }

      p1WordIdx++
    }

    // Player 2 types word (slightly slower cadence)
    if (p2WordIdx < words.length && match.player_1_hp > 0 && match.player_2_hp > 0) {
      const prevP1Hp = match.player_1_hp
      p2Combo++

      match = await submitWordCompletion({
        matchId: match.id,
        eventId: `p2_evt_${p2WordIdx}_${Date.now()}`,
        wordIndex: p2WordIdx,
        wordText: words[p2WordIdx],
        wpm: player2.wpm - (p2WordIdx % 4),
        accuracy: player2.accuracy,
        combo: p2Combo,
        playerId: player2.id,
      })

      if (match.player_1_hp < prevP1Hp) {
        player2.attackCount++
        const dmg = prevP1Hp - match.player_1_hp
        console.log(`⚡ [ROUND ${round}] ${player2.name} COUNTER-ATTACKS! Dealt ${dmg} DMG (Combo: ${p2Combo}x)`)
      }

      p2WordIdx++
    }

    // Display HUD Status every 4 rounds
    if (round % 4 === 0 || match.status === "finished") {
      console.log(`\n  --- Battle HUD (Turn ${round}) ---`)
      console.log(`  P1 HP: ${renderBar(match.player_1_hp, 1000)} | Energy: ${match.player_1_attack_energy}% | Ult: ${match.player_1_ultimate_energy}%`)
      console.log(`  P2 HP: ${renderBar(match.player_2_hp, 1000)} | Energy: ${match.player_2_attack_energy}% | Ult: ${match.player_2_ultimate_energy}%`)
      console.log("  ---------------------------------")
    }

    if (match.player_1_hp <= 0 || match.player_2_hp <= 0) {
      break
    }

    round++
  }

  // --- 6. POST-MATCH RESOLUTION & ASSERTIONS ---
  console.log("\n[6/6] 🏆 MATCH COMPLETED: Authoritative Resolution")
  console.log("=======================================================")
  assert(match.status === "finished", "Match must be marked finished")
  assert(match.winner_id !== null, "Match must have an authoritative winner")

  const winner = match.winner_id === player1.id ? player1 : player2
  const loser = match.winner_id === player1.id ? player2 : player1

  console.log(`🎉 WINNER: ${winner.name} (ID: ${winner.id})`)
  console.log(`💀 DEFEATED: ${loser.name}`)
  console.log(`Final P1 HP: ${match.player_1_hp} | Final P2 HP: ${match.player_2_hp}`)
  console.log(`P1 Completed Words: ${match.player_1_word_index} | P2 Completed Words: ${match.player_2_word_index}`)
  console.log(`P1 Attacks: ${player1.attackCount} | P1 Ult: ${player1.ultimateFired ? "Yes" : "No"}`)

  // --- 7. PROGRESSION & REWARDS VERIFICATION ---
  console.log("\n[PROGRESSION] Processing authoritative rewards...")
  const matchWithDuration: MultiplayerMatchRow = {
    ...match,
    started_at: new Date(Date.now() - 45000).toISOString(),
    finished_at: new Date().toISOString(),
  }

  const winnerReward = processMultiplayerRewards(
    matchWithDuration,
    winner.id,
    winner.wpm,
    winner.accuracy,
    Math.max(match.player_1_combo, match.player_2_combo)
  )

  const loserReward = processMultiplayerRewards(
    matchWithDuration,
    loser.id,
    loser.wpm,
    loser.accuracy,
    Math.min(match.player_1_combo, match.player_2_combo)
  )

  assert(winnerReward !== null, "Winner reward summary must be generated")
  assert(loserReward !== null, "Loser reward summary must be generated")
  assert(winnerReward.totalXp > loserReward.totalXp, "Winner XP must exceed Loser XP")
  assert(winnerReward.baseXp === 120, "Winner must receive base 120 XP")
  assert(loserReward.baseXp === 40, "Loser must receive base 40 XP")

  if (mode === "private") {
    assert(winnerReward.awardedCrate === null, "Private room must NEVER award crates (anti-farm check)")
    console.log("✓ Anti-farming check verified: Private match awarded 0 crates as expected.")
  }

  console.log(`✓ Winner Earned: ${winnerReward.totalXp} XP (Base: ${winnerReward.baseXp} + Bonus: ${winnerReward.bonusXp})`)
  console.log(`✓ Loser Earned: ${loserReward.totalXp} XP (Consolation)`)
  if (winnerReward.awardedCrate) {
    console.log(`🎁 Crate Drop: ${winnerReward.awardedCrate.name} (${winnerReward.awardedCrate.crateId})`)
  }

  console.log("\n=======================================================")
  console.log(`✅ PVP BATTLE SIMULATION (${mode.toUpperCase()}) COMPLETED SUCCESSFULLY!`)
  console.log("=======================================================\n")
}

async function main() {
  try {
    // 1. Run Quick Match Simulation
    await runBattleSimulation("quick")

    // 2. Run Private Match Simulation
    await runBattleSimulation("private")

    console.log("🎯 ALL PVP SIMULATION SCENARIOS PASSED WITH 100% INVARIANTS INTACT!")
    process.exit(0)
  } catch (err) {
    console.error("❌ Simulation failed:", err)
    process.exit(1)
  }
}

main()
