"use client"

import React from "react"
import { motion } from "framer-motion"
import { Finger, FINGER_PALETTE } from "@/lib/keyboard/fingerMap"
import { useI18n } from "@/lib/i18n/i18nContext"

export interface FingerLegendProps {
  activeFinger?: Finger | null
  compact?: boolean
  className?: string
  onSelectFinger?: (finger: Finger) => void
}

const ORDERED_FINGERS: Finger[] = [
  "leftPinky",
  "leftRing",
  "leftMiddle",
  "leftIndex",
  "thumb",
  "rightIndex",
  "rightMiddle",
  "rightRing",
  "rightPinky",
]

export const FingerLegend = React.memo(function FingerLegend({
  activeFinger = null,
  compact = false,
  className = "",
  onSelectFinger,
}: FingerLegendProps) {
  const { locale, t } = useI18n()
  const lang = locale === "en" ? "en" : "pt-BR"

  return (
    <div
      className={`w-full max-w-2xl flex items-center justify-center flex-wrap gap-1 sm:gap-1.5 md:gap-2 select-none px-1 ${className}`}
      role="region"
      aria-label={t("keyboard.fingerLegendAria")}
    >
      {ORDERED_FINGERS.map((finger) => {
        const config = FINGER_PALETTE[finger]
        if (!config) return null

        const isActive = activeFinger === finger
        const displayName = config.name[lang]

        return (
          <motion.div
            key={finger}
            role={onSelectFinger ? "button" : undefined}
            tabIndex={onSelectFinger ? 0 : undefined}
            aria-pressed={onSelectFinger ? isActive : undefined}
            onClick={() => onSelectFinger?.(finger)}
            onKeyDown={
              onSelectFinger
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      onSelectFinger(finger)
                    }
                  }
                : undefined
            }
            animate={{
              scale: isActive ? 1.05 : 1,
              opacity: activeFinger && !isActive ? 0.45 : 1,
            }}
            transition={{ duration: 0.15 }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              isActive
                ? "bg-white/15 shadow-md"
                : "bg-white/[0.03] hover:bg-white/10"
            } ${onSelectFinger ? "cursor-pointer" : "cursor-default"}`}
            style={{
              borderColor: isActive ? config.hex : "rgba(255, 255, 255, 0.08)",
              boxShadow: isActive ? `0 0 10px ${config.glow}` : undefined,
            }}
          >
            <span
              className={`rounded-full shrink-0 ${
                compact ? "w-1.5 h-1.5" : "w-1.5 sm:w-2 h-1.5 sm:h-2"
              } ${isActive ? "animate-pulse" : ""}`}
              style={{ backgroundColor: config.hex }}
            />
            <span
              className={`font-mono text-[9px] sm:text-[11px] font-bold tracking-tight whitespace-nowrap ${
                isActive ? "text-white" : "text-white/60"
              }`}
            >
              {displayName}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
})
