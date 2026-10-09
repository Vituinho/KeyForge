export interface AudioSettings {
  enabled: boolean
  masterVolume: number
  musicVolume: number
  sfxVolume: number
}

export const AUDIO_STORAGE_KEY = "keyforge_audio_settings"
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  enabled: true, masterVolume: 0.7, musicVolume: 0.35, sfxVolume: 0.8,
}
const volume = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback

export function normalizeAudioSettings(value: unknown): AudioSettings {
  const data = value && typeof value === "object" ? value as Partial<AudioSettings> : {}
  return {
    enabled: typeof data.enabled === "boolean" ? data.enabled : true,
    masterVolume: volume(data.masterVolume, 0.7),
    musicVolume: volume(data.musicVolume, 0.35),
    sfxVolume: volume(data.sfxVolume, 0.8),
  }
}

let settings = DEFAULT_AUDIO_SETTINGS
let loaded = false
const listeners = new Set<() => void>()
export function getAudioSettings(): AudioSettings {
  if (!loaded && typeof window !== "undefined") {
    loaded = true
    try { settings = normalizeAudioSettings(JSON.parse(localStorage.getItem(AUDIO_STORAGE_KEY) ?? "null")) } catch { /* Keep defaults. */ }
  }
  return settings
}
export function saveAudioSettings(partial: Partial<AudioSettings>): void {
  settings = normalizeAudioSettings({ ...getAudioSettings(), ...partial })
  try { localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings)) } catch { /* In-memory preferences still work. */ }
  listeners.forEach(listener => listener())
}
export function subscribeAudioSettings(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === AUDIO_STORAGE_KEY || event.key === null) {
      loaded = false
      getAudioSettings()
      listeners.forEach(callback => callback())
    }
  }
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage)
  }
}

export const getServerAudioSettings = () => DEFAULT_AUDIO_SETTINGS
