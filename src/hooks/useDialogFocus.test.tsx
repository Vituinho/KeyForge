import assert from "node:assert/strict"
import { test } from "node:test"
import { Window, HTMLButtonElement as HappyButton } from "happy-dom"
import React, { act, useState } from "react"
import { createRoot } from "react-dom/client"
import { useDialogFocus } from "./useDialogFocus"

test("dialog traps Tab, closes with Escape and restores focus/scroll", async () => {
  const browser = new Window({ url: "http://localhost" })
  Object.assign(globalThis, { window: browser, document: browser.document, IS_REACT_ACT_ENVIRONMENT: true })
  const trigger = browser.document.createElement("button"), host = browser.document.createElement("div")
  browser.document.body.append(trigger, host); trigger.focus()
  function Harness() {
    const [open, setOpen] = useState(true), ref = useDialogFocus(open, () => setOpen(false))
    return open ? React.createElement("div", { ref, role: "dialog", tabIndex: -1 }, React.createElement("button", { id: "first" }, "First"), React.createElement("button", { id: "last" }, "Last")) : null
  }
  const root = createRoot(host as unknown as HTMLElement)
  try {
    await act(() => root.render(React.createElement(Harness)))
    assert.equal(browser.document.activeElement?.id, "first")
    const last = host.querySelector<HappyButton>("#last")!; last.focus()
    await act(() => { last.dispatchEvent(new browser.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })) })
    assert.equal(browser.document.activeElement?.id, "first")
    await act(() => { host.querySelector("#first")!.dispatchEvent(new browser.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })) })
    assert.equal(host.querySelector('[role="dialog"]'), null)
    assert.equal(browser.document.activeElement, trigger)
    assert.equal(browser.document.body.style.overflow, "")
  } finally { await act(() => root.unmount()); await browser.happyDOM.close() }
})
