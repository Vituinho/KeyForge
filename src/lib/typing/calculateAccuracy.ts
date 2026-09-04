/**
 * Calculate accuracy as a percentage (0–100).
 *
 * @param correctCharacters  - characters typed correctly
 * @param totalTyped         - total characters pressed (correct + incorrect)
 */
export function calculateAccuracy(
  correctCharacters: number,
  totalTyped: number
): number {
  if (totalTyped === 0) return 100
  return Math.round((correctCharacters / totalTyped) * 100)
}
