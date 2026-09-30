import { isTypingCharacterCorrect } from "../typing/typingAttempt"

export interface ArenaTypingState {
  typed: string[]
  correctChars: number
  totalChars: number
  errors: number
  weakKeys: { key: string; count: number }[]
  wordHadMistake: boolean
  completed: boolean
  combo: number
  maxCombo: number
  perfectWords: number
}

export function createArenaTypingState(): ArenaTypingState {
  return {
    typed: [], correctChars: 0, totalChars: 0, errors: 0, weakKeys: [],
    wordHadMistake: false, completed: false, combo: 0, maxCombo: 0, perfectWords: 0,
  }
}

export function nextArenaWord(state: ArenaTypingState): ArenaTypingState {
  return { ...state, typed: [], wordHadMistake: false, completed: false }
}

/** Every printable attempt consumes a position; Backspace only rewinds the cursor. */
export function applyArenaTypingKey(
  state: ArenaTypingState, word: string, key: string,
): ArenaTypingState {
  if (state.completed) return state
  const expected = Array.from(word)
  const index = state.typed.length
  if (key === "Backspace") {
    if (index === 0) return state
    const wasCorrect = isTypingCharacterCorrect(expected[index - 1], state.typed[index - 1])
    // Match useTypingEngine: remove undone correct credit, retain all attempts/errors.
    return {
      ...state, typed: state.typed.slice(0, -1),
      correctChars: state.correctChars - (wasCorrect ? 1 : 0),
    }
  }
  if (Array.from(key).length !== 1 || index >= expected.length) return state
  const correct = isTypingCharacterCorrect(expected[index], key)
  const missedKey = expected[index].toLowerCase()
  const completed = index + 1 === expected.length
  const comboBeforeCompletion = correct ? state.combo : 0
  // PvP combo counts completed words, while a missed character breaks it immediately.
  const combo = comboBeforeCompletion + (completed ? 1 : 0)
  const wordHadMistake = state.wordHadMistake || !correct
  return {
    ...state,
    typed: [...state.typed, key],
    correctChars: state.correctChars + (correct ? 1 : 0),
    totalChars: state.totalChars + 1,
    errors: state.errors + (correct ? 0 : 1),
    weakKeys: correct ? state.weakKeys : state.weakKeys.some((entry) => entry.key === missedKey)
      ? state.weakKeys.map((entry) => entry.key === missedKey ? { ...entry, count: entry.count + 1 } : entry)
      : [...state.weakKeys, { key: missedKey, count: 1 }],
    wordHadMistake,
    completed,
    combo,
    maxCombo: Math.max(state.maxCombo, combo),
    perfectWords: state.perfectWords + (completed && !wordHadMistake ? 1 : 0),
  }
}
