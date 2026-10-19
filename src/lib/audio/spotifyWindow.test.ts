import assert from "node:assert/strict"
import { test } from "node:test"
import { openSpotifyWindow } from "./spotifyWindow"
import { SPOTIFY_PLAYLIST } from "./soundtrackDiscovery"

test("separate Spotify window severs opener before navigation for verified links", () => {
  for (const url of [SPOTIFY_PLAYLIST.url, "https://open.spotify.com/track/6MBB1w8rl9XEGqrfWcBq4I"]) {
    const popup = { opener: {}, location: { replace: (destination: string) => {
      assert.equal(popup.opener, null)
      assert.equal(destination, url)
    } } }
    const browser = { open: (target?: string | URL, name?: string, features?: string) => {
      assert.equal(target, "about:blank")
      assert.equal(name, "_blank")
      assert.ok(features?.includes("popup"))
      return popup as unknown as Window
    } }
    assert.equal(openSpotifyWindow(url, browser), true)
  }
})

test("blocked or denied Spotify windows leave ordinary link fallback available", () => {
  assert.equal(openSpotifyWindow(SPOTIFY_PLAYLIST.url, { open: () => null }), false)
  assert.equal(openSpotifyWindow(SPOTIFY_PLAYLIST.url, { open: () => { throw new Error("Denied") } }), false)
  let closed = false
  const popup = { set opener(_value: unknown) { throw new Error("Denied") }, close: () => { closed = true } }
  assert.equal(openSpotifyWindow(SPOTIFY_PLAYLIST.url, { open: () => popup as unknown as Window }), false)
  assert.equal(closed, true)
  assert.equal(openSpotifyWindow("https://evil.test", { open: () => { throw new Error("Must not open") } }), false)
})
