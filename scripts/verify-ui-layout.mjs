/** Optional real-browser regression sweep. Uses an existing Playwright installation. */
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.KEYFORGE_PLAYWRIGHT_MODULE || "playwright")
require("tsx/cjs")
const { createDefaultPlayerProfile } = require("../src/types/player.ts")
const { createDefaultCosmeticsState } = require("../src/types/cosmetics.ts")
const { createMatch } = require("../src/lib/multiplayer/matchService.ts")
const { en } = require("../src/locales/en.ts"), { ptBR } = require("../src/locales/pt-BR.ts")
const port = Number(process.env.KEYFORGE_UI_PORT || 3137)
assert.ok(Number.isInteger(port) && port > 0 && port <= 65535)
const base = `http://127.0.0.1:${port}`
const output = mkdtempSync(join(tmpdir(), "keyforge-ui-"))
const routes = [
  ["landing", "/"], ["login", "/login"], ["register", "/register"], ["dashboard", "/game"],
  ["academy", "/academy"], ["training", "/training"], ["worlds", "/anime-world"],
  ...["naruto", "jujutsu", "dragon", "pirate", "hunter", "demon", "nexus"].map(world => [world, `/anime-world/${world}`]),
  ["battle", "/battle"], ["profile", "/profile"], ["statistics", "/statistics"],
  ["locker", "/locker"], ["crates", "/locker/crates"], ["multiplayer-guest", "/multiplayer"],
]
const sizes = [["mobile", 360, 800], ["tablet", 768, 1024], ["desktop", 1440, 1000]]
const browser = await chromium.launch({ headless: true, ...(process.env.KEYFORGE_BROWSER_EXECUTABLE
  ? { executablePath: process.env.KEYFORGE_BROWSER_EXECUTABLE } : { channel: "msedge" }) })
