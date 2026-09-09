"use client"

import React, { useMemo } from "react"
import { LAYOUT_PT_BR, LAYOUT_EN, getKeyMetadata, FINGER_COLORS } from "@/data/keyboardLayout"
import { TypingKeyboardProps, KeyVisualState } from "@/types/keyboard"
import { useCosmetics } from "@/hooks/useCosmetics"
import { useI18n } from "@/lib/i18n/i18nContext"
import { KeyboardFrame } from "./KeyboardFrame"
import { KeyboardKey } from "./KeyboardKey"
import { KeyboardHands } from "./KeyboardHands"

function getFingerLabel(finger: string, t: (key: string) => string) {
  switch (finger) {
    case "pinky":
    case "leftPinky":
    case "rightPinky":
      return t("keyboard.fingerPinky")
    case "ring":
    case "leftRing":
    case "rightRing":
      return t("keyboard.fingerRing")
    case "middle":
    case "leftMiddle":
    case "rightMiddle":
      return t("keyboard.fingerMiddle")
    case "index":
    case "leftIndex":
    case "rightIndex":
      return t("keyboard.fingerIndex")
    case "thumb":
      return t("keyboard.fingerThumb")
    default:
      return finger
  }
}

export function TypingKeyboard({
  expectedKey = null,
  pressedKey = null,
  lastErrorKey = null,
  weakKeys = [],
  layout: propLayout,
  highlightFinger = false,
  fingerColors: propFingerColors,
  showHandsGuide: propShowHandsGuide,
  handGuideMode: propHandGuideMode,
  showHomeRowAnchors: propShowHomeRowAnchors,
  showFingerLegend = false,
  size = "md",
  className = "",
  skinVisual: propSkinVisual,
}: TypingKeyboardProps) {
  const { t, locale } = useI18n()
  const { equippedSkin, settings, updateSettings } = useCosmetics()
  const skinVisual = propSkinVisual ?? equippedSkin.visual
  const showHomeRowAnchors = propShowHomeRowAnchors ?? settings?.showHomeRowAnchors ?? true
  const showHandsGuide =
    propShowHandsGuide ?? (settings?.handGuide !== "off" && (settings?.showHandsGuide ?? false))
  const fingerColors = propFingerColors ?? settings?.fingerColors ?? "off"
  const handGuideMode = propHandGuideMode ?? settings?.handGuide ?? "full"

  // Decoupled layout preference: prop > settings > locale default
  const resolvedLayout =
    propLayout ??
    (settings?.keyboardLayout === "ABNT2"
      ? "ABNT2"
      : settings?.keyboardLayout === "ANSI"
      ? "ANSI"
      : locale === "en"
      ? "ANSI"
      : "ABNT2")

  const normalizedExpected = expectedKey ? expectedKey.toLowerCase() : null
  const normalizedPressed = pressedKey ? pressedKey.toLowerCase() : null
  const normalizedError = lastErrorKey ? lastErrorKey.toLowerCase() : null
  const weakSet = useMemo(
    () => new Set(weakKeys.map((k) => k.toLowerCase())),
    [weakKeys]
  )

  const isAnsi = resolvedLayout === "en" || resolvedLayout === "ANSI"
  const activeRows = isAnsi ? LAYOUT_EN : LAYOUT_PT_BR
  const expectedMeta = normalizedExpected ? getKeyMetadata(normalizedExpected) : null

  const layoutLabel = isAnsi ? "EN · ANSI" : "PT-BR · ABNT2"

  if (settings && !settings.showKeyboard) {
    return (
      <div className="flex justify-center py-1">
        <button
          type="button"
          onClick={() => updateSettings({ showKeyboard: true })}
          className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2 shadow-sm"
          title={t("keyboard.showKeyboard")}
        >
          <span>⌨️</span>
          <span>{t("keyboard.showKeyboard")}</span>
        </button>
      </div>
    )
  }

  return (
    <KeyboardFrame
      layoutName={layoutLabel}
      className={className}
      skinVisual={skinVisual}
      effectIntensity={settings?.effectIntensity ?? "full"}
      onToggleHide={() => updateSettings({ showKeyboard: false })}
    >
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
                fingerColors={fingerColors}
                showHomeRowAnchors={showHomeRowAnchors}
                isWeak={isWeak}
                size={size}
                skinVisual={skinVisual}
                effectIntensity={settings?.effectIntensity ?? "full"}
              />
            )
          })}
        </div>
      ))}

      {/* Optional Animated Touch Typing Hand Guide */}
      {showHandsGuide && (
        <div className="w-full mt-3 pt-3 border-t border-white/10">
          <KeyboardHands
            expectedKey={expectedKey}
            layout={resolvedLayout}
            mode={handGuideMode}
            showStatusHud={settings?.showFingerName ?? true}
            size={size === "lg" ? "md" : "sm"}
          />
        </div>
      )}

      {/* Optional Finger Legend for Academy */}
      {showFingerLegend && (settings?.showFingerName ?? true) && expectedMeta && (
        <div className="mt-3 flex items-center justify-center gap-3 text-xs text-white/60 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 font-mono">
          <span className="font-bold text-white">
            {expectedMeta.hand === "left" ? t("keyboard.handLeft") : t("keyboard.handRight")}:
          </span>
          <span
            className="font-black"
            style={{
              color: FINGER_COLORS[expectedMeta.finger]?.hex ?? "#a78bfa",
            }}
          >
            {getFingerLabel(expectedMeta.finger, t)}
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
