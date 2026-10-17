import assert from "node:assert/strict"
import { test } from "node:test"
import { en } from "../../locales/en"
import { ptBR } from "../../locales/pt-BR"
import { formatDecimal } from "./formatNumber"

function flatten(value: object, prefix = ""): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => typeof entry === "object"
    ? Object.entries(flatten(entry, `${prefix}${key}.`)) : [[`${prefix}${key}`, entry]]))
}
test("every English and Portuguese message has matching interpolation parameters and non-empty copy", () => {
  const english = flatten(en), portuguese = flatten(ptBR)
  assert.deepEqual(Object.keys(portuguese).sort(), Object.keys(english).sort())
  for (const [key, message] of Object.entries(english)) {
    assert.ok(message.trim(), key)
    assert.ok(portuguese[key].trim(), key)
    const parameters = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
    assert.deepEqual(parameters(portuguese[key]), parameters(message), key)
  }
})
test("shared gameplay metrics and inventory labels resolve without raw keys in either language", () => {
  for (const dictionary of [en, ptBR]) {
    const messages = flatten(dictionary)
    for (const key of ["common.wpm", "common.accuracy", "common.crate", "dashboard.quickWidget.lockerBtn", "onboarding.goToStep", "keyboard.leftShort", "keyboard.rightShort"]) {
      assert.equal(typeof messages[key], "string", key)
      assert.notEqual(messages[key], key)
    }
  }
  assert.equal(ptBR.common.wpm, "WPM")
  assert.equal(ptBR.common.accuracy, "Precisão")
  assert.equal(ptBR.lockerModule.openingModal.duplicateSalvaged, "♻️ DUPLICATA CONVERTIDA")
})
test("performance decimals use Brazilian and English conventions without rounding the stored value", () => {
  const value = 97.85
  assert.equal(formatDecimal(value, "pt-BR"), "97,9")
  assert.equal(formatDecimal(value, "en"), "97.9")
  assert.equal(value, 97.85)
})
