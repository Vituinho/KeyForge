import assert from "node:assert/strict"
import { test } from "node:test"
import { readFileSync } from "node:fs"
import { SOUNDTRACK_DISCOVERY, SPOTIFY_REFERENCES, filterSoundtracks, isSpotifyReferenceUrl } from "./soundtrackDiscovery"
import { BATTLE_MUSIC } from "./battleMusic"

test("all 56 discovery entries preserve verified references independently of battle audio", () => {
  assert.equal(SOUNDTRACK_DISCOVERY.length, 56)
  assert.equal(new Set(SOUNDTRACK_DISCOVERY.map(entry => entry.enemyId)).size, 56)
  assert.equal(Object.keys(SPOTIFY_REFERENCES).length, 39)
  for (const entry of SOUNDTRACK_DISCOVERY) {
    assert.ok(BATTLE_MUSIC[entry.enemyId].file.startsWith("/audio/bgm/original/"))
    if (!entry.spotify) continue
    assert.equal(entry.kind, "official-reference")
    assert.ok(entry.spotify.title && entry.spotify.artists && entry.spotify.album)
    assert.ok(isSpotifyReferenceUrl(entry.spotify.url))
    assert.ok(isSpotifyReferenceUrl(entry.spotify.albumUrl))
    assert.ok(entry.spotify.evidenceUrl.startsWith("https://open.spotify.com/embed/album/"))
    assert.equal(entry.spotify.verifiedAt, "2026-10-19")
  }
  assert.equal(SPOTIFY_REFERENCES.pain.url, "https://open.spotify.com/track/6MBB1w8rl9XEGqrfWcBq4I")
  assert.equal(SPOTIFY_REFERENCES.itachi.url, "https://open.spotify.com/track/2VWDk6GcnMaysTpVQH121M")
})

test("search and combined filters retain meaningful linked, unresolved and original states", () => {
  assert.equal(filterSoundtracks("girei", "", "all")[0].enemyId, "pain")
  assert.equal(filterSoundtracks("sEnYa", "Naruto Shippuden", "linked")[0].enemyId, "itachi")
  assert.equal(filterSoundtracks("naruto", "One Piece", "all").length, 0)
  assert.equal(filterSoundtracks("", "", "linked").length, 39)
  assert.equal(filterSoundtracks("", "", "original").length, 8)
  assert.equal(filterSoundtracks("", "", "pending").length, 9)
  assert.equal(filterSoundtracks("  ", "", "all").length, 56)
})

test("Spotify references reject embeds, search URLs, invented schemes and lookalike domains", () => {
  for (const url of ["javascript:alert(1)", "spotify:track:abc", "https://open.spotify.com.evil.test/track/6MBB1w8rl9XEGqrfWcBq4I", "https://open.spotify.com/embed/track/6MBB1w8rl9XEGqrfWcBq4I", "https://open.spotify.com/search/Pain", "https://open.spotify.com/track/not-an-id"]) assert.equal(isSpotifyReferenceUrl(url), false)
  const page = readFileSync("src/app/soundtracks/page.tsx", "utf8")
  assert.ok(page.includes('target="_blank" rel="noopener noreferrer"'))
  assert.equal(/<iframe|<audio|new Audio|musicManager|useBattleMusic|api\.spotify|sdk\.scdn/.test(page), false)
})
