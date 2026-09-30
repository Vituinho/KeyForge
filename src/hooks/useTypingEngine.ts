"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CharData, CharState, KeyError, KeyStat, TypingStats } from "@/types/typing"
import { calculateWpm, calculateRawWpm } from "@/lib/typing/calculateWpm"
import { calculateAccuracy } from "@/lib/typing/calculateAccuracy"
import { isTypingCharacterCorrect } from "@/lib/typing/typingAttempt"

interface UseTypingEngineProps {
  text: string
  textId?: string
  enabled?: boolean
  onComplete?: (stats: TypingStats) => void
}

interface UseTypingEngineReturn {
  chars: CharData[]
  stats: TypingStats
  inputRef: React.RefObject<HTMLInputElement | null>
  reset: (newText?: string, keepCumulative?: boolean) => void
  resetAll: (newText?: string) => void
  nextRound: (newText: string, newTextId?: string) => void
  focus: () => void

  // Real-time keyboard reaction telemetry
  expectedKey: string | null
  pressedKey: string | null
  lastErrorKey: string | null
}

// Special non-printable keys that should be completely ignored (never counted as errors)
const IGNORED_KEYS = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "Tab",
  "Escape",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
  "Insert",
  "Delete",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
  "NumLock",
  "ScrollLock",
  "Pause",
  "ContextMenu",
  "AltGraph",
  "Dead",
  "Unidentified",
  "AudioVolumeMute",
  "AudioVolumeDown",
  "AudioVolumeUp",
  "MediaTrackNext",
  "MediaTrackPrevious",
  "MediaStop",
  "MediaPlayPause",
])

// Maximum response time per key in ms to avoid skewing stats on long pauses or round start
const MAX_VALID_RESPONSE_TIME_MS = 2000

function buildChars(text: string): CharData[] {
  // Use Array.from to properly handle Unicode code points
  return Array.from(text).map((char, i) => ({
    char,
    state: (i === 0 ? "current" : "untyped") as CharState,
  }))
}

function buildInitialStats(): TypingStats {
  return {
    currentWpm: 0,
    currentRawWpm: 0,
    currentAccuracy: 100,
    currentErrors: 0,
    currentStreak: 0,
    battleWpm: 0,
    battleAccuracy: 100,
    bestWpm: 0,
    totalTypingAttempts: 0,
    totalErrors: 0,
    combo: 0,
    bestCombo: 0,
    bestStreak: 0,
    typedCharacters: 0,
    correctCharacters: 0,
    incorrectCharacters: 0,
    totalCorrectCharacters: 0,
    totalIncorrectCharacters: 0,
    elapsedTime: 0,
    totalElapsedTime: 0,
    keyStats: {},
    errorLog: [],
    isCompleted: false,
    currentIndex: 0,
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    errors: 0,
  }
}

