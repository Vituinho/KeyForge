import assert from "node:assert/strict"
import { test } from "node:test"
import { generateKeyExercises, getPracticeFinger } from "./keyExercises"
import { learnableKeys, LEARNING_STAGES } from "./keyMastery"
import { getFingerForKey } from "../keyboard/fingerMap"

for (const layout of ["ABNT2", "ANSI"] as const) {
  test(`${layout}: every key has six deterministic nonempty drills with target evidence`, () => {
    for (const key of learnableKeys(layout)) {
      const exercises = generateKeyExercises(key, layout)
      assert.ok(getPracticeFinger(key, layout), `${key}: has finger guidance`)
      assert.equal(exercises.length, 6)
      assert.deepEqual(exercises.map((exercise) => exercise.kind), [...LEARNING_STAGES])
      assert.deepEqual(exercises, generateKeyExercises(key, layout))
      for (const [stage, exercise] of exercises.entries()) {
        assert.equal(exercise.targetKey, key)
        assert.equal(exercise.stage, stage)
        assert.ok(exercise.text.length < 700, `${key}: bounded drill length`)
        assert.ok(Array.from(exercise.text).filter((char) => char === key).length >= 4, `${key}: enough target evidence`)
      }
    }
  })
}
test("R progresses from repetitions and F anchor through real words and sentences", () => {
  const exercises = generateKeyExercises("R", "ABNT2")
  assert.match(exercises[0].text, /rrrr rrrr/)
  assert.match(exercises[1].text, /fr rf/)
  assert.match(exercises[2].text, /er re/)
  assert.match(exercises[2].text, /tr rt/)
  assert.match(exercises[3].text, /ra re ri ro ru/)
  assert.match(exercises[4].text, /rato|terra|correr/)
  assert.match(exercises[5].text, /o rato corre/)
})
test("finger and home-row anchors follow the existing layout mapping", () => {
  const pt = generateKeyExercises("p", "ABNT2")
  const en = generateKeyExercises("p", "ANSI")
  assert.match(pt[1].text, /çp pç/)
  assert.match(en[1].text, /;p p;/)
  assert.equal(getFingerForKey("p", "ABNT2")?.finger, getFingerForKey("ç", "ABNT2")?.finger)
  assert.match(generateKeyExercises("w", "ANSI")[1].text, /sw ws/)
})
test("English and Portuguese words and sentences use their respective language", () => {
  assert.match(generateKeyExercises("r", "ANSI")[5].text, /river|write|brown|world/)
  assert.match(generateKeyExercises("ç", "ABNT2")[4].text, /aço|força|maçã|ação/)
  assert.throws(() => generateKeyExercises("ç", "ANSI"), /Unsupported/)
  assert.throws(() => generateKeyExercises("Enter", "ABNT2"), /Unsupported/)
})
