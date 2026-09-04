import { KeyError, KeyStat, WeakKey } from "@/types/typing"

/**
 * Analyze the error log and key stats to identify the player's weakest keys.
 *
 * Returns keys sorted by error rate descending, filtered to keys with at least
 * `minAttempts` attempts (to avoid noise from rarely-used keys).
 */
export function analyzeWeakKeys(
  keyStats: Record<string, KeyStat>,
  minAttempts = 3,
  topN = 5
): WeakKey[] {
  return Object.entries(keyStats)
    .filter(([, stat]) => stat.attempts >= minAttempts && stat.errors > 0)
    .map(([key, stat]) => ({
      key,
      attempts: stat.attempts,
      errors: stat.errors,
      errorRate: stat.errors / stat.attempts,
      averageResponseTime:
        stat.attempts > 0 ? stat.totalResponseTime / stat.attempts : 0,
    }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, topN)
}

/**
 * Get the worst single key from an error log.
 */
export function getWorstKey(
  keyStats: Record<string, KeyStat>,
  minAttempts = 3
): WeakKey | null {
  const weakKeys = analyzeWeakKeys(keyStats, minAttempts, 1)
  return weakKeys[0] ?? null
}

/**
 * Compute per-round summary stats from errorLog for a given text.
 */
export function computeRoundKeyStats(
  errorLog: KeyError[]
): Record<string, { errors: number }> {
  const result: Record<string, { errors: number }> = {}
  for (const err of errorLog) {
    if (!result[err.expected]) result[err.expected] = { errors: 0 }
    result[err.expected].errors++
  }
  return result
}
