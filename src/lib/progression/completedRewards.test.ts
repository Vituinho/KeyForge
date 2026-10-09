import assert from "node:assert/strict"
import { test } from "node:test"
import { oncePerCompletion } from "./completedRewards"

test("the same completion cannot award XP, crates or statistics twice", () => {
  const result = {}; let grants = 0
  const award = () => ({ grants: ++grants })
  assert.strictEqual(oncePerCompletion(result, award), oncePerCompletion(result, award))
  assert.equal(grants, 1)
  oncePerCompletion({}, award); assert.equal(grants, 2)
})
test("a failed commit can be retried and does not poison the completion cache", () => {
  const result = {}
  assert.throws(() => oncePerCompletion(result, () => { throw new Error("Storage") }))
  assert.equal(oncePerCompletion(result, () => "saved"), "saved")
})
