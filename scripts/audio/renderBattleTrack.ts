/** Original score and synthesis. No samples, melodies or recordings from third parties. */
export const SAMPLE_RATE = 22050
export const SCORE_VERSION = 1
const families = [
  { tempo: 116, root: 50, tone: 0, scale: [0, 2, 3, 7, 10] },
  { tempo: 132, root: 45, tone: 1, scale: [0, 1, 5, 7, 10] },
  { tempo: 144, root: 48, tone: 2, scale: [0, 2, 3, 7, 9] },
  { tempo: 124, root: 55, tone: 3, scale: [0, 2, 4, 7, 9] },
  { tempo: 108, root: 43, tone: 4, scale: [0, 3, 5, 7, 10] },
  { tempo: 126, root: 50, tone: 5, scale: [0, 2, 3, 7, 8] },
  { tempo: 136, root: 47, tone: 6, scale: [0, 2, 5, 7, 10] },
]
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12)
const sine = (phase: number) => Math.sin(2 * Math.PI * phase)

export function renderBattleTrack(id: string, encounter: number) {
  const family = families[Math.floor(encounter / 8)]
  if (!family) throw new Error("Unknown soundtrack family")
  const stage = encounter % 8, boss = stage >= 6
  const tempo = family.tempo + stage * 2
  const beat = 60 / tempo
  const samples = Math.round(beat * 32 * SAMPLE_RATE)
  const mix = new Float32Array(samples)
  let seed = Array.from(id).reduce((value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0, 2166136261)
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296 }
  const root = family.root + [0, 2, -2, 0, 3, -2, -5, 0][stage]
  const progression = family.tone === 3 ? [0, -5, -3, -7] : [0, -4, -2, -5]

  function note(start: number, duration: number, midi: number, gain: number, instrument: "pad" | "lead" | "bass") {
    const offset = Math.round(start * SAMPLE_RATE), length = Math.round(duration * SAMPLE_RATE), frequency = hz(midi)
    for (let i = 0; i < length; i++) {
      const t = i / SAMPLE_RATE, position = i / length
      const envelope = Math.min(1, t / .015) * Math.min(1, (duration - t) / .065)
      const phase = frequency * t
      let wave: number
      if (instrument === "pad") wave = (sine(phase) + .3 * sine(phase * 1.002) + .15 * sine(phase * 2)) * .6 * Math.sin(Math.PI * position) ** .6
      else if (instrument === "bass") wave = (sine(phase) + .24 * sine(phase * 2) + .1 * sine(phase * 3)) * Math.exp(-position * 2)
      else {
        const brightness = family.tone === 3 ? .45 : .23
        wave = (sine(phase + .006 * sine(t * 5)) + brightness * sine(phase * 2) + .12 * sine(phase * 3)) * Math.exp(-position * (family.tone === 5 ? 5 : 2.8))
        if (family.tone === 4 || family.tone === 6) wave += .12 * sine(phase * 4.01) * Math.exp(-position * 7)
      }
      mix[(offset + i) % samples] += wave * envelope * gain
    }
  }
  function drum(start: number, kind: "kick" | "snare" | "hat", gain: number) {
    const duration = kind === "kick" ? .28 : kind === "snare" ? .14 : .055
    const offset = Math.round(start * SAMPLE_RATE)
    let previousNoise = 0
    for (let i = 0; i < duration * SAMPLE_RATE; i++) {
      const t = i / SAMPLE_RATE, noise = random() * 2 - 1
      const wave = kind === "kick" ? sine(48 * t + 1.7 * (1 - Math.exp(-t * 35))) * Math.exp(-t * 17)
        : kind === "snare" ? (noise * .7 + sine(175 * t) * .3) * Math.exp(-t * 32)
          : (noise - previousNoise) * .5 * Math.exp(-t * 75)
      previousNoise = noise
      mix[(offset + i) % samples] += wave * gain * Math.min(1, t / .002)
    }
  }
  const motif = Array.from({ length: 16 }, () => Math.floor(random() * family.scale.length))
  for (let bar = 0; bar < 8; bar++) {
    const chord = root + progression[Math.floor(bar / 2)], start = bar * beat * 4
    for (const interval of [0, family.tone === 3 ? 4 : 3, 7]) note(start, beat * 4, chord + interval + 12, boss ? .055 : .04, "pad")
    if (boss) note(start, beat * 4, chord + 24, .025, "pad")
    for (let step = 0; step < 8; step++) {
      const at = start + step * beat / 2
      note(at, beat * .43, chord - 12 + (step % 4 === 3 ? 7 : 0), .11, "bass")
      if (step % 2 === 0 || stage >= 2) {
        const degree = family.scale[motif[(step + bar % 2 * 8) % 16]]
        note(at, beat * (step === 7 ? .7 : .4), chord + 24 + degree, .085, "lead")
      }
      drum(at, "hat", step % 2 ? .025 : .035)
      if (step % 4 === 0 || (boss && step === 7)) drum(at, "kick", .22)
      if (step % 4 === 2) drum(at, "snare", .075)
    }
  }
  // Circular early reflections keep the tail inside the loop rather than cutting it off.
  const dry = mix.slice()
  for (const [delay, gain] of [[beat * .75, .17], [beat * 1.25, .09]]) {
    const offset = Math.round(delay * SAMPLE_RATE)
    for (let i = 0; i < samples; i++) mix[(i + offset) % samples] += dry[i] * gain
  }
  let peak = 0
  for (const value of mix) peak = Math.max(peak, Math.abs(value))
  const output = Buffer.alloc(44 + samples * 2)
  output.write("RIFF", 0); output.writeUInt32LE(output.length - 8, 4); output.write("WAVEfmt ", 8)
  output.writeUInt32LE(16, 16); output.writeUInt16LE(1, 20); output.writeUInt16LE(1, 22)
  output.writeUInt32LE(SAMPLE_RATE, 24); output.writeUInt32LE(SAMPLE_RATE * 2, 28)
  output.writeUInt16LE(2, 32); output.writeUInt16LE(16, 34); output.write("data", 36); output.writeUInt32LE(samples * 2, 40)
  for (let i = 0; i < samples; i++) {
    const edge = Math.min(1, i / 128, (samples - 1 - i) / 128)
    output.writeInt16LE(Math.round(Math.tanh(mix[i] / peak * .92) * 29000 * edge), 44 + i * 2)
  }
  return { audio: output, tempo, seconds: samples / SAMPLE_RATE, family: family.tone, boss, scoreVersion: SCORE_VERSION }
}
