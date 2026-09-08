/**
 * KeyForge Visual Keyboard Domain Types
 */

import { Hand, Finger } from "@/data/keyboardLayout"

export type KeyVisualState =
  | "neutral"
  | "expected"
  | "pressed"
  | "correct"
  | "incorrect"
  | "weak"
  | "home-row"

export type KeyboardLayoutType = "pt-BR" | "en"

export type KeyWidth = "normal" | "wide" | "extra-wide" | "space"

export interface KeyDefinition {
  key: string
  display?: string
  hand: Hand
  finger: Finger
  width?: KeyWidth
  isHomeRow?: boolean
  hasBump?: boolean
  isModifier?: boolean
}

export interface TypingKeyboardProps {
  expectedKey?: string | null
  pressedKey?: string | null
  lastErrorKey?: string | null
  weakKeys?: string[]
  layout?: KeyboardLayoutType
  highlightFinger?: boolean
  showHomeRowAnchors?: boolean
  showFingerLegend?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}
