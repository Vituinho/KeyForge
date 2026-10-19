/** Loopback-only rendered discovery regression checks; never calls Spotify or a live backend. */
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.KEYFORGE_PLAYWRIGHT_MODULE || "playwright")
require("tsx/cjs")
const { en } = require("../src/locales/en.ts"), { ptBR } = require("../src/locales/pt-BR.ts")
const port = Number(process.env.KEYFORGE_UI_PORT || 3141)
assert.ok(Number.isInteger(port) && port > 0 && port <= 65535)
const base = `http://127.0.0.1:${port}`
const output = mkdtempSync(join(tmpdir(), "keyforge-discovery-"))
const browser = await chromium.launch({ headless: true, ...(process.env.KEYFORGE_BROWSER_EXECUTABLE
  ? { executablePath: process.env.KEYFORGE_BROWSER_EXECUTABLE } : { channel: "msedge" }) })
const results = []
try {
  for (const locale of ["en", "pt-BR"]) for (const [width, height] of [[360, 800], [768, 1024], [1280, 900], [1440, 1000]]) {
    const context = await browser.newContext({ viewport: { width, height }, locale, reducedMotion: "reduce" })
    context.setDefaultTimeout(15000)
    const external = [], errors = []
    let simulateExternalWindow = false
    await context.route("**/*", route => {
      const url = new URL(route.request().url())
      if (url.origin !== base) {
        external.push(url.origin)
        // Browser navigation is exercised with a local fixture, never a request to Spotify.
        if (simulateExternalWindow && url.origin === "https://open.spotify.com") return route.fulfill({ status: 200, contentType: "text/html", body: "<title>External navigation fixture</title>" })
        return route.abort()
      }
      if (url.pathname.startsWith("/api/")) return route.fulfill({ status: url.pathname.endsWith("get-session") ? 200 : 503,
        contentType: "application/json", body: "null" })
      return route.continue()
    })
    await context.addInitScript(locale => localStorage.setItem("keyforge_language", locale), locale)
    const page = await context.newPage()
    page.on("pageerror", error => errors.push(error.message))
    const labels = locale === "en" ? en.soundtracks : ptBR.soundtracks
    await page.goto(`${base}/soundtracks`, { waitUntil: "networkidle" })
    await page.getByRole("heading", { name: labels.title, exact: true }).waitFor()
    assert.equal(await page.locator("article").count(), 56)
    assert.equal(await page.locator('article a[target="_blank"]').count(), 39)
    assert.equal(await page.locator('main a[href^="https://open.spotify.com/playlist/"]').count(), 1)
    assert.equal(await page.locator("audio,iframe").count(), 0)
    const geometry = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll("main *, .kf-app-header *")].filter(element => {
        const rect = element.getBoundingClientRect(), css = getComputedStyle(element)
        return rect.width && (rect.right > innerWidth + 2 || rect.left < -2) && css.visibility !== "hidden"
      }).slice(0, 5).map(element => element.textContent?.slice(0, 80)),
      overlaps: [...document.querySelectorAll(".kf-app-header nav a")].filter(element => {
        const rect = element.getBoundingClientRect()
        return element.checkVisibility() && rect.width && document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest("a") !== element
      }).map(element => element.textContent),
    }))
    assert.ok(geometry.document <= width + 2, JSON.stringify(geometry))
    assert.deepEqual(geometry.overflow, [], JSON.stringify(geometry))
    assert.deepEqual(geometry.overlaps, [], JSON.stringify(geometry))
    await page.screenshot({ path: join(output, `${locale}-${width}.png`) })
    await page.getByLabel(labels.search, { exact: true }).fill("Girei")
    assert.equal(await page.locator("article").count(), 1)
    const pain = page.locator('article[data-encounter="pain"] a')
    assert.equal(await pain.getAttribute("href"), "https://open.spotify.com/track/6MBB1w8rl9XEGqrfWcBq4I")
    assert.equal(await pain.getAttribute("target"), "_blank")
    assert.equal(await pain.getAttribute("rel"), "noopener noreferrer")
    await pain.focus()
    assert.equal(await pain.evaluate(element => element === document.activeElement), true)
    await page.getByLabel(labels.search, { exact: true }).fill("Senya")
    assert.equal(await page.locator('article[data-encounter="itachi"]').count(), 1)
    await page.getByLabel(labels.search, { exact: true }).fill("")
    await page.getByLabel(labels.anime, { exact: true }).selectOption("Dragon Ball")
    assert.equal(await page.locator("article").count(), 8)
    assert.equal(await page.locator('article a[target="_blank"]').count(), 0)
    await page.getByRole("button", { name: labels.filter_linked, exact: true }).click()
    await page.getByRole("heading", { name: labels.empty }).waitFor()
    await page.getByRole("button", { name: labels.reset, exact: true }).click()
    assert.equal(await page.locator("article").count(), 56)
    await page.getByRole("button", { name: labels.filter_original, exact: true }).click()
    assert.equal(await page.locator("article").count(), 8)
    assert.equal(await page.getByText(labels.noAnimeTrack, { exact: true }).count(), 8)
    assert.deepEqual(external, [], "Discovery must not request Spotify or any external resource")
    assert.deepEqual(errors, [])
    console.log(`${locale} ${width}: layout and filters passed; checking external navigation`)
    simulateExternalWindow = true
    await page.getByRole("checkbox", { name: labels.separateWindow }).check()
    const playlist = page.locator('main a[href^="https://open.spotify.com/playlist/"]')
    const popupPromise = context.waitForEvent("page")
    await playlist.click()
    const popup = await popupPromise
    popup.setDefaultTimeout(15000)
    await popup.waitForURL("https://open.spotify.com/playlist/7wkGN40FnYhlmKNMNMc5Ng")
    assert.equal(await popup.evaluate(() => window.opener), null)
    await popup.close()
    // Simulate popup blocking: the ordinary target=_blank anchor must still navigate.
    await page.evaluate(() => { window.open = () => null })
    const fallbackPromise = context.waitForEvent("page")
    await playlist.click()
    const fallback = await fallbackPromise
    fallback.setDefaultTimeout(15000)
    await fallback.waitForURL("https://open.spotify.com/playlist/7wkGN40FnYhlmKNMNMc5Ng")
    assert.equal(await fallback.evaluate(() => window.opener), null)
    await fallback.close()
    results.push({ locale, width, encounters: 56, verifiedLinks: 39, externalRequests: 0 })
    await context.close()
    console.log(`${locale} ${width}: discovery, filters, focus, geometry and media isolation passed`)
  }
} finally { await browser.close() }
writeFileSync(join(output, "results.json"), JSON.stringify(results, null, 2))
console.log(JSON.stringify({ checks: results.length, output }, null, 2))
