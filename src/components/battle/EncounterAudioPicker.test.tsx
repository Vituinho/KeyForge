import assert from "node:assert/strict"
import { test } from "node:test"
import { Window } from "happy-dom"
import React, { act } from "react"
import { createRoot } from "react-dom/client"
import { IDBFactory } from "fake-indexeddb"
import { EncounterAudioPicker } from "./EncounterAudioPicker"
import { I18nProvider } from "../../lib/i18n/i18nContext"
import { LocalBattleTracks, localBattleTracks } from "../../lib/audio/localBattleTracks"

test("audio picker selects all 56 encounters, assigns/removes local files and renders EN/PT labels without uploads", async context => {
  const fetch = context.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected upload") })
  let assignment: Promise<boolean> | undefined, removal: Promise<boolean> | undefined
  const assign = localBattleTracks.assign.bind(localBattleTracks), remove = localBattleTracks.remove.bind(localBattleTracks)
  context.mock.method(localBattleTracks, "assign", (...args: Parameters<typeof assign>) => { assignment = assign(...args); return assignment })
  context.mock.method(localBattleTracks, "remove", (...args: Parameters<typeof remove>) => { removal = remove(...args); return removal })
  for (const [locale, encounterLabel, removeLabel] of [["en", "Encounter soundtrack", "Remove local assignment"], ["pt-BR", "Trilha do confronto", "Remover associação local"]]) {
    const browser = new Window({ url: "http://localhost" })
    Object.assign(globalThis, { window: browser, document: browser.document, localStorage: browser.localStorage, indexedDB: new IDBFactory(), IS_REACT_ACT_ENVIRONMENT: true })
    browser.localStorage.setItem("keyforge_language", locale)
    await assign("naruto", new File(["fixture"], "naruto-personal.mp3", { type: "audio/mpeg" }))
    const host = browser.document.createElement("div"); browser.document.body.append(host)
    const root = createRoot(host as unknown as HTMLElement)
    try {
      await act(async () => { root.render(<I18nProvider><EncounterAudioPicker enemyId="naruto" /></I18nProvider>) })
      assert.ok(host.textContent.includes(encounterLabel))
      const select = host.querySelector("select")!
      assert.equal(select.options.length, 56)
      assert.equal(select.value, "naruto")
      await act(async () => { select.value = "goku"; select.dispatchEvent(new browser.Event("change", { bubbles: true })) })
      const input = host.querySelector('input[type="file"]')!
      Object.defineProperty(input, "files", { configurable: true, value: [new File(["fixture"], "duel.wav", { type: "audio/wav" })] })
      assignment = undefined
      await act(async () => { input.dispatchEvent(new browser.Event("change", { bubbles: true })); assert.ok(assignment); await assignment })
      assert.equal((await new LocalBattleTracks().get("goku"))?.name, "duel.wav")
      assert.ok(host.textContent.includes("duel.wav"))
      const removeButton = [...host.querySelectorAll("button")].find(button => button.textContent === removeLabel)!
      assert.ok(removeButton)
      removal = undefined
      await act(async () => { removeButton.click(); assert.ok(removal); await removal })
      assert.equal(await new LocalBattleTracks().get("goku"), undefined)
      assert.equal((await localBattleTracks.get("naruto"))?.name, "naruto-personal.mp3")
    } finally { await act(() => root.unmount()); await browser.happyDOM.close() }
  }
  assert.equal(fetch.mock.callCount(), 0)
})
