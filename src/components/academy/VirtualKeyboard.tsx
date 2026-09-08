"use client"

import React from "react"
import { TypingKeyboard } from "@/components/keyboard/TypingKeyboard"
import { useI18n } from "@/lib/i18n/i18nContext"

export interface VirtualKeyboardProps {
  activeKey?: string | null
  lastErrorKey?: string | null
  highlightFinger?: boolean
  showHomeRowAnchors?: boolean
  className?: string
  layout?: "pt-BR" | "en"
}

export function VirtualKeyboard({
  activeKey = null,
  lastErrorKey = null,
  highlightFinger = true,
  showHomeRowAnchors = true,
  className = "",
  layout: propLayout,
}: VirtualKeyboardProps) {
  const { locale } = useI18n()
  const layout = propLayout ?? (locale === "en" ? "en" : "pt-BR")

  return (
    <TypingKeyboard
      expectedKey={activeKey}
      lastErrorKey={lastErrorKey}
      highlightFinger={highlightFinger}
      showHomeRowAnchors={showHomeRowAnchors}
      showFingerLegend={highlightFinger}
      className={className}
      layout={layout}
    />
  )
}
