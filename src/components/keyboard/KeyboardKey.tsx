"use client"

import React from "react"
import { motion } from "framer-motion"
import { KeyMetadata, FINGER_COLORS } from "@/data/keyboardLayout"
import { KeyVisualState } from "@/types/keyboard"
import type { KeyboardSkinVisual } from "@/types/cosmetics"

export interface KeyboardKeyProps {
  meta: KeyMetadata
  state?: KeyVisualState
  isFingerActive?: boolean
  showHomeRowAnchors?: boolean
  isWeak?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
  skinVisual?: KeyboardSkinVisual
  effectIntensity?: "full" | "reduced" | "off"
}

export const KeyboardKey = React.memo(function KeyboardKey({
  meta,
  state = "neutral",
  isFingerActive = false,
  showHomeRowAnchors = true,
  isWeak = false,
  size = "md",
  className = "",
  skinVisual,
  effectIntensity = "full",
}: KeyboardKeyProps) {
  const fingerColor = FINGER_COLORS[meta.finger]

  // Sizing by width category
  const widthClasses = {
    normal: size === "sm" ? "w-8 h-9 text-xs" : size === "lg" ? "w-12 sm:w-14 h-13 sm:h-14 text-base" : "w-9 sm:w-11 h-10 sm:h-12 text-sm",
    wide: size === "sm" ? "w-12 h-9 text-[10px]" : size === "lg" ? "w-16 sm:w-20 h-13 sm:h-14 text-xs" : "w-14 sm:w-16 h-10 sm:h-12 text-xs",
    "extra-wide": size === "sm" ? "w-16 h-9 text-[10px]" : size === "lg" ? "w-22 sm:w-26 h-13 sm:h-14 text-xs" : "w-18 sm:w-22 h-10 sm:h-12 text-xs",
    space: size === "sm" ? "w-48 h-9 text-xs" : size === "lg" ? "w-72 sm:w-80 h-13 sm:h-14 text-sm" : "w-56 sm:w-68 h-10 sm:h-12 text-xs",
  }[meta.width || "normal"]

  // Visual appearance per state
  const defaultKeyBg = skinVisual?.keyBg ?? "bg-neutral-900/90"
  const defaultKeyText = skinVisual?.keyText ?? "text-white/70"
  const defaultKeyBorder = skinVisual?.keyBorder ?? "border-white/10"

  let stateClasses = `${defaultKeyBg} ${defaultKeyText} ${defaultKeyBorder} shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_3px_0_rgba(0,0,0,0.6)]`
  let auraGlow = ""
  let customStyle: React.CSSProperties | undefined = undefined

  const keyAura = skinVisual?.effects?.keyPressAura ?? skinVisual?.effects?.glowColor
  const hasAura = effectIntensity !== "off" && Boolean(keyAura)

  switch (state) {
    case "expected":
      stateClasses = skinVisual
        ? `${skinVisual.keyExpectedBg} z-10`
        : "bg-gradient-to-b from-orange-500 to-amber-600 text-black font-black border-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.8),inset_0_1px_0_rgba(255,255,255,0.4),0_2px_0_rgba(180,83,9,1)] z-10"
      if (effectIntensity !== "off") {
        auraGlow = "after:absolute after:inset-0 after:rounded-xl after:animate-ping after:bg-orange-400/30 after:pointer-events-none"
      }
      if (hasAura) {
        customStyle = {
          boxShadow: `0 0 20px ${keyAura}, inset 0 1px 0 rgba(255,255,255,0.4)`,
        }
      }
      break

    case "pressed":
      stateClasses = skinVisual
        ? `${skinVisual.keyPressedBg} translate-y-0.5 z-10`
        : "bg-orange-600 text-white font-black border-orange-400 translate-y-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] z-10"
      if (hasAura) {
        customStyle = {
          boxShadow: `0 0 18px ${keyAura}, inset 0 2px 4px rgba(0,0,0,0.5)`,
        }
      }
      break

    case "correct":
      stateClasses = skinVisual
        ? `${skinVisual.keyCorrectBg} z-10`
        : "bg-emerald-500 text-black font-black border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.7),inset_0_1px_0_rgba(255,255,255,0.3)] z-10"
      if (hasAura) {
        customStyle = {
          boxShadow: `0 0 16px ${keyAura}, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }
      }
      break

    case "incorrect":
      stateClasses = skinVisual
        ? `${skinVisual.keyIncorrectBg} ${effectIntensity !== "off" ? "animate-shake" : ""} z-10`
        : `bg-red-600 text-white font-black border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.8),inset_0_1px_0_rgba(255,255,255,0.3)] ${
            effectIntensity !== "off" ? "animate-shake" : ""
          } z-10`
      break

    case "weak":
      stateClasses =
        "bg-neutral-900/90 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(245,158,11,0.2),0_3px_0_rgba(0,0,0,0.6)]"
      break

    case "home-row":
      stateClasses = skinVisual
        ? `${defaultKeyBg} ${defaultKeyText} ${defaultKeyBorder} shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_0_rgba(0,0,0,0.6)]`
        : "bg-neutral-800/90 text-white/90 border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_0_rgba(0,0,0,0.6)]"
      break

    default:
      if (isFingerActive) {
        stateClasses = `${fingerColor.bg} ${fingerColor.text} ${fingerColor.border} font-bold shadow-[0_0_12px_${fingerColor.glow}]`
      }
      break
  }

  const label = meta.display ?? meta.key.toUpperCase()

  return (
    <motion.div
      layout={false}
      style={customStyle}
      className={`relative rounded-xl border flex flex-col items-center justify-center font-mono font-bold select-none cursor-default transition-all duration-100 ${widthClasses} ${stateClasses} ${auraGlow} ${className}`}
      whileTap={{ scale: 0.96, y: 1 }}
    >
      <span className="leading-none tracking-tight">{label}</span>

      {/* Tactile bump marker on Home Row index keys F and J */}
      {showHomeRowAnchors && meta.hasBump && (
        <span
          className={`w-3.5 h-0.5 rounded-full mt-1 ${
            state === "expected" || state === "correct" ? "bg-black/80" : "bg-white/60"
          }`}
          title="Tactile Guide Bump"
        />
      )}

      {/* Weak key marker indicator */}
      {isWeak && state !== "expected" && (
        <span
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(245,158,11,1)]"
          title="Weak Key Focus"
        />
      )}
    </motion.div>
  )
})
