import assert from "node:assert/strict"
import { test } from "node:test"
import { safeReturnPath } from "./safeReturnPath"

test("login destinations preserve internal query strings and reject external/obfuscated URLs", () => {
  assert.equal(safeReturnPath("/training?keys=r,t#practice"), "/training?keys=r,t#practice")
  for (const path of [null, "https://example.invalid", "//example.invalid", "/\\example.invalid", "/%5cexample.invalid", "/%2fexample.invalid", "javascript:alert(1)", "/%", "/\n/evil"]) assert.equal(safeReturnPath(path), "/game")
})
