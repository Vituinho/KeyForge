import { getAudioSettings, saveAudioSettings, subscribeAudioSettings } from "./audioSettings"
import type { BattleMusicTrack } from "./battleMusic"

export interface LocalPlaybackTrack { kind: "local"; enemyId: string; name: string; file: string; dispose: () => void }
type PlaybackTrack = BattleMusicTrack | LocalPlaybackTrack
export type MusicStatus = "idle" | "loading" | "playing" | "blocked" | "unavailable" | "failed" | "paused"
interface Voice { audio: HTMLAudioElement; track: PlaybackTrack; fallback: BattleMusicTrack | null; level: number; frame?: number; pending: boolean; blocked: boolean }
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
  private generation = 0
  private requested: PlaybackTrack | null = null
  private status: MusicStatus = "idle"
  private statusListeners = new Set<() => void>()
  getStatus = (): MusicStatus => this.status
  subscribe = (listener: () => void): (() => void) => { this.statusListeners.add(listener); return () => { this.statusListeners.delete(listener) } }
  private report(status: MusicStatus) {
    if (this.status === status) return
    this.status = status
    this.statusListeners.forEach(listener => listener())
  }

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
    if ("kind" in voice.track) voice.track.dispose()
    this.voices.delete(voice)
    if (!this.voices.size && !this.current) this.detach()
  }
  private fade(voice: Voice, target: number, duration: number, release = false, after?: () => void) {
    if (voice.frame !== undefined) this.runtime.cancelFrame(voice.frame)
    const start = this.runtime.now(), from = voice.level
    const tick = () => {
      const progress = duration <= 0 ? 1 : Math.min(1, (this.runtime.now() - start) / duration)
      voice.level = from + (target - from) * progress
      this.volume(voice)
      if (progress < 1) voice.frame = this.runtime.frame(tick)
      else { voice.frame = undefined; if (release) this.release(voice); after?.() }
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
      if (voice === this.current) this.report("playing")
    } catch (error) {
      if ((error as { name?: string })?.name === "NotAllowedError") { voice.blocked = true; if (voice === this.current) this.report("blocked") }
      else if ((error as { name?: string })?.name !== "AbortError") this.fail(voice)
    } finally { voice.pending = false }
  }
  private fail(voice: Voice) {
    if (!this.voices.has(voice)) return
    const wasCurrent = this.current === voice
    this.failed.add(voice.track.file)
    if (wasCurrent) this.current = null
    if (wasCurrent) this.requested = null
    this.release(voice)
    if (wasCurrent && voice.fallback && voice.fallback.file !== voice.track.file) {
      this.play(voice.fallback)
      if (this.status === "unavailable") this.report("failed")
    }
    else if (wasCurrent) this.report("failed")
  }
  play(track: PlaybackTrack | null, fallback: BattleMusicTrack | null = null): void {
    const playable = (candidate: PlaybackTrack | null): candidate is PlaybackTrack =>
      !!candidate && !this.failed.has(candidate.file) && ("kind" in candidate
        ? candidate.kind === "local" && candidate.file.startsWith("blob:")
        : candidate.available && !!candidate.source && !!candidate.license && candidate.commercialUse === true)
    const resolved = playable(track) ? track : playable(fallback) ? fallback : null
    if (!resolved) { this.stop(); this.report("unavailable"); return }
    if (this.requested?.file === resolved.file) return
    if (this.requested && "kind" in this.requested && ![...this.voices].some(voice => voice.track === this.requested)) this.requested.dispose()
    this.requested = resolved
    const generation = ++this.generation
    this.paused = false
    this.resultMode = false
    const previous = this.current ?? [...this.voices][0]
    this.current = null
    this.report("loading")
    const start = () => {
      if (generation !== this.generation) return
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
        void this.tryPlay(voice, 650)
      } catch {
        this.failed.add(resolved.file)
        if ("kind" in resolved) resolved.dispose()
        this.requested = null
        if (playable(fallback) && resolved.file !== fallback.file) this.play(fallback)
        else { this.stop(0); this.report("failed") }
      }
    }
    // Finish the outgoing fade before starting the next recording: never overlapping tracks.
    if (previous) { previous.audio.onerror = null; this.fade(previous, 0, 250, true, start) }
    else start()
  }
  pause(): void {
    this.paused = true
    for (const voice of this.voices) voice.audio.pause()
    this.report("paused")
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
    ++this.generation
    if (this.requested && "kind" in this.requested && ![...this.voices].some(voice => voice.track === this.requested)) this.requested.dispose()
    this.requested = null
    this.current = null
    this.paused = true
    this.detach()
    for (const voice of this.voices) this.fade(voice, 0, fadeMs, true)
    this.report("idle")
  }
  cleanup(): void { this.stop(0) }
}

export const musicManager = new MusicManager()
