import { getAudioSettings, saveAudioSettings, subscribeAudioSettings } from "./audioSettings"
import type { BattleMusicTrack } from "./battleMusic"

interface Voice { audio: HTMLAudioElement; track: BattleMusicTrack; fallback: BattleMusicTrack | null; level: number; frame?: number; pending: boolean; blocked: boolean }
interface MusicRuntime {
  createAudio: (src: string) => HTMLAudioElement
  now: () => number
  frame: (callback: FrameRequestCallback) => number
  cancelFrame: (id: number) => void
}
const browserRuntime: MusicRuntime = {
  createAudio: src => new Audio(src), now: () => performance.now(),
  frame: callback => requestAnimationFrame(callback), cancelFrame: id => cancelAnimationFrame(id),
}

/** Audio frames never update React or run in the typing path. */
export class MusicManager {
  private current: Voice | null = null
  private voices = new Set<Voice>()
  private failed = new Set<string>()
  private paused = false
  private resultMode = false
  private interactionCleanup: (() => void) | null = null
  private settingsCleanup: (() => void) | null = null

  constructor(private runtime: MusicRuntime = browserRuntime) {}

  private volume(voice: Voice) {
    const settings = getAudioSettings()
    voice.audio.volume = settings.enabled ? voice.level * settings.masterVolume * settings.musicVolume : 0
  }
  private release(voice: Voice) {
    if (voice.frame !== undefined) this.runtime.cancelFrame(voice.frame)
    voice.audio.onerror = null
    voice.audio.pause()
    voice.audio.removeAttribute("src")
    voice.audio.load()
    this.voices.delete(voice)
    if (!this.voices.size && !this.current) this.detach()
  }
  private fade(voice: Voice, target: number, duration: number, release = false) {
    if (voice.frame !== undefined) this.runtime.cancelFrame(voice.frame)
    const start = this.runtime.now(), from = voice.level
    const tick = () => {
      const progress = duration <= 0 ? 1 : Math.min(1, (this.runtime.now() - start) / duration)
      voice.level = from + (target - from) * progress
      this.volume(voice)
      if (progress < 1) voice.frame = this.runtime.frame(tick)
      else { voice.frame = undefined; if (release) this.release(voice) }
    }
    tick()
  }
  private detach() {
    this.interactionCleanup?.(); this.interactionCleanup = null
    this.settingsCleanup?.(); this.settingsCleanup = null
  }
  private listen() {
    if (!this.settingsCleanup) this.settingsCleanup = subscribeAudioSettings(() => {
      for (const voice of this.voices) this.volume(voice)
      if (!getAudioSettings().enabled) for (const voice of this.voices) voice.audio.pause()
      else if (!this.paused && this.current?.audio.paused) void this.tryPlay(this.current, 650)
    })
    if (!this.interactionCleanup && typeof window !== "undefined") {
      const recover = (event: Event) => {
        if (!event.isTrusted) return
        if (this.current?.blocked) void this.tryPlay(this.current, 650)
      }
      // A single attempt per real interaction, never a retry timer or a synthetic click.
      window.addEventListener("pointerdown", recover, { passive: true })
      window.addEventListener("keydown", recover, { passive: true })
      this.interactionCleanup = () => {
        window.removeEventListener("pointerdown", recover)
        window.removeEventListener("keydown", recover)
      }
    }
  }
  private async tryPlay(voice: Voice, fadeMs: number) {
    if (voice.pending || this.paused || !getAudioSettings().enabled || !this.voices.has(voice)) return
    voice.pending = true
    try {
      await voice.audio.play()
      voice.blocked = false
      if (!this.voices.has(voice)) { voice.audio.pause(); return }
      if (this.paused || !getAudioSettings().enabled) { voice.audio.pause(); return }
      if (voice === this.current) this.fade(voice, this.resultMode ? 0.3 : 1, fadeMs)
    } catch (error) {
      if ((error as { name?: string })?.name === "NotAllowedError") voice.blocked = true
      else if ((error as { name?: string })?.name !== "AbortError") this.fail(voice)
    } finally { voice.pending = false }
  }
  private fail(voice: Voice) {
    if (!this.voices.has(voice)) return
    const wasCurrent = this.current === voice
    this.failed.add(voice.track.file)
    if (wasCurrent) this.current = null
    this.release(voice)
    if (wasCurrent && voice.fallback && voice.fallback.file !== voice.track.file) this.play(voice.fallback)
  }
  play(track: BattleMusicTrack | null, fallback: BattleMusicTrack | null = null): void {
    const playable = (candidate: BattleMusicTrack | null): candidate is BattleMusicTrack =>
      !!candidate?.available && !!candidate.source && !!candidate.license && candidate.commercialUse === true && !this.failed.has(candidate.file)
    const resolved = playable(track) ? track : playable(fallback) ? fallback : null
    if (!resolved) { this.stop(); return }
    if (this.current?.track.file === resolved.file) return
    this.paused = false
    this.resultMode = false
    const previous = this.current
    try {
      const audio = this.runtime.createAudio(resolved.file)
      audio.preload = "auto" // Only the chosen encounter, never the roster.
      audio.loop = true
      audio.volume = 0
      const voice: Voice = { audio, track: resolved, fallback, level: 0, blocked: false, pending: false }
      this.current = voice
      this.voices.add(voice)
      audio.onerror = () => this.fail(voice)
      this.listen()
      void this.tryPlay(voice, previous ? 800 : 650)
      if (previous) this.fade(previous, 0, 800, true)
    } catch {
      this.failed.add(resolved.file); this.current = previous
      if (playable(fallback) && resolved.file !== fallback.file) this.play(fallback)
      else this.stop()
    }
  }
  pause(): void {
    this.paused = true
    for (const voice of this.voices) voice.audio.pause()
  }
  resume(): void {
    this.paused = false
    if (this.current && getAudioSettings().enabled) void this.tryPlay(this.current, 650)
  }
  setVolume(volume: number): void { saveAudioSettings({ musicVolume: volume }) }
  mute(muted: boolean): void { saveAudioSettings({ enabled: !muted }) }
  setResultMode(active: boolean): void {
    this.resultMode = active
    if (this.current) this.fade(this.current, active ? 0.3 : 1, 500)
  }
  stop(fadeMs = 500): void {
    this.current = null
    this.paused = true
    this.detach()
    for (const voice of this.voices) this.fade(voice, 0, fadeMs, true)
  }
  cleanup(): void { this.stop(0) }
}

export const musicManager = new MusicManager()
