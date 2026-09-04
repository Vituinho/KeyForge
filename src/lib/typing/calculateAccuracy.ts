/**
 * Calculate accuracy as a percentage (0–100).
 *
 * Formula: (correctCharacters / totalTyped) * 100
 *
 * Guaranteed to never return NaN or Infinity.
 *
 * @param correctCharacters  - characters typed correctly
 * @param totalTyped         - total characters pressed (correct + incorrect attempts)
 */
export function calculateAccuracy(
  correctCharacters: number,
  totalTyped: number
): number {
  if (totalTyped <= 0 || !Number.isFinite(totalTyped)) return 100
  if (correctCharacters <= 0 || !Number.isFinite(correctCharacters)) return 0
  const acc = Math.round((correctCharacters / totalTyped) * 100)
  if (!Number.isFinite(acc) || Number.isNaN(acc)) return 100
  return Math.min(100, Math.max(0, acc))
}
