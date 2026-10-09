import assert from "node:assert/strict"
import { test } from "node:test"
import { CHARACTERS } from "@/data/characters"
import { getAllWorlds } from "@/data/worlds"
import { en } from "@/locales/en"
import { ptBR } from "@/locales/pt-BR"

test("every character and world-stage typing focus has PT-BR and EN labels", () => {
  const focuses = new Set([...CHARACTERS.map(character => character.typingFocus),
    ...getAllWorlds().flatMap(world => world.stages.map(stage => stage.typingFocus))])
  for (const focus of focuses) for (const dictionary of [en, ptBR]) {
    assert.ok(Object.hasOwn(dictionary.battle.focusTypes, focus), `Missing focus label: ${focus}`)
  }
})
