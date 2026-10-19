import assert from "node:assert/strict"
import { test } from "node:test"
import { Window } from "happy-dom"
import React, { act } from "react"
import { createRoot } from "react-dom/client"
import SoundtracksPage from "./page"
import { I18nProvider } from "../../lib/i18n/i18nContext"
import { en } from "../../locales/en"
import { ptBR } from "../../locales/pt-BR"

test("discovery renders both languages, external references and truthful empty/original states without media requests", async context => {
  const network = context.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected network request") })
  for (const [locale, labels] of [["en", en.soundtracks], ["pt-BR", ptBR.soundtracks]] as const) {
    const browser = new Window({ url: "http://localhost/soundtracks" })
    Object.assign(globalThis, { window: browser, self: browser, document: browser.document, localStorage: browser.localStorage, IS_REACT_ACT_ENVIRONMENT: true })
    browser.localStorage.setItem("keyforge_language", locale)
    const host = browser.document.createElement("div"); browser.document.body.append(host)
    const root = createRoot(host as unknown as HTMLElement)
    try {
      await act(async () => root.render(<I18nProvider><SoundtracksPage /></I18nProvider>))
      assert.equal(host.querySelector("h1")?.textContent, labels.title)
      assert.equal(host.querySelectorAll("article").length, 56)
      assert.equal(host.querySelectorAll('a[href^="https://open.spotify.com/track/"]').length, 39)
      assert.equal(host.querySelectorAll('a[href^="https://open.spotify.com/playlist/"]').length, 1)
      const open = context.mock.method(browser, "open", () => null)
      const firstLink = host.querySelector('article a')!
      const defaultClick = new browser.MouseEvent("click", { bubbles: true, cancelable: true })
      firstLink.dispatchEvent(defaultClick)
      assert.equal(open.mock.callCount(), 1)
      assert.notEqual(open.mock.calls[0].arguments[0], "about:blank")
      open.mock.resetCalls()
      await act(async () => (host.querySelector('input[type="checkbox"]') as unknown as HTMLInputElement).click())
      const blockedClick = new browser.MouseEvent("click", { bubbles: true, cancelable: true })
      firstLink.dispatchEvent(blockedClick)
      assert.equal(open.mock.calls[0].arguments[0], "about:blank")
      assert.equal(blockedClick.defaultPrevented, false)
      open.mock.resetCalls()
      open.mock.mockImplementation(() => ({ opener: null, location: { replace: () => {} } }) as unknown as ReturnType<typeof browser.open>)
      const popupClick = new browser.MouseEvent("click", { bubbles: true, cancelable: true })
      firstLink.dispatchEvent(popupClick)
      assert.equal(popupClick.defaultPrevented, true)
      assert.equal(open.mock.callCount(), 1)
      open.mock.resetCalls()
      const modifiedClick = new browser.MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true })
      firstLink.dispatchEvent(modifiedClick)
      assert.equal(open.mock.callCount(), 1)
      assert.notEqual(open.mock.calls[0].arguments[0], "about:blank")
      assert.equal(modifiedClick.defaultPrevented, false)
      assert.equal(host.querySelectorAll("audio,iframe").length, 0)
      for (const link of host.querySelectorAll('a[target="_blank"]')) assert.equal(link.getAttribute("rel"), "noopener noreferrer")
      const select = host.querySelector("select")!
      await act(async () => { select.value = "Dragon Ball"; select.dispatchEvent(new browser.Event("change", { bubbles: true })) })
      assert.equal(host.querySelectorAll("article").length, 8)
      assert.equal(host.querySelectorAll('article a[target="_blank"]').length, 0)
      const linked = [...host.querySelectorAll("button")].find(button => button.textContent === labels.filter_linked)!
      await act(async () => linked.click())
      assert.ok(host.textContent?.includes(labels.empty))
      await act(async () => [...host.querySelectorAll("button")].find(button => button.textContent === labels.reset)!.click())
      assert.equal(host.querySelectorAll("article").length, 56)
      await act(async () => [...host.querySelectorAll("button")].find(button => button.textContent === labels.filter_original)!.click())
      assert.equal(host.querySelectorAll("article").length, 8)
      assert.ok(host.textContent?.includes(labels.noAnimeTrack))
    } finally { await act(async () => root.unmount()); browser.happyDOM.abort() }
  }
  assert.equal(network.mock.callCount(), 0)
})
