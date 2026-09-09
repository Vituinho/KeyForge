"use client"

import React, { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Finger,
  KeyboardLayoutId,
  getFingerForKey,
  FINGER_PALETTE,
} from "@/lib/keyboard/fingerMap"
import { HandGuideMode, KeyboardLayoutType } from "@/types/keyboard"
import { TypingHand } from "./TypingHand"
import { useI18n } from "@/lib/i18n/i18nContext"

export interface KeyboardHandsProps {
  expectedKey?: string | null
  activeFinger?: Finger | null
  layout?: KeyboardLayoutType
  mode?: HandGuideMode
  size?: "sm" | "md" | "lg"
  showStatusHud?: boolean
  className?: string
}

export const KeyboardHands = React.memo(function KeyboardHands({
  expectedKey = null,
  activeFinger: propActiveFinger = null,
  layout = "pt-BR",
  mode = "full",
  size = "md",
  showStatusHud = true,
  className = "",
}: KeyboardHandsProps) {
  const { t, locale } = useI18n()
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  const normalizedLayout: KeyboardLayoutId =
    layout === "en" || layout === "ANSI" ? "ANSI" : "ABNT2"

  const activeFingerInfo = useMemo(() => {
    if (propActiveFinger) return null
    return getFingerForKey(expectedKey, normalizedLayout)
  }, [expectedKey, propActiveFinger, normalizedLayout])

  const currentFinger: Finger | null =
    propActiveFinger ?? activeFingerInfo?.finger ?? null

  if (mode === "off") {
    return null
  }

  const lang = locale === "en" ? "en" : "pt-BR"
  const fingerConfig = currentFinger ? FINGER_PALETTE[currentFinger] : null
  const fingerName = fingerConfig ? fingerConfig.name[lang] : null

  return (
    <div
      className={`w-full flex flex-col items-center select-none ${className}`}
      aria-label={t("keyboard.handsGuide")}
    >
      <div className="w-full max-w-2xl flex items-center justify-between gap-2 sm:gap-6 px-2 sm:px-6">
        {/* Left Hand (positioned below ASDF zone) */}
        <div className="flex-1 flex justify-center sm:justify-start">
          <TypingHand
            hand="left"
            activeFinger={currentFinger}
            layout={layout}
            mode={mode}
            size={size}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Center Guidance HUD Pill */}
        {showStatusHud && (
          <div className="flex flex-col items-center justify-center max-w-[200px] sm:max-w-xs text-center px-2">
            <AnimatePresence mode="wait">
              {currentFinger && fingerConfig ? (
                <motion.div
                  key={`finger-${currentFinger}`}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: reducedMotion ? 0 : -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl bg-neutral-900/90 border border-white/10 shadow-lg backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
                      style={{
                        backgroundColor: fingerConfig.hex,
                        boxShadow: `0 0 10px ${fingerConfig.hex}`,
                      }}
                    />
                    <span className="text-[11px] sm:text-xs font-bold font-mono tracking-tight text-white">
                      {fingerName}
                    </span>
                  </div>

                  {expectedKey && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50">
                      <span>{t("keyboard.tactileBump") ? "Key" : "Tecla"}:</span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold border border-white/10 text-xs">
                        {expectedKey.toUpperCase()}
                      </span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="resting-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl bg-neutral-900/60 border border-white/5 backdrop-blur-sm"
                >
                  <span className="text-[10px] sm:text-[11px] font-bold text-white/60 font-mono">
                    {t("keyboard.homeRowRest")}
                  </span>
                  <span className="text-[9px] font-mono text-white/30 hidden sm:inline">
                    {t("keyboard.homeRowDesc")}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Right Hand (positioned below JKLÇ zone) */}
        <div className="flex-1 flex justify-center sm:justify-end">
          <TypingHand
            hand="right"
            activeFinger={currentFinger}
            layout={layout}
            mode={mode}
            size={size}
            reducedMotion={reducedMotion}
          />
        </div>
      </div>
    </div>
  )
})
