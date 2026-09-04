"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CharData, CharState, KeyError, KeyStat, TypingStats } from "@/types/typing"
import { calculateWpm, calculateRawWpm } from "@/lib/typing/calculateWpm"
import { calculateAccuracy } from "@/lib/typing/calculateAccuracy"

interface UseTypingEngineProps {
  text: string
  enabled?: boolean
  onComplete?: (stats: TypingStats) => void
}

interface UseTypingEngineReturn {
  chars: CharData[]
  stats: TypingStats
  inputRef: React.RefObject<HTMLInputElement | null>
  reset: (newText?: string) => void
  focus: () => void
}

function buildInitialStats(): TypingStats {
  return {
    wpm: 0,
    rawWpm: 0,
    accuracy: 100,
    combo: 0,
    bestCombo: 0,
    errors: 0,
    typedCharacters: 0,
    correctCharacters: 0,
    incorrectCharacters: 0,
    elapsedTime: 0,
    currentStreak: 0,
    bestStreak: 0,
    keyStats: {},
    errorLog: [],
    isCompleted: false,
    currentIndex: 0,
  }
}

function buildChars(text: string): CharData[] {
  return text.split("").map((char, i) => ({
    char,
    state: (i === 0 ? "current" : "untyped") as CharState,
  }))
}

