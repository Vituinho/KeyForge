import type { TypingStats } from "@/types/typing"

export interface PracticeRun { date: string; speed: number; accuracy: number; attempts: number; errors: number; seconds: number }
export const practiceHistoryKey = (player: string, layout: string) => `keyforge_practice_v1:${player}:${layout}`
export function loadPracticeHistory(player: string, layout: string): PracticeRun[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(practiceHistoryKey(player, layout)) ?? "[]")
    return Array.isArray(data) ? data.filter((run): run is PracticeRun => !!run && typeof run.date === "string"
      && [run.speed, run.accuracy, run.attempts, run.errors, run.seconds].every(value => typeof value === "number" && Number.isFinite(value) && value >= 0)
      && run.accuracy <= 100 && run.errors <= run.attempts).slice(-60) : []
  } catch { return [] }
}
export function savePracticeRun(player: string, layout: string, stats: TypingStats): void {
  if (!stats.totalTypingAttempts) return
  const history = loadPracticeHistory(player, layout)
  const run: PracticeRun = { date: new Date().toISOString(), speed: stats.battleWpm, accuracy: stats.battleAccuracy,
    attempts: stats.totalTypingAttempts, errors: stats.totalErrors, seconds: stats.totalElapsedTime }
  try { localStorage.setItem(practiceHistoryKey(player, layout), JSON.stringify([...history, run].slice(-60))) } catch { /* Gameplay still works without storage. */ }
}
