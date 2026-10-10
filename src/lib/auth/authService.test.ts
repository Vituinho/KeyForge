import assert from "node:assert/strict"
import { test } from "node:test"

// This worker deliberately tests the unconfigured/offline branch, without network requests.
const service = import("./authService")
const cosmetics = import("../../hooks/useCosmetics")

test("offline login cannot manufacture an authenticated account", async () => {
  const { loginWithCredentials } = await service
  await assert.rejects(loginWithCredentials({ email: "test@example.invalid", password: "password123" }), /AUTH_UNAVAILABLE/)
})
test("offline registration cannot manufacture an authenticated account", async () => {
  const { registerWithCredentials } = await service
  await assert.rejects(registerWithCredentials({ username: "TestPlayer", email: "test@example.invalid", password: "password123" }), /AUTH_UNAVAILABLE/)
})
test("cosmetics hydration snapshot is referentially stable", async () => {
  const { getServerCosmeticsSnapshot } = await cosmetics
  assert.strictEqual(getServerCosmeticsSnapshot(), getServerCosmeticsSnapshot())
})

test("player hydration snapshot is referentially stable", async () => {
  const { getServerSnapshot } = await import("../../hooks/usePlayer")
  assert.strictEqual(getServerSnapshot(), getServerSnapshot())
})
