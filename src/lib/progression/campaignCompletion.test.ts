import test from "node:test"
import assert from "node:assert/strict"
import { hasClearedEveryStage } from "./processBattleRewards"

test("a direct boss victory cannot claim completion of unplayed stages", () => {
  assert.equal(hasClearedEveryStage([1, 8], [1, 2, 3, 4, 5, 6, 7, 8]), false)
  assert.equal(hasClearedEveryStage([8, 8, 8], [1, 2, 3, 4, 5, 6, 7, 8]), false)
})

test("completion follows actual stage coverage even when victories arrive out of order", () => {
  assert.equal(hasClearedEveryStage([8, 1, 2, 3, 4, 5, 6, 7], [1, 2, 3, 4, 5, 6, 7, 8]), true)
  assert.equal(hasClearedEveryStage([2, 4, 6], [2, 4, 6]), true)
  assert.equal(hasClearedEveryStage([], []), false)
})
