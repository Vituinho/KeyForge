import assert from "node:assert/strict"
import { test } from "node:test"
import { arenaPlayerName, loadArenaUsernames } from "./arenaPlayerNames"

const match = { id: "online-match", player_1_id: "host-id", player_2_id: "guest-account-id" }
const hostFallback = "Host Shinobi"
const rivalFallback = "Rival Shinobi"

for (const viewer of [match.player_1_id, match.player_2_id]) {
  test(`${viewer === match.player_1_id ? "player 1" : "player 2"} client resolves both usernames from authenticated backend`, async context => {
    const requests: string[] = []
    context.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
      requests.push(url)
      assert.equal(init.credentials, "same-origin")
      assert.equal(init.cache, "no-store")
      assert.equal(init.method, "GET")
      assert.equal(init.body, undefined)
      const id = url.endsWith("host-id") ? match.player_1_id : match.player_2_id
      return Response.json({ id, username: id === match.player_1_id ? "RealHost" : "RealRival", level: 10, rank: "genin" })
    })
    const names = await loadArenaUsernames(match)
    assert.deepEqual(requests.sort(), ["/api/backend/players/guest-account-id", "/api/backend/players/host-id"])
    assert.deepEqual(names, { "host-id": "RealHost", "guest-account-id": "RealRival" })
    assert.equal(arenaPlayerName(match.player_1_id, names, hostFallback), "RealHost")
    assert.equal(arenaPlayerName(match.player_2_id, names, rivalFallback), "RealRival")
    const opponentId = viewer === match.player_1_id ? match.player_2_id : match.player_1_id
    assert.equal(arenaPlayerName(opponentId, names, rivalFallback), viewer === match.player_1_id ? "RealRival" : "RealHost")
  })
}

test("local bot matches preserve Shadow Shinobi names in either slot without backend requests", async context => {
  const fetch = context.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected request") })
  const names = await loadArenaUsernames({ ...match, id: "match_local", player_2_id: "shadow_silent_storm" })
  assert.deepEqual(names, {})
  assert.equal(fetch.mock.callCount(), 0)
  assert.equal(arenaPlayerName("shadow_silent_storm", names, rivalFallback), "Silent Storm")
  assert.equal(arenaPlayerName("shadow_silent_storm", names, hostFallback), "Silent Storm")
  assert.equal(arenaPlayerName("guest_player_1", names, "LocalPlayer"), "LocalPlayer")
})

test("online bot identities are not requested from the player endpoint", async context => {
  const fetch = context.mock.method(globalThis, "fetch", async () => Response.json({ id: "host-id", username: "RealHost" }))
  const names = await loadArenaUsernames({ ...match, player_2_id: "shadow_silent_storm" })
  assert.equal(fetch.mock.callCount(), 1)
  assert.deepEqual(names, { "host-id": "RealHost" })
  assert.equal(arenaPlayerName("shadow_silent_storm", names, rivalFallback), "Silent Storm")
})

test("failed or mismatched identities retain safe labels instead of client-provided names", async context => {
  context.mock.method(globalThis, "fetch", async (url: string) => url.endsWith("host-id")
    ? Response.json({ id: "another-account", username: "WrongPlayer" })
    : Response.json({ error: "Unavailable" }, { status: 503 }))
  const names = await loadArenaUsernames(match)
  assert.deepEqual(names, {})
  assert.equal(arenaPlayerName(match.player_1_id, names, hostFallback), hostFallback)
  assert.equal(arenaPlayerName(match.player_2_id, names, rivalFallback), rivalFallback)
  assert.equal(arenaPlayerName(null, names, rivalFallback), rivalFallback)
  assert.equal(arenaPlayerName("shadow_", names, rivalFallback), rivalFallback)
})

test("an unavailable participant does not discard the other player's verified username", async context => {
  context.mock.method(globalThis, "fetch", async (url: string) => {
    if (!url.endsWith("host-id")) throw new TypeError("Network unavailable")
    return Response.json({ id: "host-id", username: "RealHost" })
  })
  assert.deepEqual(await loadArenaUsernames(match), { "host-id": "RealHost" })
})
