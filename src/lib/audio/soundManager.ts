/**
 * KeyForge v3.4 Audio Architecture
 * Lightweight procedural Web Audio synthesis engine.
 *
 * Principles:
 * - Zero external assets or network requests (no mp3/wav/ogg files).
 * - Safe fallback: completely inert if AudioContext is unavailable or blocked.
 * - Non-blocking: audio execution never delays or intercepts typing keystrokes.
 */

export interface AudioSettings {
  enabled: boolean
  masterVolume: number // 0.0 to 1.0
  sfxVolume: number // 0.0 to 1.0
}

const STORAGE_KEY = "keyforge_audio_settings"

const DEFAULT_SETTINGS: AudioSettings = {
  enabled: true,
  masterVolume: 0.7,
  sfxVolume: 0.8,
}

class SoundManager {
  private ctx: AudioContext | null = null
  private settings: AudioSettings = { ...DEFAULT_SETTINGS }
  private initialized = false

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSettings()
    }
  }

  private loadSettings(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS }
    }
  }

  public saveSettings(newSettings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
    } catch {
      // Storage unavailable
    }
  }

  public getSettings(): AudioSettings {
    return { ...this.settings }
  }

  public toggleMute(): boolean {
    const nextState = !this.settings.enabled
    this.saveSettings({ enabled: nextState })
    return nextState
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass()
      }
    }

    // Resume if suspended by browser autoplay policy
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {
        // Autoplay policy prevented immediate resume
      })
    }

    return this.ctx
  }

  private getGain(): GainNode | null {
    const ctx = this.getContext()
    if (!ctx || !this.settings.enabled) return null

    const effectiveVolume = this.settings.masterVolume * this.settings.sfxVolume
    if (effectiveVolume <= 0) return null

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(effectiveVolume, ctx.currentTime)
    gain.connect(ctx.destination)
    return gain
  }

  /**
   * Subtle soft click on correct keystroke
   */
  public playKeystroke(variation = 0): void {
    const gain = this.getGain()
    const ctx = this.ctx
    if (!gain || !ctx) return

    const osc = ctx.createOscillator()
    osc.type = "sine"
    // Frequency between 600Hz and 800Hz
    const baseFreq = 700 + (variation % 10) * 15
    osc.frequency.setValueAtTime(baseFreq, ctx.currentTime)

    gain.gain.setValueAtTime(0.12 * this.settings.sfxVolume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025)

    osc.connect(gain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.025)
  }

  /**
   * Low soft buzz on typo
   */
  public playTypo(): void {
    const gain = this.getGain()
    const ctx = this.ctx
    if (!gain || !ctx) return

    const osc = ctx.createOscillator()
    osc.type = "sawtooth"
    osc.frequency.setValueAtTime(140, ctx.currentTime)

    gain.gain.setValueAtTime(0.15 * this.settings.sfxVolume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07)

    osc.connect(gain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.07)
  }

  /**
   * Ascending gentle dual chime on completed sentence
   */
  public playSentenceComplete(): void {
    const gain = this.getGain()
    const ctx = this.ctx
    if (!gain || !ctx) return

    const notes = [523.25, 659.25] // C5, E5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06)

      const noteGain = ctx.createGain()
      noteGain.gain.setValueAtTime(0.18 * this.settings.sfxVolume, ctx.currentTime + idx * 0.06)
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.12)

      osc.connect(noteGain)
      noteGain.connect(ctx.destination)
      osc.start(ctx.currentTime + idx * 0.06)
      osc.stop(ctx.currentTime + idx * 0.06 + 0.12)
    })
  }

  /**
   * Shimmering golden chime on Personal Best milestone
   */
  public playPersonalBest(): void {
    const gain = this.getGain()
    const ctx = this.ctx
    if (!gain || !ctx) return

    const chord = [880, 1108.73, 1318.51, 1760] // A Major arpeggio
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07)

      const noteGain = ctx.createGain()
      noteGain.gain.setValueAtTime(0.2 * this.settings.sfxVolume, ctx.currentTime + idx * 0.07)
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.25)

      osc.connect(noteGain)
      noteGain.connect(ctx.destination)
      osc.start(ctx.currentTime + idx * 0.07)
      osc.stop(ctx.currentTime + idx * 0.07 + 0.25)
    })
  }

  /**
   * Deep cinematic resonance chord on Boss Phase Shift
   */
  public playBossPhaseShift(): void {
    const gain = this.getGain()
    const ctx = this.ctx
    if (!gain || !ctx) return

    const notes = [164.81, 220.0, 329.63] // E3, A3, E4 power chord
    notes.forEach((freq) => {
      const osc = ctx.createOscillator()
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      const noteGain = ctx.createGain()
      noteGain.gain.setValueAtTime(0.18 * this.settings.sfxVolume, ctx.currentTime)
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

      osc.connect(noteGain)
      noteGain.connect(ctx.destination)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    })
  }
}

export const soundManager = new SoundManager()
