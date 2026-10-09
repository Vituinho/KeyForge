export function practiceSecondsRemaining(start: number | null, duration: number, now: number): number | null {
  if (duration <= 0) return null
  if (start === null) return duration
  return Math.max(0, Math.ceil((start + duration * 1000 - now) / 1000))
}
import type { TypingStats } from "@/types/typing"
import { calculateWpm, calculateRawWpm } from "./calculateWpm"


export function finishPractice(stats: TypingStats, seconds: number): TypingStats {
  const wpm = calculateWpm(stats.totalCorrectCharacters, seconds)
  const rawWpm = calculateRawWpm(stats.totalTypingAttempts, seconds)
  return { ...stats, totalElapsedTime: seconds, battleWpm: wpm, wpm, rawWpm, isCompleted: true }
}
