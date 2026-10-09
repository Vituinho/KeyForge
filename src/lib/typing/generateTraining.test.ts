import test from "node:test"
import assert from "node:assert/strict"
import { generateTrainingExercises } from "./generateTraining"

test("weak-key fallback practices every actual accented or symbol target", () => {
  for (const key of ["á", "é", "ç", "7", ";", "?"]) {
    const [lesson] = generateTrainingExercises([{ key, attempts: 10, errors: 3, errorRate: 0.3, averageResponseTime: 150 }], 5, "pt-BR")
    assert.equal(lesson.targetKey, key)
    assert.equal(lesson.exercises.length, 5)
    assert.ok(lesson.exercises.every(text => text.includes(key)))
    assert.ok(lesson.description.includes(key.toUpperCase()))
  }
})

test("known weak-key drills retain their existing patterns", () => {
  const [lesson] = generateTrainingExercises([{ key: "r", attempts: 10, errors: 2, errorRate: 0.2, averageResponseTime: 150 }], 2)
  assert.deepEqual(lesson.exercises, ["rrr rrr rrr", "rat rat rat"])
})
