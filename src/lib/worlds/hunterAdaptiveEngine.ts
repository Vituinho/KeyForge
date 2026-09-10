/**
 * Hunter World (Solo Leveling) Adaptive Weakness Engine
 *
 * Automatically calculates weak-key frequency and provides adaptive text prioritization
 * to expose and train the player's real mechanical typing weaknesses.
 */

/**
 * Calculates the density score of target weak keys within a candidate sentence.
 * Higher density means the sentence offers richer practice for those specific keys.
 */
export function calculateWeakKeyDensity(sentence: string, weakKeys: string[]): number {
  if (!sentence || weakKeys.length === 0) return 0

  const normalizedText = sentence.toLowerCase()
  const targetSet = new Set(weakKeys.map((k) => k.toLowerCase()))
  let matchCount = 0

  for (const char of normalizedText) {
    if (targetSet.has(char)) {
      matchCount++
    }
  }

  return matchCount / normalizedText.length
}

/**
 * Prioritizes sentences from a pool based on the player's active weak keys,
 * ensuring high exposure to difficult keys while preserving sentence variety.
 */
export function prioritizeSentencesByWeakKeys(
  sentences: string[],
  weakKeys: string[]
): string[] {
  if (!sentences || sentences.length === 0 || weakKeys.length === 0) {
    return sentences
  }

  const scored = sentences.map((sentence, index) => ({
    sentence,
    index,
    density: calculateWeakKeyDensity(sentence, weakKeys),
  }))

  // Sort descending by density, keeping original relative index on ties
  scored.sort((a, b) => b.density - a.density || a.index - b.index)

  return scored.map((item) => item.sentence)
}

/**
 * Extracts the top N most frequent error keys from an error record.
 */
export function getTopWeakKeys(
  keyErrors: Record<string, number>,
  limit = 4
): string[] {
  return Object.entries(keyErrors)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key.toLowerCase())
}
