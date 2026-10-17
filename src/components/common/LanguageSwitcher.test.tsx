import assert from "node:assert/strict"
import { test } from "node:test"
import { Window } from "happy-dom"
import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { I18nProvider } from "../../lib/i18n/i18nContext"

test("language selection supports arrows, Home/End, focus restoration and localized labels", async () => {
  const browser = new Window({ url: "http://localhost" })
  Object.assign(globalThis, { window: browser, document: browser.document, localStorage: browser.localStorage, IS_REACT_ACT_ENVIRONMENT: true })
  browser.localStorage.setItem("keyforge_language", "en")
  const host = browser.document.createElement("div"); browser.document.body.append(host)
  const root = createRoot(host as unknown as HTMLElement)
  try {
    await act(() => root.render(<I18nProvider><LanguageSwitcher /></I18nProvider>))
    const trigger = host.querySelector("button")!
    await act(() => trigger.click())
    assert.equal(browser.document.activeElement?.getAttribute("aria-selected"), "true")
    const list = host.querySelector('[role="listbox"]')!
    await act(() => browser.document.activeElement!.dispatchEvent(new browser.KeyboardEvent("keydown", { key: "Home", bubbles: true })))
    assert.equal(browser.document.activeElement?.textContent, "🇧🇷Português (BR)")
    await act(() => browser.document.activeElement!.dispatchEvent(new browser.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })))
    assert.ok(browser.document.activeElement?.textContent?.includes("English"))
    await act(() => browser.document.activeElement!.dispatchEvent(new browser.KeyboardEvent("keydown", { key: "Home", bubbles: true })))
    await act(() => (browser.document.activeElement as unknown as HTMLButtonElement).click())
    assert.equal(browser.localStorage.getItem("keyforge_language"), "pt-BR")
    assert.equal(trigger.getAttribute("aria-expanded"), "false")
    assert.equal(browser.document.activeElement, trigger)
    assert.equal(trigger.getAttribute("aria-label"), "Selecionar idioma")
    assert.ok(list.id)
    await act(() => trigger.click())
    await act(() => browser.document.activeElement!.dispatchEvent(new browser.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })))
    assert.equal(browser.document.activeElement, trigger)
    assert.equal(trigger.getAttribute("aria-expanded"), "false")
  } finally { await act(() => root.unmount()); await browser.happyDOM.close() }
})
