import assert from "node:assert/strict"
import { test } from "node:test"
import { applyArenaTypingKey, createArenaTypingState, nextArenaWord } from "./arenaTyping"
import { calculateAccuracy } from "../typing/calculateAccuracy"
import { isTypingCharacterCorrect } from "../typing/typingAttempt"

function type(word: string, keys: string[], state = createArenaTypingState()) {
  return keys.reduce((current, key) => applyArenaTypingKey(current, word, key), state)
}

test("single substitution completes the word and records the expected weak key", () => {
  const state = type("computer", Array.from("comouter"))
  assert.equal(state.completed, true)
  assert.equal(state.correctChars, 7)
  assert.equal(state.totalChars, 8)
  assert.equal(state.errors, 1)
  assert.deepEqual(state.weakKeys, [{ key: "p", count: 1 }])
  assert.equal(state.perfectWords, 0)
  assert.equal(calculateAccuracy(state.correctChars, state.totalChars), 88)
})

test("correct characters immediately after an error count independently", () => {
  let state = type("computer", Array.from("como"))
  assert.equal(state.correctChars, 3)
  assert.equal(state.errors, 1)
  for (const key of "uter") {
    const previousCorrect: number = state.correctChars
    state = applyArenaTypingKey(state, "computer", key)
    assert.equal(state.correctChars, previousCorrect + 1)
    assert.equal(state.errors, 1)
  }
  assert.equal(state.completed, true)
  assert.equal(isTypingCharacterCorrect("é", "e\u0301"), true)
})

test("multiple independent errors do not cascade", () => {
  const state = type("computer", Array.from("xomoutxr"))
  assert.equal(state.correctChars, 5)
  assert.equal(state.errors, 3)
  assert.equal(state.completed, true)
  assert.deepEqual(state.weakKeys, [
    { key: "c", count: 1 }, { key: "p", count: 1 }, { key: "e", count: 1 },
  ])
})

test("Backspace preserves historical mistakes, attempts and imperfect-word status", () => {
  const mistaken = type("cat", ["c", "x"])
  const rewound = applyArenaTypingKey(mistaken, "cat", "Backspace")
  assert.deepEqual(rewound.typed, ["c"])
  assert.equal(rewound.errors, mistaken.errors)
  assert.equal(rewound.totalChars, mistaken.totalChars)
  assert.deepEqual(rewound.weakKeys, mistaken.weakKeys)
  const completed = type("cat", ["a", "t"], rewound)
  assert.equal(completed.completed, true)
  assert.equal(completed.correctChars, 3)
  assert.equal(completed.totalChars, 4)
  assert.equal(calculateAccuracy(completed.correctChars, completed.totalChars), 75)
  assert.equal(completed.perfectWords, 0)
})

test("Backspace on a correct position removes credit without deleting history", () => {
  const state = type("cat", ["c", "a", "Backspace", "a", "t"])
  assert.equal(state.correctChars, 3)
  assert.equal(state.totalChars, 4)
  assert.equal(state.errors, 0)
  assert.equal(calculateAccuracy(state.correctChars, state.totalChars), 75)
})

test("accuracy and PvP word combo use the current attempt, resetting on error", () => {
  let state = type("cat", Array.from("cat"))
  state = type("cat", Array.from("cat"), nextArenaWord(state))
  assert.equal(state.combo, 2)
  assert.equal(state.maxCombo, 2)
  assert.equal(state.perfectWords, 2)
  state = applyArenaTypingKey(nextArenaWord(state), "cat", "x")
  assert.equal(state.combo, 0)
  state = type("cat", ["a", "t"], state)
  assert.equal(state.combo, 1)
  assert.equal(state.maxCombo, 2)
  assert.equal(state.perfectWords, 2)
  assert.equal(state.correctChars, 8)
  assert.equal(state.totalChars, 9)
  assert.equal(calculateAccuracy(state.correctChars, state.totalChars), 89)
})

test("a final-position typo completes once and ignores input while awaiting the server", () => {
  const state = type("cat", Array.from("cax"))
  assert.equal(state.completed, true)
  assert.equal(state.errors, 1)
  assert.equal(applyArenaTypingKey(state, "cat", "t"), state)
  assert.equal(applyArenaTypingKey(state, "cat", "Backspace"), state)
})

test("ignored keys and empty Backspace do not create attempts; accents use NFC", () => {
  const initial = createArenaTypingState()
  for (const key of ["Backspace", "Shift", "Enter", "ArrowLeft"]) {
    assert.equal(applyArenaTypingKey(initial, "é", key), initial)
  }
  const state = applyArenaTypingKey(initial, "é", "é")
  assert.equal(state.correctChars, 1)
  assert.equal(state.completed, true)
})
