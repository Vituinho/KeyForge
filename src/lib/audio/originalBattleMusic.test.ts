import assert from "node:assert/strict"
import { test } from "node:test"
import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { BATTLE_MUSIC } from "./battleMusic"
import { CHARACTERS } from "../../data/characters"
import { renderBattleTrack, SAMPLE_RATE } from "../../../scripts/audio/renderBattleTrack"

test("every encounter ships a distinct enabled recording with verifiable source and distribution permission", () => {
  const provenance = JSON.parse(readFileSync("public/audio/bgm/original/provenance.json", "utf8")) as { tracks: { enemyId: string; sha256: string; bytes: number }[] }
  assert.equal(provenance.tracks.length, 56)
  assert.equal(new Set(provenance.tracks.map(track => track.sha256)).size, 56)
  for (const enemy of CHARACTERS) {
    const track = BATTLE_MUSIC[enemy.id], record = provenance.tracks.find(record => record.enemyId === enemy.id)!
    assert.equal(track.available, true)
    assert.equal(track.commercialUse, true)
    assert.ok(track.source?.includes("renderBattleTrack.ts"))
    assert.ok(track.license?.includes("LICENSE.txt"))
    const data = readFileSync("public" + track.file)
    assert.equal(data.length, record.bytes)
    assert.equal(createHash("sha256").update(data).digest("hex"), record.sha256)
    assert.equal(data.readUInt32LE(24), SAMPLE_RATE)
    assert.equal(data.readInt16LE(44), 0)
    assert.equal(data.readInt16LE(data.length - 2), 0)
  }
})
test("original score generation is reproducible and distinguishes encounters and climactic bosses", () => {
  const a = renderBattleTrack("naruto", 0)
  assert.deepEqual(renderBattleTrack("naruto", 0).audio, a.audio)
  assert.deepEqual(readFileSync("public" + BATTLE_MUSIC.naruto.file), a.audio)
  const boss = renderBattleTrack("madara", 7)
  assert.equal(boss.boss, true)
  assert.equal(a.boss, false)
  assert.notDeepEqual(boss.audio, a.audio)
  assert.ok(a.seconds >= 12 && a.seconds <= 20)
})
