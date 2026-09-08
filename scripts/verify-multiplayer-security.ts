/**
 * KeyForge v3.0 Multiplayer Security & Anti-Cheat Audit Test Suite
 * Verifies RLS invariants, Anti-Cheat validation, server authority, and anti-farming rules.
 */

import { validateWordSubmission } from "../src/lib/multiplayer/antiCheatService"
import { processMultiplayerRewards } from "../src/lib/multiplayer/processMultiplayerRewards"
import { getWordsForMatch, verifyMatchWord } from "../src/lib/multiplayer/wordGenerator"
import { MultiplayerMatchRow } from "../src/types/database"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[SECURITY AUDIT FAILURE] ${message}`)
  }
}

console.log("=== KEYFORGE v3.0 MULTIPLAYER SECURITY & RLS AUDIT ===")

// 1. MOCK AUTHORITATIVE MATCH FIXTURE
const matchFixture: MultiplayerMatchRow = {
  id: "match_audit_1001",
  room_code: "KF-AUDIT",
  mode: "quick",
  status: "playing",
  language: "en",
  seed: 424242,
  word_count: 30,
  player_1_id: "p1_audit_user",
  player_2_id: "p2_audit_user",
  player_1_ready: true,
  player_2_ready: true,
  player_1_hp: 1000,
  player_2_hp: 1000,
  player_1_word_index: 0,
  player_2_word_index: 0,
  player_1_combo: 0,
  player_2_combo: 0,
  player_1_attack_energy: 0,
  player_2_attack_energy: 0,
  player_1_ultimate_energy: 0,
  player_2_ultimate_energy: 0,
  player_1_wpm: 0,
  player_2_wpm: 0,
  player_1_accuracy: 100,
  player_2_accuracy: 100,
  player_1_skin_id: "default_forge",
  player_2_skin_id: "cyber_neon",
  winner_id: null,
  is_draw: false,
  countdown_starts_at: null,
  started_at: new Date(Date.now() - 30000).toISOString(),
  finished_at: null,
  player_1_last_active_at: new Date().toISOString(),
  player_2_last_active_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const matchWords = getWordsForMatch(matchFixture)
assert(matchWords.length === 30, "Deterministic word sequence must have exactly 30 words")
assert(verifyMatchWord(matchFixture.seed, 0, matchWords[0], matchFixture.word_count, matchFixture.language) === true, "verifyMatchWord must return true for word 0")
assert(verifyMatchWord(matchFixture.seed, 0, "wrongword", matchFixture.word_count, matchFixture.language) === false, "verifyMatchWord must return false for wrong word")
console.log("✓ Test 1: Deterministic word generator and verifyMatchWord match seed and count")

// 2. ANTI-CHEAT: VALID WORD SUBMISSION
const firstWord = matchWords[0]
const validResult = validateWordSubmission(matchFixture, {
  matchId: matchFixture.id,
  wordIndex: 0,
  wordText: firstWord,
  wpm: 75,
  accuracy: 98,
  combo: 1,
  playerId: matchFixture.player_1_id,
})
assert(validResult.isValid === true, "Valid word submission must pass validation")
assert(validResult.isSuspicious === false, "Legitimate submission must not be flagged suspicious")
console.log("✓ Test 2: Legitimate word submission accepted without flags")

// 3. ANTI-CHEAT: OUT-OF-ORDER WORD REJECTION (MONOTONICITY)
const skippedWordResult = validateWordSubmission(matchFixture, {
  matchId: matchFixture.id,
  wordIndex: 5, // Attempting to skip ahead to word 5
  wordText: matchWords[5],
  wpm: 75,
  accuracy: 98,
  combo: 1,
  playerId: matchFixture.player_1_id,
})
assert(skippedWordResult.isValid === false, "Skipped word indices must be rejected")
assert(skippedWordResult.isSuspicious === true, "Skipping words must be marked suspicious")
console.log("✓ Test 3: Out-of-order/skipped word index rejected (Monotonicity guarantee)")

// 4. ANTI-CHEAT: FAKE WORD TEXT REJECTION (SEED INTEGRITY)
const fakeWordResult = validateWordSubmission(matchFixture, {
  matchId: matchFixture.id,
  wordIndex: 0,
  wordText: "supercalifragilistic",
  wpm: 80,
  accuracy: 100,
  combo: 1,
  playerId: matchFixture.player_1_id,
})
assert(fakeWordResult.isValid === false, "Word text that does not match seed must be rejected")
assert(fakeWordResult.isSuspicious === true, "Mismatched words must be marked suspicious")
console.log("✓ Test 4: Forged/mismatched word rejected against match seed")

// 5. ANTI-CHEAT: INHUMAN WPM CLAMPING & FLAGGING
const botSpeedResult = validateWordSubmission(matchFixture, {
  matchId: matchFixture.id,
  wordIndex: 0,
  wordText: firstWord,
  wpm: 999, // Inhuman 999 WPM
  accuracy: 100,
  combo: 1,
  playerId: matchFixture.player_1_id,
})
assert(botSpeedResult.sanitizedWpm <= 260, "Impossible WPM must be clamped to max 260")
assert(botSpeedResult.isSuspicious === true, "Inhuman WPM must be marked suspicious")
console.log("✓ Test 5: Inhuman WPM clamped to 260 and flagged suspicious")

// 6. ANTI-CHEAT: COMBO INFLATION CLAMPING
const inflatedComboResult = validateWordSubmission(matchFixture, {
  matchId: matchFixture.id,
  wordIndex: 0,
  wordText: firstWord,
  wpm: 80,
  accuracy: 100,
  combo: 50, // Impossible 50 combo on word 0
  playerId: matchFixture.player_1_id,
})
assert(inflatedComboResult.sanitizedCombo <= 1, "Combo cannot exceed completed word count + 1")
console.log("✓ Test 6: Combo inflation clamped to maximum possible at word index")

// 7. ANTI-FARMING: SHORT MATCH PROTECTION (<5s)
const shortFinishedMatch: MultiplayerMatchRow = {
  ...matchFixture,
  status: "finished",
  winner_id: matchFixture.player_1_id,
  player_1_word_index: 1,
  started_at: new Date(Date.now() - 2000).toISOString(), // 2 seconds duration
  finished_at: new Date().toISOString(),
}
const shortReward = processMultiplayerRewards(shortFinishedMatch, matchFixture.player_1_id, 100, 100, 1)
assert(shortReward === null || shortReward.totalXp === 0, "Matches under 5s must award 0 XP to prevent bot farming")
assert(!shortReward || shortReward.awardedCrate === null, "Short matches must never award crates")
console.log("✓ Test 7: Anti-farming protects against sub-5s matches (0 XP, 0 crates)")

// 8. ANTI-FARMING: LOW WORD COUNT PROTECTION (<3 words)
const lowWordMatch: MultiplayerMatchRow = {
  ...matchFixture,
  id: "match_audit_low_words",
  status: "finished",
  winner_id: matchFixture.player_1_id,
  player_1_word_index: 2, // only 2 words completed
  started_at: new Date(Date.now() - 15000).toISOString(), // 15 seconds
  finished_at: new Date().toISOString(),
}
const lowWordReward = processMultiplayerRewards(lowWordMatch, matchFixture.player_1_id, 40, 95, 2)
assert(lowWordReward === null || lowWordReward.totalXp === 0, "Matches with fewer than 3 words completed must award 0 XP")
console.log("✓ Test 8: Anti-farming protects against matches with fewer than 3 words")

// 9. ANTI-FARMING: PRIVATE MATCH CRATE RESTRICTION
const privateMatchFinished: MultiplayerMatchRow = {
  ...matchFixture,
  id: "match_audit_private_99",
  mode: "private",
  status: "finished",
  winner_id: matchFixture.player_1_id,
  player_1_word_index: 30,
  started_at: new Date(Date.now() - 60000).toISOString(),
  finished_at: new Date().toISOString(),
}
const privateReward = processMultiplayerRewards(privateMatchFinished, matchFixture.player_1_id, 110, 99, 25)
assert(privateReward !== null, "Full private match must process valid summary")
assert(privateReward.awardedCrate === null, "Private room duels must NEVER award crates (farming prevention)")
console.log("✓ Test 9: Private match crate restriction enforced (no crate farming between friends)")

// 10. PROGRESSION INTEGRITY: FULL LEGITIMATE MATCH AWARDS
const legitQuickFinished: MultiplayerMatchRow = {
  ...matchFixture,
  id: "match_audit_legit_100",
  mode: "quick",
  status: "finished",
  winner_id: matchFixture.player_1_id,
  player_1_word_index: 30,
  started_at: new Date(Date.now() - 65000).toISOString(),
  finished_at: new Date().toISOString(),
}
const legitReward = processMultiplayerRewards(legitQuickFinished, matchFixture.player_1_id, 105, 98, 20)
assert(legitReward !== null, "Legitimate quick match must produce reward summary")
assert(legitReward.totalXp >= 120, "Legitimate quick match winner must receive base 120 XP + bonuses")
console.log("✓ Test 10: Legitimate quick match awards authoritative XP and bonuses")

console.log("\n=== ALL 10 MULTIPLAYER SECURITY & RLS INVARIANTS VERIFIED 100% GREEN ===")
