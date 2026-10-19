/** Real Chromium media decoding and visitor playback against a loopback Next server. */
import assert from "node:assert/strict"
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.KEYFORGE_PLAYWRIGHT_MODULE || "playwright")
require("tsx/cjs")
const { BATTLE_MUSIC } = require("../src/lib/audio/battleMusic.ts")
const { createDefaultPlayerProfile } = require("../src/types/player.ts")
const port = Number(process.env.KEYFORGE_UI_PORT || 3137)
assert.ok(Number.isInteger(port) && port > 0 && port <= 65535)
const origin = `http://127.0.0.1:${port}`
const browser = await chromium.launch({ headless: true, channel: "msedge", args: ["--autoplay-policy=document-user-activation-required"] })
try {
  const context = await browser.newContext()
  await context.route("**/*", route => {
    const url = new URL(route.request().url())
    if (url.origin !== origin) return route.abort()
    if (url.pathname.startsWith("/api/backend/")) return route.fulfill({ status: url.pathname.endsWith("get-session") ? 200 : 503,
      contentType: "application/json", body: url.pathname.endsWith("get-session") ? "null" : '{"error":"Isolated visitor audio test"}' })
    return route.continue()
  })
  await context.addInitScript(profile => {
    localStorage.setItem("keyforge_language", "en")
    localStorage.setItem("keyforge_player_v3", JSON.stringify({ version: 3, player: { ...profile, onboardingCompleted: true } }))
    const NativeAudio = window.Audio
    window.__battleAudios = []
    window.Audio = function (...args) {
      const audio = new NativeAudio(...args)
      window.__battleAudios.push(audio)
      return audio
    }
    window.Audio.prototype = NativeAudio.prototype
  }, createDefaultPlayerProfile())
  const page = await context.newPage()
  await page.goto(origin + "/battle", { waitUntil: "networkidle" })
  const decoded = await page.evaluate(async tracks => {
    const decoder = new OfflineAudioContext(1, 1, 22050)
    const results = []
    for (const track of tracks) {
      const response = await fetch(track.file)
      if (!response.ok) throw new Error(`Missing recording: ${track.enemyId}`)
      const buffer = await decoder.decodeAudioData(await response.arrayBuffer())
      const values = buffer.getChannelData(0)
      let energy = 0
      for (let index = 0; index < values.length; index++) energy += values[index] ** 2
      if (buffer.duration < 10 || energy / values.length < .0001) throw new Error(`Invalid decoded recording: ${track.enemyId}`)
      results.push({ id: track.enemyId, seconds: buffer.duration, contentType: response.headers.get("content-type") })
    }
    return results
  }, Object.values(BATTLE_MUSIC))
  assert.equal(decoded.length, 56)
  assert.ok(decoded.every(track => /audio\/(wav|wave|x-wav)/.test(track.contentType)))
  console.log("56 default recordings: HTTP 200, audio MIME, browser decode, duration and audible PCM energy verified")
  for (const id of ["naruto", "yuji", "krillin", "usopp", "dungeon_guardian", "zenitsu", "cipher_initiate"]) {
    await page.goto(`${origin}/battle?enemy=${id}`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: "START BATTLE", exact: true }).click()
    await page.waitForFunction(file => window.__battleAudios.some(audio => audio.getAttribute("src") === file && !audio.paused && audio.currentTime > .1), BATTLE_MUSIC[id].file)
    assert.equal(await page.evaluate(() => window.__battleAudios.filter(audio => !audio.paused).length), 1)
    assert.equal(await page.evaluate(() => window.__battleAudios.find(audio => !audio.paused).loop), true)
    if (id === "naruto") {
      await page.waitForTimeout((decoded.find(track => track.id === id).seconds + .3) * 1000)
      assert.equal(await page.evaluate(() => window.__battleAudios.find(audio => !audio.paused)?.ended), false)
    }
    await page.locator('a[href^="/anime-world/"]').first().click()
    await page.waitForFunction(() => window.__battleAudios.every(audio => audio.paused && !audio.getAttribute("src")))
    console.log(`${id}: starts after visitor click without file selection; loops; single active track; SPA exit cleans up`)
  }
  await context.close()
} finally { await browser.close() }
