import { WeakKey, TrainingExercise } from "@/types/typing"

// Base exercises for common problem patterns
const LETTER_EXERCISES: Record<string, string[]> = {
  a: ["aaa aaa aaa", "asa asa asa", "ata ata ata", "ara ara ara", "radar radar", "banana banana", "atacar atacar"],
  s: ["sss sss sss", "asa asa asa", "sus sus sus", "safe safe safe", "lass lass lass", "class class class"],
  d: ["ddd ddd ddd", "dad dad dad", "did did did", "add add add", "deed deed deed", "draft draft draft"],
  f: ["fff fff fff", "fad fad fad", "fig fig fig", "fun fun fun", "fast fast fast", "flag flag flag"],
  g: ["ggg ggg ggg", "gag gag gag", "get get get", "gap gap gap", "glad glad glad", "grabs grabs grabs"],
  h: ["hhh hhh hhh", "had had had", "hit hit hit", "has has has", "high high high", "habit habit habit"],
  j: ["jjj jjj jjj", "jam jam jam", "jet jet jet", "just just just", "jump jump jump", "joker joker joker"],
  k: ["kkk kkk kkk", "kid kid kid", "key key key", "ask ask ask", "work work work", "knock knock knock"],
  l: ["lll lll lll", "lap lap lap", "led led led", "all all all", "pull pull pull", "skill skill skill"],
  e: ["eee eee eee", "eel eel eel", "eve eve eve", "feel feel feel", "fleet fleet fleet", "eleven eleven eleven"],
  r: ["rrr rrr rrr", "rat rat rat", "run run run", "far far far", "rare rare rare", "river river river"],
  t: ["ttt ttt ttt", "tab tab tab", "top top top", "bat bat bat", "that that that", "static static static"],
  y: ["yyy yyy yyy", "yak yak yak", "yet yet yet", "day day day", "today today today", "yearly yearly yearly"],
  u: ["uuu uuu uuu", "fun fun fun", "run run run", "sun sun sun", "usual usual usual", "future future future"],
  i: ["iii iii iii", "ink ink ink", "hit hit hit", "fit fit fit", "spirit spirit spirit", "insist insist insist"],
  o: ["ooo ooo ooo", "old old old", "hot hot hot", "too too too", "color color color", "follow follow follow"],
  p: ["ppp ppp ppp", "pad pad pad", "pan pan pan", "apt apt apt", "paper paper paper", "proper proper proper"],
  q: ["qqq qqq qqq", "quick quick quick", "quite quite quite", "queen queen queen"],
  w: ["www www www", "was was was", "win win win", "raw raw raw", "power power power", "window window window"],
  x: ["xxx xxx xxx", "fox fox fox", "tax tax tax", "expect expect expect", "excess excess excess"],
  z: ["zzz zzz zzz", "zip zip zip", "zap zap zap", "fizz fizz fizz", "puzzle puzzle puzzle"],
  c: ["ccc ccc ccc", "cap cap cap", "cut cut cut", "act act act", "claim claim claim", "circle circle circle"],
  v: ["vvv vvv vvv", "van van van", "vow vow vow", "live live live", "value value value", "diverse diverse diverse"],
  b: ["bbb bbb bbb", "bat bat bat", "bit bit bit", "lab lab lab", "blind blind blind", "absorb absorb absorb"],
  n: ["nnn nnn nnn", "nap nap nap", "net net net", "inn inn inn", "inner inner inner", "connect connect connect"],
  m: ["mmm mmm mmm", "mad mad mad", "man man man", "aim aim aim", "month month month", "mammoth mammoth mammoth"],
}

const DEFAULT_EXERCISES = [
  "the the the the",
  "and and and and",
  "for for for for",
  "are are are are",
  "but but but but",
]

/**
 * Generate training exercises for a single list of weak keys.
 */
export function generateTrainingExercises(
  weakKeys: WeakKey[],
  exercisesPerKey = 5
): TrainingExercise[] {
  return weakKeys.map((wk) => {
    const key = wk.key.toLowerCase()
    const exercises = LETTER_EXERCISES[key] ?? DEFAULT_EXERCISES
    return {
      targetKey: wk.key,
      exercises: exercises.slice(0, exercisesPerKey),
      description: buildDescription(wk),
    }
  })
}

/**
 * Generates a cohesive multi-line training session combining multiple weak keys.
 * Used by Training Mode (Weak Keys).
 *
 * Example with keys ["a", "r", "t"]:
 *   1. "aaa rrr ttt"
 *   2. "ara ata rat"
 *   3. "art tar rar"
 *   4. "radar atacar tratar"
 *   5. "arrastar carta prata"
 */
export function generateWeakKeysSession(keys: string[]): string[] {
  const cleanKeys = Array.from(
    new Set(keys.map((k) => k.toLowerCase().trim()).filter((k) => k.length === 1))
  )

  if (cleanKeys.length === 0) {
    return [
      "the quick brown fox jumps over the lazy dog",
      "focus on accuracy and fluid finger movement",
      "rhythm and precision build true typing speed",
    ]
  }

  const session: string[] = []

  // 1. Isolated triples of target keys
  const isolated = cleanKeys.map((k) => `${k}${k}${k}`).join(" ")
  session.push(`${isolated} ${isolated}`)

  // 2. Cross combinations if multiple keys
  if (cleanKeys.length >= 2) {
    const combos: string[] = []
    for (let i = 0; i < cleanKeys.length; i++) {
      for (let j = 0; j < cleanKeys.length; j++) {
        if (i !== j) {
          combos.push(`${cleanKeys[i]}${cleanKeys[j]}${cleanKeys[i]}`)
        }
      }
    }
    session.push(combos.slice(0, 6).join(" "))
  }

  // 3. Word patterns from dictionary containing target keys
  const wordsForKeys: string[] = []
  for (const k of cleanKeys) {
    const list = LETTER_EXERCISES[k] ?? []
    for (const ex of list) {
      const parts = ex.split(" ")
      for (const p of parts) {
        if (p.length >= 3 && !wordsForKeys.includes(p)) {
          wordsForKeys.push(p)
        }
      }
    }
  }

  if (wordsForKeys.length >= 3) {
    session.push(wordsForKeys.slice(0, 4).join(" "))
    if (wordsForKeys.length >= 7) {
      session.push(wordsForKeys.slice(4, 8).join(" "))
    }
  }

  // Fallback if session has too few exercises
  while (session.length < 3) {
    session.push(cleanKeys.map((k) => `${k} ${k}${k} ${k}${k}${k}`).join(" "))
  }

  return session.slice(0, 5)
}

function buildDescription(wk: WeakKey): string {
  const rate = Math.round(wk.errorRate * 100)
  if (rate >= 50) {
    return `You struggled significantly with the letter "${wk.key.toUpperCase()}" (${rate}% error rate). Focus on controlled, deliberate presses.`
  } else if (rate >= 25) {
    return `The letter "${wk.key.toUpperCase()}" caused noticeable trouble (${rate}% error rate). Practice the following exercises.`
  }
  return `Minor weakness detected on "${wk.key.toUpperCase()}" (${rate}% error rate). A bit of practice will sharpen your accuracy.`
}
