import assert from "node:assert/strict"
import { test } from "node:test"
import catalog from "./soundtrackReferences.json"
import { BATTLE_MUSIC } from "./battleMusic"
import { CHARACTERS } from "../../data/characters"

test("reference catalog covers every encounter exactly once with traceable credits and explicit uncertainty", () => {
  assert.equal(catalog.encounters.length, 56)
  assert.deepEqual(catalog.encounters.map(entry => entry.enemyId).sort(), CHARACTERS.map(entry => entry.id).sort())
  for (const entry of catalog.encounters) {
    assert.equal(entry.character, BATTLE_MUSIC[entry.enemyId].name)
    assert.ok(entry.assignmentBasis)
    assert.ok(entry.composers.length)
    if (entry.kind === "original") continue
    const source = catalog.sources[entry.sourceId as keyof typeof catalog.sources]
    assert.ok(source)
    for (const url of Object.values(source)) assert.equal(new URL(url).protocol, "https:")
    assert.equal(entry.titleVerified, entry.title !== null)
    if (entry.status === "verified") {
      assert.ok(entry.title)
      assert.ok(["score", "track"].includes(entry.composerCreditScope))
      assert.equal(entry.unresolvedReason, null)
    } else {
      assert.equal(entry.status, "unresolved")
      assert.ok(entry.unresolvedReason)
    }
  }
})

test("listening references never authorize or configure official in-game recordings", () => {
  const official = catalog.encounters.filter(entry => entry.kind === "official-reference")
  assert.equal(official.length, 48)
  for (const entry of official) {
    assert.equal(entry.playbackAuthorization, "not-granted")
    assert.equal(entry.playbackFile, null)
    assert.ok(BATTLE_MUSIC[entry.enemyId].file.startsWith("/audio/bgm/original/"))
  }
  const original = catalog.encounters.filter(entry => entry.kind === "original")
  assert.equal(original.length, 8)
  for (const entry of original) {
    assert.equal(entry.status, "original")
    assert.equal(entry.playbackAuthorization, "bundled-original-license")
    assert.equal(entry.playbackFile, BATTLE_MUSIC[entry.enemyId].file)
  }
})

test("catalog does not invent unavailable character cues or confuse distinct Solo Leveling releases", () => {
  for (const id of ["usopp", "doflamingo", "katakuri", "kokushibo"]) {
    const entry = catalog.encounters.find(entry => entry.enemyId === id)!
    assert.equal(entry.status, "unresolved")
    assert.equal(entry.title, null)
  }
  assert.equal(catalog.encounters.find(entry => entry.enemyId === "jinwoo")!.title, "DARK ARIA")
  assert.equal(catalog.encounters.find(entry => entry.enemyId === "toji")!.sourceId, "jjk2")
  for (const id of ["krillin", "piccolo", "vegeta", "frieza", "cell", "gohan", "broly", "goku"]) {
    const entry = catalog.encounters.find(entry => entry.enemyId === id)!
    assert.equal(entry.status, "verified")
    assert.deepEqual(entry.composers, ["Norihito Sumitomo"])
  }
})
