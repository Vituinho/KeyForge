"use client"

import React from "react"
import { TypingKeyboard } from "@/components/keyboard/TypingKeyboard"
import { useI18n } from "@/lib/i18n/i18nContext"

import { FingerColorsMode, HandGuideMode, KeyboardLayoutType } from "@/types/keyboard"

export interface VirtualKeyboardProps {
  activeKey?: string | null
  pressedKey?: string | null
  lastErrorKey?: string | null
  highlightFinger?: boolean
  showHomeRowAnchors?: boolean
  showHandsGuide?: boolean
  fingerColors?: FingerColorsMode
  handGuideMode?: HandGuideMode
  className?: string
  size?: "sm" | "md" | "lg"
  showFingerLegend?: boolean
  layout?: KeyboardLayoutType
}

export const VirtualKeyboard = React.memo(function VirtualKeyboard({
  activeKey = null,
  pressedKey = null,
  lastErrorKey = null,
  highlightFinger = true,
  showHomeRowAnchors = true,
  showHandsGuide = true,
  fingerColors = "full",
  handGuideMode = "full",
  className = "",
  size = "md",
  showFingerLegend = highlightFinger,
  layout: propLayout,
}: VirtualKeyboardProps) {
  const { locale } = useI18n()
  const layout = propLayout ?? (locale === "en" ? "en" : "pt-BR")

  return (
    <TypingKeyboard
      expectedKey={activeKey}
      pressedKey={pressedKey}
      lastErrorKey={lastErrorKey}
      highlightFinger={highlightFinger}
      fingerColors={fingerColors}
      showHandsGuide={showHandsGuide}
      handGuideMode={handGuideMode}
      showHomeRowAnchors={showHomeRowAnchors}
      showFingerLegend={showFingerLegend}
      size={size}
      className={className}
      layout={layout}
    />
  )
})
