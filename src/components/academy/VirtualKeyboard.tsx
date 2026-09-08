"use client"

import React from "react"
import { TypingKeyboard } from "@/components/keyboard/TypingKeyboard"

export interface VirtualKeyboardProps {
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
  return (
    <TypingKeyboard
      expectedKey={activeKey}
      lastErrorKey={lastErrorKey}
      highlightFinger={highlightFinger}
      showHomeRowAnchors={showHomeRowAnchors}
      showFingerLegend={highlightFinger}
      className={className}
    />
  )
}
