"use client"

import { FINGER_COLORS } from "@/data/keyboardLayout"

export function FingerGuide() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Left Hand */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <span className="text-xs font-black uppercase tracking-wider text-orange-400">
            Left Hand
          </span>
          <span className="text-[10px] text-white/40">Keys: A S D F</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <FingerRow finger="pinky" label="Pinky" keyLetter="A" color={FINGER_COLORS.pinky} />
          <FingerRow finger="ring" label="Ring" keyLetter="S" color={FINGER_COLORS.ring} />
          <FingerRow finger="middle" label="Middle" keyLetter="D" color={FINGER_COLORS.middle} />
          <FingerRow finger="index" label="Index" keyLetter="F" color={FINGER_COLORS.index} hasBump />
        </div>
      </div>

      {/* Right Hand */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
            Right Hand
          </span>
          <span className="text-[10px] text-white/40">Keys: J K L Ç</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <FingerRow finger="index" label="Index" keyLetter="J" color={FINGER_COLORS.index} hasBump />
          <FingerRow finger="middle" label="Middle" keyLetter="K" color={FINGER_COLORS.middle} />
          <FingerRow finger="ring" label="Ring" keyLetter="L" color={FINGER_COLORS.ring} />
          <FingerRow finger="pinky" label="Pinky" keyLetter="Ç" color={FINGER_COLORS.pinky} />
        </div>
      </div>
    </div>
  )
}

function FingerRow({
  label,
  keyLetter,
  color,
  hasBump = false,
}: {
  finger: string
  label: string
  keyLetter: string
  color: { bg: string; text: string; border: string }
  hasBump?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-black/30 border border-white/5">
      <span className="text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`w-7 h-7 rounded-md font-mono font-black flex items-center justify-center border text-xs ${color.bg} ${color.text} ${color.border}`}
        >
          {keyLetter}
        </span>
        {hasBump && (
          <span
            className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20"
            title="Physical guide ridge on keyboard"
          >
            BUMP
          </span>
        )}
      </div>
    </div>
  )
}
