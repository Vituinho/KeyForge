import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { IDBFactory } from "fake-indexeddb"
import { LocalBattleTracks, validateLocalAudio, type LocalTrackStorage } from "./localBattleTracks"

beforeEach(() => { globalThis.indexedDB = new IDBFactory() })
const file = (name = "personal.mp3") => new File([new Uint8Array([1, 2, 3])], name, { type: "audio/mpeg" })

test("IndexedDB persists encounter assignments and audio bytes across library instances without uploading", async context => {
  const fetch = context.mock.method(globalThis, "fetch", async () => { throw new Error("Audio must remain local") })
  const library = new LocalBattleTracks()
  assert.equal(await library.assign("naruto", file()), true)
  assert.equal(await library.assign("pain", file("boss.mp3")), true)
  const reloaded = new LocalBattleTracks()
  const naruto = await reloaded.get("naruto"), pain = await reloaded.get("pain")
  assert.equal(naruto?.name, "personal.mp3")
  assert.equal(pain?.name, "boss.mp3")
  assert.deepEqual(new Uint8Array(await naruto!.file.arrayBuffer()), new Uint8Array([1, 2, 3]))
  assert.equal(await reloaded.get("goku"), undefined)
  assert.equal(fetch.mock.callCount(), 0)
})

test("replacing and removing an assignment survive reload without affecting other encounters", async () => {
  const library = new LocalBattleTracks()
  await library.assign("naruto", file())
  await library.assign("goku", file("duel.mp3"))
  await library.assign("naruto", file("replacement.mp3"))
  assert.equal((await new LocalBattleTracks().get("naruto"))?.name, "replacement.mp3")
  assert.equal(await library.remove("naruto"), true)
  assert.equal(await new LocalBattleTracks().get("naruto"), undefined)
  assert.equal((await new LocalBattleTracks().get("goku"))?.name, "duel.mp3")
})

test("unavailable browser storage keeps selected audio for the session and reports non-persistence", async () => {
  const unavailable: LocalTrackStorage = {
    get: async () => { throw new Error("Unavailable") },
    put: async () => { throw new Error("Quota") },
    remove: async () => { throw new Error("Unavailable") },
  }
  const library = new LocalBattleTracks(unavailable), changes: string[] = []
  const unsubscribe = library.subscribe(id => changes.push(id))
  assert.equal(await library.get("naruto"), undefined)
  assert.equal(await library.assign("naruto", file()), false)
  assert.equal((await library.get("naruto"))?.name, "personal.mp3")
  assert.equal(await library.remove("naruto"), false)
  assert.equal(await library.get("naruto"), undefined)
  assert.deepEqual(changes, ["naruto", "naruto"])
  unsubscribe()
})

test("file validation rejects empty, oversized and non-audio files without replacing a valid assignment", async () => {
  const library = new LocalBattleTracks()
  await library.assign("naruto", file())
  await assert.rejects(library.assign("naruto", new File([], "empty.mp3")), /localSize/)
  await assert.rejects(library.assign("naruto", new File(["html"], "page.html", { type: "text/html" })), /localFormat/)
  assert.throws(() => validateLocalAudio({ size: 101 * 1024 * 1024 } as Blob, "large.mp3"), /localSize/)
  await assert.rejects(library.assign("unknown", file()), /Unknown encounter/)
  assert.equal((await library.get("naruto"))?.name, "personal.mp3")
  // Some browsers provide an empty MIME type; decoding remains the player's responsibility.
  assert.doesNotThrow(() => validateLocalAudio(new Blob(["fixture"]), "personal.ogg"))
})

test("missing or malformed persisted files leave the licensed encounter mapping available", async () => {
  const library = new LocalBattleTracks({ get: async () => ({ enemyId: "goku", name: "wrong.mp3", file: file() }), put: async () => {}, remove: async () => {} })
  assert.equal(await library.get("naruto"), undefined)
})
