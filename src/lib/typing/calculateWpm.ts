/**
 * Calculate Words Per Minute.
 *
 * Standard definition: 1 word = 5 characters (including spaces).
 * This is the same method used by Monkeytype and TypeRacer.
 *
 * @param correctCharacters - number of correctly typed characters
 * @param elapsedSeconds    - time elapsed in seconds
 */
export function calculateWpm(
  correctCharacters: number,
  elapsedSeconds: number
): number {
  if (elapsedSeconds <= 0) return 0
  const words = correctCharacters / 5
  const minutes = elapsedSeconds / 60
  return Math.round(words / minutes)
}

/**
 * Calculate raw WPM (includes errors — shows raw speed).
 */
export function calculateRawWpm(
  totalTypedCharacters: number,
  elapsedSeconds: number
): number {
  if (elapsedSeconds <= 0) return 0
  const words = totalTypedCharacters / 5
  const minutes = elapsedSeconds / 60
  return Math.round(words / minutes)
}
