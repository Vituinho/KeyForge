/**
 * Calculate Words Per Minute.
 *
 * Standard definition: 1 word = 5 characters (including spaces).
 * This is the same method used by Monkeytype and TypeRacer.
 *
 * Guaranteed to never return NaN or Infinity.
 *
 * @param correctCharacters - number of correctly typed characters
 * @param elapsedSeconds    - time elapsed in seconds
 */
export function calculateWpm(
  correctCharacters: number,
  elapsedSeconds: number
): number {
  if (elapsedSeconds <= 0 || !Number.isFinite(elapsedSeconds)) return 0
  if (correctCharacters <= 0 || !Number.isFinite(correctCharacters)) return 0
  const words = correctCharacters / 5
  const minutes = elapsedSeconds / 60
  const wpm = Math.round(words / minutes)
  if (!Number.isFinite(wpm) || Number.isNaN(wpm)) return 0
  return Math.max(0, wpm)
}

/**
 * Calculate raw WPM (includes errors — shows raw speed).
 *
 * Guaranteed to never return NaN or Infinity.
 */
export function calculateRawWpm(
  totalTypedCharacters: number,
  elapsedSeconds: number
): number {
  if (elapsedSeconds <= 0 || !Number.isFinite(elapsedSeconds)) return 0
  if (totalTypedCharacters <= 0 || !Number.isFinite(totalTypedCharacters)) return 0
  const words = totalTypedCharacters / 5
  const minutes = elapsedSeconds / 60
  const wpm = Math.round(words / minutes)
  if (!Number.isFinite(wpm) || Number.isNaN(wpm)) return 0
  return Math.max(0, wpm)
}
