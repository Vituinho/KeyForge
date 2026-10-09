/**
 * KeyForge v3.4 Audio Architecture
 * Lightweight procedural Web Audio synthesis engine.
 *
 * Principles:
 * - Zero external assets or network requests (no mp3/wav/ogg files).
 * - Safe fallback: completely inert if AudioContext is unavailable or blocked.
 * - Non-blocking: audio execution never delays or intercepts typing keystrokes.
 */

import { getAudioSettings, saveAudioSettings, type AudioSettings } from "./audioSettings"
export type { AudioSettings } from "./audioSettings"

class SoundManager {
  private ctx: AudioContext | null = null
  private resuming = false
  private get settings() { return getAudioSettings() }
  public saveSettings(settings: Partial<AudioSettings>) { saveAudioSettings(settings) }
  public getSettings(): AudioSettings { return getAudioSettings() }
  public suspend(): void { this.ctx?.suspend().catch(() => {}) }
  public cleanup(): void { this.ctx?.close().catch(() => {}); this.ctx = null }

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
        try { this.ctx = new AudioCtxClass() } catch { return null }
      }
    }

    // Resume if suspended by browser autoplay policy
    if (this.ctx && this.ctx.state === "suspended" && !this.resuming) {
      this.resuming = true
      this.ctx.resume().catch(() => {
        // Autoplay policy prevented immediate resume
      }).finally(() => { this.resuming = false })
    }

    return this.ctx
  }

  private getGain(): GainNode | null {
    if (!this.settings.enabled || this.settings.masterVolume * this.settings.sfxVolume <= 0) return null
    const ctx = this.getContext()
    if (!ctx) return null

    const effectiveVolume = this.settings.masterVolume * this.settings.sfxVolume
    if (effectiveVolume <= 0) return null

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(effectiveVolume, ctx.currentTime)
    gain.connect(ctx.destination)
    return gain
  }

  private chord(notes: number[], type: OscillatorType, amplitude: number, spacing: number, duration: number) {
    const gain = this.getGain(), ctx = this.ctx
    if (!gain || !ctx) return
    let remaining = notes.length
    notes.forEach((frequency, index) => {
      const osc = ctx.createOscillator(), envelope = ctx.createGain()
      const start = ctx.currentTime + index * spacing
      osc.type = type
      osc.frequency.setValueAtTime(frequency, start)
      envelope.gain.setValueAtTime(amplitude, start)
      envelope.gain.exponentialRampToValueAtTime(0.001, start + duration)
      osc.connect(envelope)
      envelope.connect(gain)
      osc.onended = () => { osc.disconnect(); envelope.disconnect(); if (--remaining === 0) gain.disconnect() }
      osc.start(start)
      osc.stop(start + duration)
    })
  }
  public playKeystroke(variation = 0): void { this.chord([700 + (variation % 10) * 15], "sine", 0.12, 0, 0.025) }
  public playTypo(): void { this.chord([140], "sawtooth", 0.15, 0, 0.07) }
  public playSentenceComplete(): void { this.chord([523.25, 659.25], "triangle", 0.18, 0.06, 0.12) }
  public playPersonalBest(): void { this.chord([880, 1108.73, 1318.51, 1760], "sine", 0.2, 0.07, 0.25) }
  public playBossPhaseShift(): void { this.chord([164.81, 220, 329.63], "sawtooth", 0.18, 0, 0.5) }
}
export const soundManager = new SoundManager()
