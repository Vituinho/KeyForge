import assert from "node:assert/strict"
import { test } from "node:test"
import { CHARACTERS } from "@/data/characters"
import { getAllWorlds } from "@/data/worlds"
import { ALL_KEYBOARD_SKINS } from "@/data/keyboardSkins"
import { en } from "@/locales/en"
import { ptBR } from "@/locales/pt-BR"
import { localizedCharacterDescription } from "./characterDescription"

test("every character and world-stage typing focus has PT-BR and EN labels", () => {
  const focuses = new Set([...CHARACTERS.map(character => character.typingFocus),
    ...getAllWorlds().flatMap(world => world.stages.map(stage => stage.typingFocus))])
  for (const focus of focuses) for (const dictionary of [en, ptBR]) {
    assert.ok(focus, "A configured character/stage is missing its typing focus")
    assert.ok(Object.hasOwn(dictionary.battle.focusTypes, focus), `Missing focus label: ${focus}`)
  }
})

test("the complete cosmetic catalog has localized descriptions", () => {
  for (const skin of ALL_KEYBOARD_SKINS) for (const dictionary of [en, ptBR]) {
    assert.ok(Object.hasOwn(dictionary.skinDescriptions, skin.id), `Missing description: ${skin.id}`)
  }
})

test("all 56 encounters have a translated narrative or stage explanation", () => {
  for (const dictionary of [en, ptBR]) {
    const translate = (key: string) => {
      let value: unknown = dictionary
      for (const part of key.split(".")) value = value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined
      return typeof value === "string" ? value : key
    }
    for (const character of CHARACTERS) {
      const description = localizedCharacterDescription(character.id, translate)
      assert.ok(description.length > 0, `Missing explanation: ${character.id}`)
      assert.ok(!description.startsWith("battle.") && !description.startsWith("animeWorld."))
    }
    assert.equal(localizedCharacterDescription("unknown-enemy", translate), "")
  }
})