export function useTypingEngine({
  text,
  textId,
  enabled = true,
  onComplete,
}: UseTypingEngineProps): UseTypingEngineReturn {
  const [chars, setChars] = useState<CharData[]>(() => buildChars(text))
  const [stats, setStats] = useState<TypingStats>(buildInitialStats)

  // Keyboard reaction telemetry state
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [lastErrorKey, setLastErrorKey] = useState<string | null>(null)
  const pressedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Current active text & text identifier
  const textRef = useRef(text)
  const textIdRef = useRef<string | undefined>(textId)

  // Round-specific timing & index
  const roundStartTimeRef = useRef<number | null>(null)
  const lastKeyTimeRef = useRef<number | null>(null)
  const currentIndexRef = useRef(0)
  const roundErrorsRef = useRef(0)
  const roundCorrectRef = useRef(0)
  const roundIncorrectRef = useRef(0)
  const currentStreakRef = useRef(0)
  const isCompletedRef = useRef(false)

  // Cumulative / Battle-wide metrics
  const accumulatedTimeRef = useRef(0) // total active seconds from finished rounds
  const totalCorrectRef = useRef(0)
  const totalIncorrectRef = useRef(0)
  const totalAttemptsRef = useRef(0)
  const totalErrorsRef = useRef(0)
  const comboRef = useRef(0)
  const bestComboRef = useRef(0)
  const bestStreakRef = useRef(0)
  const bestWpmRef = useRef(0)
  const keyStatsRef = useRef<Record<string, KeyStat>>({})
  const errorLogRef = useRef<KeyError[]>([])

  // Engine references
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Synchronize incoming text / textId refs
  useEffect(() => {
    textRef.current = text
  }, [text])

  useEffect(() => {
    textIdRef.current = textId
  }, [textId])

  // Helper to compile current snapshot of stats safely without NaN / Infinity
  const compileStatsSnapshot = useCallback(
    (isRoundCompleted = false): TypingStats => {
      const now = Date.now()
      const roundElapsed = roundStartTimeRef.current
        ? Math.max(0, (now - roundStartTimeRef.current) / 1000)
        : 0
      const totalElapsed = accumulatedTimeRef.current + roundElapsed

      // Current round calculations
      const roundTyped = roundCorrectRef.current + roundIncorrectRef.current
      const currentWpm = calculateWpm(roundCorrectRef.current, roundElapsed)
      const currentRawWpm = calculateRawWpm(roundTyped, roundElapsed)
      const currentAccuracy = calculateAccuracy(roundCorrectRef.current, roundTyped)

      // Battle cumulative calculations
      const battleWpm = calculateWpm(totalCorrectRef.current, totalElapsed)
      const battleAccuracy = calculateAccuracy(totalCorrectRef.current, totalAttemptsRef.current)

      const roundCompleted = isRoundCompleted || isCompletedRef.current

      return {
        currentWpm,
        currentRawWpm,
        currentAccuracy,
        currentErrors: roundErrorsRef.current,
        currentStreak: currentStreakRef.current,
        battleWpm,
        battleAccuracy,
        bestWpm: bestWpmRef.current,
        totalTypingAttempts: totalAttemptsRef.current,
        totalErrors: totalErrorsRef.current,
        combo: comboRef.current,
        bestCombo: bestComboRef.current,
        bestStreak: bestStreakRef.current,
        typedCharacters: roundTyped,
        correctCharacters: roundCorrectRef.current,
        incorrectCharacters: roundIncorrectRef.current,
        totalCorrectCharacters: totalCorrectRef.current,
        totalIncorrectCharacters: totalIncorrectRef.current,
        elapsedTime: roundElapsed,
        totalElapsedTime: totalElapsed,
        keyStats: { ...keyStatsRef.current },
        errorLog: [...errorLogRef.current],
        isCompleted: roundCompleted,
        currentIndex: currentIndexRef.current,
        // Backward-compatibility aliases
        wpm: currentWpm,
        rawWpm: currentRawWpm,
        accuracy: currentAccuracy,
        errors: roundErrorsRef.current,
      }
    },
    []
  )

  // Interval timer for live WPM update
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      if (!roundStartTimeRef.current || isCompletedRef.current) return
      setStats(compileStatsSnapshot())
    }, 200)
  }, [compileStatsSnapshot])

  // Update per-key statistics
  const recordKeyStat = useCallback(
    (key: string, isCorrect: boolean, responseTime: number) => {
      const normalizedKey = key.toLowerCase()
      const existing = keyStatsRef.current[normalizedKey] ?? {
        attempts: 0,
        correct: 0,
        errors: 0,
        totalResponseTime: 0,
      }
      keyStatsRef.current[normalizedKey] = {
        attempts: existing.attempts + 1,
        correct: existing.correct + (isCorrect ? 1 : 0),
        errors: existing.errors + (isCorrect ? 0 : 1),
        totalResponseTime: existing.totalResponseTime + responseTime,
      }
    },
    []
  )

  // Handle Backspace without erasing historical errors
  const handleBackspace = useCallback(() => {
    if (!enabled || isCompletedRef.current) return
    const idx = currentIndexRef.current
    if (idx <= 0) return

    const prevIdx = idx - 1
    const newChars = [...chars]

    // If un-typing a correct char, decrement current round correct count
    if (newChars[prevIdx].state === "correct") {
      roundCorrectRef.current = Math.max(0, roundCorrectRef.current - 1)
      totalCorrectRef.current = Math.max(0, totalCorrectRef.current - 1)
    }

    // Historical errors, keyStats, and errorLog are deliberately preserved!
    // Cursor steps back to prevIdx
    if (idx < newChars.length) {
      newChars[idx] = { ...newChars[idx], state: "untyped" }
    }
    newChars[prevIdx] = { ...newChars[prevIdx], state: "current" }

    currentIndexRef.current = prevIdx
    lastKeyTimeRef.current = Date.now()

    setChars(newChars)
    setStats(compileStatsSnapshot())
  }, [chars, enabled, compileStatsSnapshot])

  // Process standard keypress
  const handleKeyPress = useCallback(
    (key: string, e?: KeyboardEvent) => {
      if (!enabled || isCompletedRef.current) return

      // Ignore modifier shortcuts (Ctrl+C, Ctrl+R, Meta, etc.)
      if (e && (e.ctrlKey || e.metaKey)) return

      // Handle Backspace
      if (key === "Backspace") {
        setPressedKey("Backspace")
        if (pressedTimerRef.current) clearTimeout(pressedTimerRef.current)
        pressedTimerRef.current = setTimeout(() => setPressedKey(null), 150)
        handleBackspace()
        return
      }

      // Ignore non-printable and special navigation keys
      if (IGNORED_KEYS.has(key) || key.length !== 1) {
        return
      }

      setPressedKey(key)
      if (pressedTimerRef.current) clearTimeout(pressedTimerRef.current)
      pressedTimerRef.current = setTimeout(() => setPressedKey(null), 150)

      const now = Date.now()

      // Calculate response time, avoiding distortion from pauses or round start
      let responseTime = 0
      if (lastKeyTimeRef.current !== null) {
        const delta = now - lastKeyTimeRef.current
        responseTime = Math.min(Math.max(0, delta), MAX_VALID_RESPONSE_TIME_MS)
      }
      lastKeyTimeRef.current = now

      // Start round timer on first active keystroke
      if (!roundStartTimeRef.current) {
        roundStartTimeRef.current = now
        startTimer()
      }

      const idx = currentIndexRef.current
      if (idx >= chars.length) return

      const expectedChar = chars[idx].char
      // Robust Unicode normalization comparison for PT-BR accents (á, à, ã, â, é, ê, í, ó, ô, õ, ú, ç)
      const isCorrect = isTypingCharacterCorrect(expectedChar, key)

      // Increment total attempts
      totalAttemptsRef.current++
      recordKeyStat(expectedChar, isCorrect, responseTime)

      if (isCorrect) {
        setLastErrorKey(null)
        roundCorrectRef.current++
        totalCorrectRef.current++
        comboRef.current++
        currentStreakRef.current++

        if (comboRef.current > bestComboRef.current) {
          bestComboRef.current = comboRef.current
        }
        if (currentStreakRef.current > bestStreakRef.current) {
          bestStreakRef.current = currentStreakRef.current
        }
      } else {
        setLastErrorKey(expectedChar)
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
        errorTimerRef.current = setTimeout(() => setLastErrorKey(null), 400)

        roundIncorrectRef.current++
        roundErrorsRef.current++
        totalIncorrectRef.current++
        totalErrorsRef.current++

        errorLogRef.current.push({
          expected: expectedChar,
          typed: key,
          position: idx,
          timestamp: now,
          responseTime,
          comboBeforeError: comboRef.current,
          textId: textIdRef.current,
        })

        comboRef.current = 0
        currentStreakRef.current = 0
      }

      // Update character states
      const newChars = [...chars]
      newChars[idx] = {
        char: expectedChar,
        state: isCorrect ? "correct" : "incorrect",
      }

      const nextIdx = idx + 1
      if (nextIdx < newChars.length) {
        newChars[nextIdx] = { ...newChars[nextIdx], state: "current" }
      }
      currentIndexRef.current = nextIdx

      const isCompleted = nextIdx >= chars.length
      setChars(newChars)

      if (isCompleted) {
        isCompletedRef.current = true
        stopTimer()

        if (roundStartTimeRef.current) {
          accumulatedTimeRef.current += Math.max(0, (now - roundStartTimeRef.current) / 1000)
        }

        const snapshot = compileStatsSnapshot(true)
        if (snapshot.currentWpm > bestWpmRef.current) {
          bestWpmRef.current = snapshot.currentWpm
        }

        const finalStats: TypingStats = {
          ...snapshot,
          bestWpm: bestWpmRef.current,
          isCompleted: true,
        }

        setStats(finalStats)
        onComplete?.(finalStats)
      } else {
        setStats(compileStatsSnapshot())
      }
    },
    [
      chars,
      compileStatsSnapshot,
      enabled,
      handleBackspace,
      onComplete,
      recordKeyStat,
      startTimer,
      stopTimer,
    ]
  )

  // Global window keyboard listener to ensure typing works immediately and clicks don't break input
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not hijack typing if focused on an editable element (input, textarea, select, contenteditable)
      const target = e.target as HTMLElement | null
      if (target && target !== inputRef.current) {
        const tagName = target.tagName?.toUpperCase()
        const isEditable =
          tagName === "INPUT" ||
          tagName === "TEXTAREA" ||
          tagName === "SELECT" ||
          target.isContentEditable ||
          target.getAttribute("contenteditable") === "true" ||
          target.getAttribute("contenteditable") === ""

        if (isEditable) {
          return
        }

        if (tagName === "BUTTON" && (e.key === "Enter" || e.key === " ")) {
          return
        }
      }

      // Prevent Space scrolling the page or Backspace navigating back
      if (e.key === " " || e.key === "Backspace") {
        e.preventDefault()
      }

      handleKeyPress(e.key, e)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [enabled, handleKeyPress])

  // Reset engine: keepCumulative=true preserves battle/session history, false resets everything
  const reset = useCallback(
    (newText?: string, keepCumulative = true) => {
      stopTimer()
      roundStartTimeRef.current = null
      lastKeyTimeRef.current = null
      currentIndexRef.current = 0
      roundErrorsRef.current = 0
      roundCorrectRef.current = 0
      roundIncorrectRef.current = 0
      currentStreakRef.current = 0
      isCompletedRef.current = false

      if (!keepCumulative) {
        accumulatedTimeRef.current = 0
        totalCorrectRef.current = 0
        totalIncorrectRef.current = 0
        totalAttemptsRef.current = 0
        totalErrorsRef.current = 0
        comboRef.current = 0
        bestComboRef.current = 0
        bestStreakRef.current = 0
        bestWpmRef.current = 0
        keyStatsRef.current = {}
        errorLogRef.current = []
      }

      setPressedKey(null)
      setLastErrorKey(null)
      if (pressedTimerRef.current) clearTimeout(pressedTimerRef.current)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)

      const targetText = newText ?? textRef.current
      textRef.current = targetText
      setChars(buildChars(targetText))
      setStats(compileStatsSnapshot())
    },
    [compileStatsSnapshot, stopTimer]
  )

  // Full reset for clean new game/session
  const resetAll = useCallback(
    (newText?: string) => {
      reset(newText, false)
    },
    [reset]
  )

  // Convenience helper for next round
  const nextRound = useCallback(
    (newText: string, newTextId?: string) => {
      textIdRef.current = newTextId
      reset(newText, true)
    },
    [reset]
  )

  // Programmatic focus
  const focus = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      if (pressedTimerRef.current) clearTimeout(pressedTimerRef.current)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [stopTimer])

  // Current expected character to type
  const expectedKey = chars.find((c) => c.state === "current")?.char ?? null

  return {
    chars,
    stats,
    inputRef,
    reset,
    resetAll,
    nextRound,
    focus,
    expectedKey,
    pressedKey,
    lastErrorKey,
  }
}