export function useTypingEngine({
  text,
  enabled = true,
  onComplete,
}: UseTypingEngineProps): UseTypingEngineReturn {
  const [chars, setChars] = useState<CharData[]>(() => buildChars(text))
  const [stats, setStats] = useState<TypingStats>(buildInitialStats)

  // Refs for mutable state that doesn't need to trigger re-renders on every keystroke
  const startTimeRef = useRef<number | null>(null)
  const lastKeyTimeRef = useRef<number | null>(null)
  const currentIndexRef = useRef(0)
  const comboRef = useRef(0)
  const bestComboRef = useRef(0)
  const streakRef = useRef(0)
  const bestStreakRef = useRef(0)
  const errorsRef = useRef(0)
  const correctRef = useRef(0)
  const incorrectRef = useRef(0)
  const keyStatsRef = useRef<Record<string, KeyStat>>({})
  const errorLogRef = useRef<KeyError[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isCompletedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Update WPM/elapsed on a tick
  const startTimer = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      if (!startTimeRef.current) return
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const wpm = calculateWpm(correctRef.current, elapsed)
      const rawWpm = calculateRawWpm(correctRef.current + incorrectRef.current, elapsed)
      const accuracy = calculateAccuracy(correctRef.current, correctRef.current + incorrectRef.current)
      setStats((prev) => ({
        ...prev,
        wpm,
        rawWpm,
        accuracy,
        elapsedTime: elapsed,
      }))
    }, 300)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const updateKeyStat = useCallback((key: string, correct: boolean, responseTime: number) => {
    const existing = keyStatsRef.current[key] ?? {
      attempts: 0,
      correct: 0,
      errors: 0,
      totalResponseTime: 0,
    }
    keyStatsRef.current[key] = {
      attempts: existing.attempts + 1,
      correct: existing.correct + (correct ? 1 : 0),
      errors: existing.errors + (correct ? 0 : 1),
      totalResponseTime: existing.totalResponseTime + responseTime,
    }
  }, [])

  const handleKeyPress = useCallback(
    (key: string) => {
      if (!enabled || isCompletedRef.current) return
      if (key.length !== 1) return // ignore modifier keys etc.

      const now = Date.now()
      const responseTime = lastKeyTimeRef.current ? now - lastKeyTimeRef.current : 0
      lastKeyTimeRef.current = now

      // Start timer on first keypress
      if (!startTimeRef.current) {
        startTimeRef.current = now
        startTimer()
      }

      const idx = currentIndexRef.current
      if (idx >= chars.length) return

      const expectedChar = chars[idx].char
      const isCorrect = key === expectedChar

      // Update key stats
      updateKeyStat(expectedChar, isCorrect, responseTime)

      if (isCorrect) {
        correctRef.current++
        comboRef.current++
        streakRef.current++
        if (comboRef.current > bestComboRef.current) bestComboRef.current = comboRef.current
        if (streakRef.current > bestStreakRef.current) bestStreakRef.current = streakRef.current
      } else {
        incorrectRef.current++
        errorsRef.current++
        // Log error
        errorLogRef.current.push({
          expected: expectedChar,
          typed: key,
          position: idx,
          timestamp: now,
          responseTime,
          comboBeforeError: comboRef.current,
        })
        comboRef.current = 0
        streakRef.current = 0
      }

      // Update chars array
      const newChars = [...chars]
      newChars[idx] = {
        char: expectedChar,
        state: isCorrect ? "correct" : "incorrect",
      }
      // Mark next char as current
      const nextIdx = idx + 1
      if (nextIdx < newChars.length) {
        newChars[nextIdx] = { ...newChars[nextIdx], state: "current" }
      }
      currentIndexRef.current = nextIdx

      const elapsed = startTimeRef.current
        ? (now - startTimeRef.current) / 1000
        : 0
      const wpm = calculateWpm(correctRef.current, elapsed)
      const rawWpm = calculateRawWpm(correctRef.current + incorrectRef.current, elapsed)
      const accuracy = calculateAccuracy(correctRef.current, correctRef.current + incorrectRef.current)

      const isCompleted = nextIdx >= chars.length

      setChars(newChars)
      setStats({
        wpm,
        rawWpm,
        accuracy,
        combo: comboRef.current,
        bestCombo: bestComboRef.current,
        errors: errorsRef.current,
        typedCharacters: correctRef.current + incorrectRef.current,
        correctCharacters: correctRef.current,
        incorrectCharacters: incorrectRef.current,
        elapsedTime: elapsed,
        currentStreak: streakRef.current,
        bestStreak: bestStreakRef.current,
        keyStats: { ...keyStatsRef.current },
        errorLog: [...errorLogRef.current],
        isCompleted,
        currentIndex: nextIdx,
      })

      if (isCompleted) {
        isCompletedRef.current = true
        stopTimer()
        onComplete?.({
          wpm,
          rawWpm,
          accuracy,
          combo: comboRef.current,
          bestCombo: bestComboRef.current,
          errors: errorsRef.current,
          typedCharacters: correctRef.current + incorrectRef.current,
          correctCharacters: correctRef.current,
          incorrectCharacters: incorrectRef.current,
          elapsedTime: elapsed,
          currentStreak: streakRef.current,
          bestStreak: bestStreakRef.current,
          keyStats: { ...keyStatsRef.current },
          errorLog: [...errorLogRef.current],
          isCompleted: true,
          currentIndex: nextIdx,
        })
      }
    },
    [chars, enabled, onComplete, startTimer, stopTimer, updateKeyStat]
  )


  // Keyboard listener
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      handleKeyPress(e.key)
    }
    el.addEventListener("keydown", handler)
    return () => el.removeEventListener("keydown", handler)
  }, [handleKeyPress])

  const reset = useCallback(
    (newText?: string) => {
      stopTimer()
      startTimeRef.current = null
      lastKeyTimeRef.current = null
      currentIndexRef.current = 0
      comboRef.current = 0
      bestComboRef.current = 0
      streakRef.current = 0
      bestStreakRef.current = 0
      errorsRef.current = 0
      correctRef.current = 0
      incorrectRef.current = 0
      keyStatsRef.current = {}
      errorLogRef.current = []
      isCompletedRef.current = false

      const target = newText ?? text
      setChars(buildChars(target))
      setStats(buildInitialStats())
    },
    [text, stopTimer]
  )

  const focus = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  return { chars, stats, inputRef, reset, focus }
}
