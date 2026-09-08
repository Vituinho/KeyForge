"use client"

import React, { useMemo } from "react"
import { LAYOUT_PT_BR, LAYOUT_EN, getKeyMetadata } from "@/data/keyboardLayout"
import { TypingKeyboardProps, KeyVisualState } from "@/types/keyboard"
import { useCosmetics } from "@/hooks/useCosmetics"
import { KeyboardFrame } from "./KeyboardFrame"
import { KeyboardKey } from "./KeyboardKey"

export function TypingKeyboard({
  expectedKey = null,
  pressedKey = null,
  lastErrorKey = null,
  weakKeys = [],
  layout = "pt-BR",
  highlightFinger = false,
  showHomeRowAnchors = true,
  showFingerLegend = false,
  size = "md",
  className = "",
  skinVisual: propSkinVisual,
}: TypingKeyboardProps) {
  const { equippedSkin, settings } = useCosmetics()
  const skinVisual = propSkinVisual ?? equippedSkin.visual

  const normalizedExpected = expectedKey ? expectedKey.toLowerCase() : null
  const normalizedPressed = pressedKey ? pressedKey.toLowerCase() : null
  const normalizedError = lastErrorKey ? lastErrorKey.toLowerCase() : null
  const weakSet = useMemo(
    () => new Set(weakKeys.map((k) => k.toLowerCase())),
    [weakKeys]
  )

  const activeRows = layout === "en" ? LAYOUT_EN : LAYOUT_PT_BR
  const expectedMeta = normalizedExpected ? getKeyMetadata(normalizedExpected) : null

  const layoutLabel = layout === "en" ? "EN · ANSI" : "PT-BR · ABNT2"

  if (settings && !settings.showKeyboard) {
    return null
  }

  return (
    <KeyboardFrame layoutName={layoutLabel} className={className} skinVisual={skinVisual}>
      {activeRows.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1 sm:gap-1.5 justify-center w-full">
          {row.map((meta) => {
            const keyLower = meta.key.toLowerCase()
            const isExpected = normalizedExpected === keyLower
            const isPressed = normalizedPressed === keyLower
            const isError = normalizedError === keyLower
            const isWeak = weakSet.has(keyLower)

            let state: KeyVisualState = "neutral"
            if (isError) {
              state = "incorrect"
            } else if (isPressed && isExpected) {
              state = "correct"
            } else if (isPressed) {
              state = "pressed"
            } else if (isExpected) {
              state = "expected"
            } else if (isWeak) {
              state = "weak"
            } else if (meta.isHomeRow) {
              state = "home-row"
            }

            const isFingerActive = Boolean(
              highlightFinger &&
                expectedMeta &&
                expectedMeta.finger === meta.finger &&
                expectedMeta.hand === meta.hand
            )

            return (
              <KeyboardKey
                key={`${meta.key}-${rowIdx}`}
                meta={meta}
                state={state}
                isFingerActive={isFingerActive}
                showHomeRowAnchors={showHomeRowAnchors}
                isWeak={isWeak}
                size={size}
                skinVisual={skinVisual}
              />
            )
          })}
        </div>
      ))}

      {/* Optional Finger Legend for Academy */}
      {showFingerLegend && expectedMeta && (
        <div className="mt-3 flex items-center justify-center gap-3 text-xs text-white/60 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 font-mono">
          <span className="capitalize font-bold text-white">
            {expectedMeta.hand} Hand:
          </span>
          <span
            className="capitalize font-black"
            style={{
              color:
                expectedMeta.finger === "pinky"
                  ? "#fb7185"
                  : expectedMeta.finger === "ring"
                  ? "#fbbf24"
                  : expectedMeta.finger === "middle"
                  ? "#34d399"
                  : expectedMeta.finger === "index"
                  ? "#22d3ee"
                  : "#a78bfa",
            }}
          >
            {expectedMeta.finger} Finger
          </span>
          <span className="text-white/30">→</span>
          <span className="font-mono font-black text-white px-2 py-0.5 rounded bg-white/15">
            {expectedMeta.display ?? expectedMeta.key.toUpperCase()}
          </span>
        </div>
      )}
    </KeyboardFrame>
  )
}