const results = []
try {
  for (const locale of ["en", "pt-BR"]) for (const [size, width, height] of sizes) {
    const context = await browser.newContext({ viewport: { width, height }, locale, reducedMotion: "reduce" })
    let online = false, arenaResult = false, roomWaiting = false
    const identity = { id: "ui-test-player", name: "Jogador_Teste_012345", email: "ui@example.test", createdAt: "2026-01-01T00:00:00Z" }
    const profile = { ...createDefaultPlayerProfile(), id: identity.id, username: identity.name, onboardingCompleted: true }
    const match = { ...await createMatch({ localPractice: true, mode: "private", roomCode: "KF-TEST", guestPlayerId: identity.id, language: locale }),
      id: "ui-fixture-match", player_2_id: "ui-test-rival", player_1_ready: true, player_2_ready: true,
      status: "playing", started_at: new Date().toISOString() }
    const messages = locale === "pt-BR" ? ptBR : en
    // All online states below are UI fixtures. No real auth, rewards, DB or external service is exercised.
    await context.route("**/*", route => {
      const url = new URL(route.request().url())
      if (url.origin !== base) return route.abort()
      if (url.pathname.startsWith("/api/backend/")) {
        const path = url.pathname.slice("/api/backend/".length)
        let body, status = 200
        if (path === "auth/get-session") body = online ? { user: identity } : null
        else if (!online) { status = 503; body = { error: "Offline UI test" } }
        else if (path === "player") body = profile
        else if (path === "inventory") body = { ...createDefaultCosmeticsState(), ownerId: identity.id }
        else if (path.startsWith("players/")) { const id = path.slice(8); body = { id, username: id === identity.id ? identity.name : "Adversario_0123456789", level: 1, rank: "E" } }
        else if (path === "queue") body = { status: "searching" }
        else if (path === "matches") body = { ...match, status: "waiting", player_1_ready: false, player_2_ready: false }
        else if (path.startsWith("matches/") && !path.endsWith("/result")) body = roomWaiting
          ? { ...match, status: "waiting", player_1_ready: false, player_2_ready: false } : arenaResult
            ? { ...match, status: "finished", winner_id: identity.id, player_2_hp: 0, finished_at: new Date().toISOString() } : match
        else { status = 503; body = { error: "Offline UI test" } }
        return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })
      }
      return route.continue()
    })
    await context.addInitScript(({ locale, profile }) => {
      localStorage.setItem("keyforge_language", locale)
      const fixture = { version: 3, player: { ...profile, onboardingCompleted: !location.search.includes("ui-onboarding") } }
      localStorage.setItem("keyforge_player_v3", JSON.stringify(fixture))
      localStorage.setItem(`keyforge_player_v3:account:${profile.id}`, JSON.stringify(fixture))
    }, { locale, profile })
    const page = await context.newPage()
    const inspectPage = async (name, path, interact) => {
      if (process.argv.includes("--crates-only") && !["crate-dialog", "crate-reward"].includes(name)) return
      await page.goto(base + path, { waitUntil: "networkidle" })
      if (interact) await interact(page)
      // Reveal while-in-view content before examining full-page geometry.
      if (!interact) {
        for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += height * .8) {
          await page.evaluate(y => scrollTo(0, y), y)
          await page.waitForTimeout(35)
        }
        await page.evaluate(() => scrollTo(0, 0))
      }
      await page.waitForTimeout(700)
      await page.evaluate(() => scrollTo(0, 0))
      const result = await page.evaluate(() => {
        const width = innerWidth
        return {
          width, documentWidth: document.documentElement.scrollWidth,
          missingKeys: [...new Set(document.body.innerText.match(/\b(?:game|common|auth|academy|battle|results|nav|locker|multiplayerArena|animeWorld|release)\.[A-Za-z]\w+(?:\.\w+)*/g) || [])],
          overflow: [...document.querySelectorAll("body *")].filter(element => {
            const rect = element.getBoundingClientRect(), css = getComputedStyle(element)
            let parent = element.parentElement
            while (parent && parent !== document.body) {
              if (parent.classList.contains("overflow-x-auto")) return false
              parent = parent.parentElement
            }
            return rect.width && (rect.right > width + 2 || rect.left < -2) && css.position !== "absolute" && css.position !== "fixed" && css.visibility !== "hidden"
          }).slice(0, 8).map(element => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 70), className: String(element.className).slice(0, 140) })),
          unnamedButtons: [...document.querySelectorAll("button")].filter(button => button.getBoundingClientRect().width && !button.textContent?.trim() && !button.getAttribute("aria-label") && !button.title).length,
        }
      })
      results.push({ locale, size, route: name, ...result })
      writeFileSync(join(output, "results.json"), JSON.stringify(results, null, 2))
      if (process.argv.includes("--capture") && ["landing", "dashboard", "academy", "battle", "locker", "multiplayer-guest", "battle-active", "academy-training", "private-room", "pvp-arena", "pvp-result", "keyboard-settings", "onboarding", "crate-dialog", "crate-reward"].includes(name)) {
        await page.screenshot({ path: join(output, `${locale}-${size}-${name}.png`), fullPage: true })
        await page.screenshot({ path: join(output, `${locale}-${size}-${name}-top.png`) })
      }
    }
    for (const [name, path] of routes) await inspectPage(name, path)
    await inspectPage("onboarding", "/game?ui-onboarding")
    const openCrateDialog = async page => {
      await page.getByRole("button", { name: messages.lockerModule.workshop.openCrateCount.replace("{count}", "1"), exact: true }).first().click()
      await page.getByRole("dialog").waitFor()
    }
    await inspectPage("crate-dialog", "/locker/crates", openCrateDialog)
    await inspectPage("crate-reward", "/locker/crates", async page => {
      await openCrateDialog(page)
      await page.getByRole("button", { name: messages.lockerModule.openingModal.openNowBtn, exact: true }).click()
      await page.getByRole("button", { name: messages.lockerModule.openingModal.doneBtn, exact: true }).waitFor()
    })
    await inspectPage("keyboard-settings", "/locker", page => page.getByRole("button", { name: messages.lockerModule.settingsBtn, exact: true }).click())
    await inspectPage("locker-empty", "/locker", async page => {
      await page.getByPlaceholder(messages.lockerModule.searchPlaceholder).fill("__no_such_skin__")
      await page.getByRole("status").filter({ hasText: messages.lockerModule.noResults }).waitFor()
      await page.getByRole("button", { name: messages.lockerModule.clearFilters }).click()
      await page.getByRole("status").filter({ hasText: messages.lockerModule.noResults }).waitFor({ state: "hidden" })
    })
    await inspectPage("academy-training", "/academy", page => page.getByRole("button", { name: `${messages.academyMastery.train} A`, exact: true }).click())
    await inspectPage("battle-active", "/battle", page => page.getByRole("button", { name: messages.battle.preBattle.startFight.toUpperCase(), exact: true }).click())
    online = true
    await inspectPage("multiplayer-hub", "/multiplayer")
    await inspectPage("matchmaking", "/multiplayer", page => page.getByRole("button", { name: messages.multiplayerHub.findOpponentBtn, exact: true }).click())
    roomWaiting = true
    await inspectPage("private-room", "/multiplayer", async page => {
      await page.getByRole("button", { name: messages.multiplayerHub.createRoomBtn, exact: true }).click()
      await page.getByText(messages.multiplayerHub.lobbyRoomTitle, { exact: true }).waitFor()
    })
    roomWaiting = false
    await inspectPage("pvp-arena", "/multiplayer/arena?matchId=ui-fixture-match")
    arenaResult = true
    await inspectPage("pvp-result", "/multiplayer/arena?matchId=ui-fixture-match")
    await context.close()
    console.log(`${locale} ${size}: routes and interaction states inspected`)
  }
} finally { await browser.close() }
writeFileSync(join(output, "results.json"), JSON.stringify(results, null, 2))
const failures = results.filter(result => result.documentWidth > result.width + 2 || result.overflow.length || result.missingKeys.length || result.unnamedButtons)
console.log(JSON.stringify({ checks: results.length, failures, output }, null, 2))
if (!process.argv.includes("--report-only")) assert.equal(failures.length, 0, `UI defects remain; see ${output}`)
