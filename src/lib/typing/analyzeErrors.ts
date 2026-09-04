import { KeyError, KeyStat, WeakKey, WeakKeyCombination, WeakWord } from "@/types/typing"

/**
 * Analyze key statistics to identify the player's greatest typing weaknesses.
 *
 * Scoring Formula: Error Impact Score
 *   impactScore = errors * (errors / attempts)
 *
 * Why this formula?
 * - Avoids over-penalizing rare keys: 1 error in 1 attempt (100% error rate) gives impactScore = 1.0
 * - Properly highlights repeated struggles: 12 errors in 40 attempts (30% error rate) gives impactScore = 3.6
 * - Blends both error frequency and error concentration.
 *
 * Keys with fewer than `minAttempts` are filtered out unless no keys meet the threshold.
 */
export function analyzeWeakKeys(
  keyStats: Record<string, KeyStat>,
  minAttempts = 3,
  topN = 3
): WeakKey[] {
  const allKeys = Object.entries(keyStats)
    .filter(([, stat]) => stat.attempts > 0 && stat.errors > 0)
    .map(([key, stat]) => {
      const errorRate = stat.errors / stat.attempts
      const impactScore = stat.errors * errorRate
      const averageResponseTime =
        stat.attempts > 0 ? Math.round(stat.totalResponseTime / stat.attempts) : 0

      return {
        key,
        attempts: stat.attempts,
        errors: stat.errors,
        errorRate,
        averageResponseTime,
        impactScore,
      }
    })

  // Filter keys meeting the minimum attempts threshold to prevent noise
  const filtered = allKeys.filter((k) => k.attempts >= minAttempts)
  const candidatePool = filtered.length > 0 ? filtered : allKeys

  // Sort by impact score descending, breaking ties by error rate
  return candidatePool
    .sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0) || b.errorRate - a.errorRate)
    .slice(0, topN)
}

/**
 * Get the single worst key from key statistics.
 */
export function getWorstKey(
  keyStats: Record<string, KeyStat>,
  minAttempts = 3
): WeakKey | null {
  const weakKeys = analyzeWeakKeys(keyStats, minAttempts, 1)
  return weakKeys[0] ?? null
}

/**
 * ARCHITECTURE PREPARATION: Detect weak two-key transitions (bigrams).
 * Future expansion for boss adaptation (e.g. Mahoraga adapting to "th", "qu", "st").
 */
export function analyzeWeakKeyCombinations(
  errorLog: KeyError[],
  minOccurrences = 2
): WeakKeyCombination[] {
  const bigramMap: Record<string, { attempts: number; errors: number; totalTime: number }> = {}

  // Analyze sequential error patterns
  for (let i = 0; i < errorLog.length - 1; i++) {
    const curr = errorLog[i]
    const next = errorLog[i + 1]

    if (next.timestamp - curr.timestamp < 1500) {
      const bigram = `${curr.expected}${next.expected}`
      if (!bigramMap[bigram]) {
        bigramMap[bigram] = { attempts: 0, errors: 0, totalTime: 0 }
      }
      bigramMap[bigram].attempts += 1
      bigramMap[bigram].errors += 1
      bigramMap[bigram].totalTime += next.responseTime
    }
  }

  return Object.entries(bigramMap)
    .filter(([, stat]) => stat.errors >= minOccurrences)
    .map(([bigram, stat]) => ({
      bigram,
      attempts: stat.attempts,
      errors: stat.errors,
      errorRate: stat.errors / stat.attempts,
      averageResponseTime: Math.round(stat.totalTime / stat.attempts),
    }))
    .sort((a, b) => b.errors - a.errors)
}

/**
 * ARCHITECTURE PREPARATION: Detect words with high error frequency.
 * Future expansion for personalized vocabulary training.
 */
export function analyzeWeakWords(
  errorLog: KeyError[],
  battleTexts: string[]
): WeakWord[] {
  const wordErrorCount: Record<string, number> = {}

  // Map errors back to source words
  for (const err of errorLog) {
    for (const text of battleTexts) {
      const words = text.split(" ")
      let charCount = 0
      for (const word of words) {
        if (err.position >= charCount && err.position <= charCount + word.length) {
          wordErrorCount[word.toLowerCase()] = (wordErrorCount[word.toLowerCase()] ?? 0) + 1
          break
        }
        charCount += word.length + 1
      }
    }
  }

  return Object.entries(wordErrorCount)
    .map(([word, errors]) => ({
      word,
      attempts: errors,
      errors,
      errorRate: 1.0,
    }))
    .sort((a, b) => b.errors - a.errors)
}
