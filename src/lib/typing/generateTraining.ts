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

function buildDescription(wk: WeakKey): string {
  const rate = Math.round(wk.errorRate * 100)
  if (rate >= 50) {
    return `You struggled significantly with the letter "${wk.key.toUpperCase()}" (${rate}% error rate). Focus on controlled, deliberate presses.`
  } else if (rate >= 25) {
    return `The letter "${wk.key.toUpperCase()}" caused noticeable trouble (${rate}% error rate). Practice the following exercises.`
  }
  return `Minor weakness detected on "${wk.key.toUpperCase()}" (${rate}% error rate). A bit of practice will sharpen your accuracy.`
}
