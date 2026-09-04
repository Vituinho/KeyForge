"use client"

import {
  KEYBOARD_ROWS,
  FINGER_COLORS,
  KeyMetadata,
  getKeyMetadata,
} from "@/data/keyboardLayout"

interface VirtualKeyboardProps {
  activeKey?: string | null
  lastErrorKey?: string | null
  highlightFinger?: boolean
  showHomeRowAnchors?: boolean
  className?: string
}

export function VirtualKeyboard({
  activeKey = null,
  lastErrorKey = null,
  highlightFinger = true,
  showHomeRowAnchors = true,
  className = "",
}: VirtualKeyboardProps) {
  const normalizedActive = activeKey ? activeKey.toLowerCase() : null
  const normalizedError = lastErrorKey ? lastErrorKey.toLowerCase() : null
  const activeMeta = normalizedActive ? getKeyMetadata(normalizedActive) : null

  return (
    <div
      className={`flex flex-col items-center gap-1.5 p-4 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-md select-none ${className}`}
    >
      {/* 3 standard letter rows */}
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1.5 justify-center w-full">
          {row.map((meta) => (
            <KeyCap
              key={meta.key}
              meta={meta}
              isActive={normalizedActive === meta.key}
              isError={normalizedError === meta.key}
              isFingerActive={
                Boolean(
                  highlightFinger &&
                  activeMeta &&
                  activeMeta.finger === meta.finger &&
                  activeMeta.hand === meta.hand
                )
              }
              showHomeRowAnchors={showHomeRowAnchors}
            />
          ))}
        </div>
      ))}

      {/* Space bar row */}
      <div className="flex gap-1.5 justify-center w-full mt-0.5">
        <div
          className={`h-11 w-64 rounded-xl flex items-center justify-center font-mono text-xs font-bold transition-all relative ${
            normalizedActive === " "
              ? "bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.6)] scale-[1.02] border border-orange-400"
              : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
          }`}
        >
          <span>SPACE</span>
          <span className="absolute bottom-1 text-[9px] text-white/30 font-normal">
            Thumbs
          </span>
        </div>
      </div>

      {/* Active Finger/Hand Status Bar */}
      {activeMeta && (
        <div className="mt-3 flex items-center gap-2 text-xs text-white/60 bg-white/5 px-3 py-1 rounded-full border border-white/10">
          <span className="capitalize font-bold text-white">
            {activeMeta.hand} Hand:
          </span>
          <span
            className="capitalize font-black"
            style={{
              color:
                activeMeta.finger === "pinky"
                  ? "#fb7185"
                  : activeMeta.finger === "ring"
                    ? "#fbbf24"
                    : activeMeta.finger === "middle"
                      ? "#34d399"
                      : activeMeta.finger === "index"
                        ? "#22d3ee"
                        : "#a78bfa",
            }}
          >
            {activeMeta.finger} Finger
          </span>
          <span className="text-white/30">→</span>
          <span className="font-mono font-black text-white px-1.5 py-0.2 rounded bg-white/10">
            {activeMeta.display ?? activeMeta.key.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}

function KeyCap({
  meta,
  isActive,
  isError,
  isFingerActive,
  showHomeRowAnchors,
}: {
  meta: KeyMetadata
  isActive: boolean
  isError: boolean
  isFingerActive: boolean
  showHomeRowAnchors: boolean
}) {
  const fingerColor = FINGER_COLORS[meta.finger]

  let styleClasses = "bg-white/5 text-white/70 border-white/10"
  let transformClasses = ""

  if (isError) {
    styleClasses = "bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse"
    transformClasses = "scale-105"
  } else if (isActive) {
    styleClasses = "bg-orange-500 text-black border-orange-300 font-black shadow-[0_0_20px_rgba(249,115,22,0.8)]"
    transformClasses = "scale-105 z-10"
  } else if (isFingerActive) {
    styleClasses = `${fingerColor.bg} ${fingerColor.text} ${fingerColor.border} font-bold shadow-[0_0_10px_${fingerColor.glow}]`
  }

  return (
    <div
      className={`relative w-10 sm:w-12 h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center font-mono text-sm border transition-all ${styleClasses} ${transformClasses}`}
    >
      <span className="text-sm font-bold uppercase">
        {meta.display ?? meta.key}
      </span>

      {/* Tactile bump marker for Home Row anchor keys F and J */}
      {showHomeRowAnchors && meta.hasBump && (
        <span
          className={`w-3.5 h-0.5 rounded-full mt-0.5 ${
            isActive ? "bg-black" : "bg-white/60"
          }`}
          title="Physical guide bump"
        />
      )}

      {/* Home Row subtle indicator dot */}
      {showHomeRowAnchors && meta.isHomeRow && !meta.hasBump && (
        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white/20" />
      )}
    </div>
  )
}
