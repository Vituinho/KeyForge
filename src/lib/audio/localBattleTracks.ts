import { BATTLE_MUSIC } from "./battleMusic"

export interface LocalTrack { enemyId: string; name: string; file: Blob }
export interface LocalTrackStorage {
  get(id: string): Promise<LocalTrack | undefined>
  put(track: LocalTrack): Promise<void>
  remove(id: string): Promise<void>
}

/** IndexedDB structured-clones the file into this browser only. No network requests. */
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("Local storage unavailable")); return }
    const request = indexedDB.open("keyforge-local-battle-audio", 1)
    let expired = false
    const timeout = setTimeout(() => { expired = true; reject(new Error("Local storage unavailable")) }, 3000)
    request.onupgradeneeded = () => { request.result.createObjectStore("tracks", { keyPath: "enemyId" }) }
    request.onsuccess = () => { clearTimeout(timeout); if (expired) request.result.close(); else resolve(request.result) }
    request.onerror = request.onblocked = () => { expired = true; clearTimeout(timeout); reject(new Error("Local storage unavailable")) }
  })
}
async function stored<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await database()
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction("tracks", mode)
      const request = action(transaction.objectStore("tracks"))
      transaction.oncomplete = () => resolve(request.result as T)
      transaction.onabort = transaction.onerror = () => reject(new Error("Local storage unavailable"))
    })
  } finally { db.close() }
}
const storage: LocalTrackStorage = {
  get: id => stored("readonly", store => store.get(id)),
  put: async track => { await stored("readwrite", store => store.put(track)) },
  remove: async id => { await stored("readwrite", store => store.delete(id)) },
}
export function validateLocalAudio(file: Blob, name: string): void {
  if (!file.size || file.size > 100 * 1024 * 1024) throw new Error("localSize")
  if (!file.type.startsWith("audio/") && !/\.(mp3|ogg|oga|wav|m4a|aac|flac|webm|opus)$/i.test(name)) throw new Error("localFormat")
}

export class LocalBattleTracks {
  private session = new Map<string, LocalTrack | undefined>()
  private listeners = new Set<(id: string) => void>()
  constructor(private persistence: LocalTrackStorage = storage) {}
  subscribe(listener: (id: string) => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  async get(id: string): Promise<LocalTrack | undefined> {
    if (this.session.has(id)) return this.session.get(id)
    try {
      const track = await this.persistence.get(id)
      if (track && track.enemyId === id && track.file instanceof Blob) {
        validateLocalAudio(track.file, track.name)
        return track
      }
    } catch { /* Missing, evicted or inaccessible local data leaves licensed playback available. */ }
  }
  async assign(id: string, file: File): Promise<boolean> {
    if (!Object.hasOwn(BATTLE_MUSIC, id)) throw new Error("Unknown encounter")
    validateLocalAudio(file, file.name)
    const track = { enemyId: id, name: file.name, file }
    this.session.set(id, track)
    this.listeners.forEach(listener => listener(id))
    let persisted = true
    try { await this.persistence.put(track) } catch { persisted = false }
    return persisted
  }
  async remove(id: string): Promise<boolean> {
    this.session.set(id, undefined)
    let persisted = true
    try { await this.persistence.remove(id) } catch { persisted = false }
    this.listeners.forEach(listener => listener(id))
    return persisted
  }
}
export const localBattleTracks = new LocalBattleTracks()
