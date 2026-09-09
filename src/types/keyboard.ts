/**
 * KeyForge Visual Keyboard Domain Types
 */

import { Hand, Finger } from "@/data/keyboardLayout"
import type { KeyboardSkinVisual } from "./cosmetics"

export type KeyVisualState =
  | "neutral"
  | "expected"
  | "pressed"
  | "correct"
  | "incorrect"
  | "weak"
  | "home-row"

export type KeyboardLayoutType = "pt-BR" | "en" | "ABNT2" | "ANSI"

export type FingerColorsMode = "full" | "subtle" | "off"
export type HandGuideMode = "full" | "subtle" | "off"

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
  fingerColors?: FingerColorsMode
  showHandsGuide?: boolean
  handGuideMode?: HandGuideMode
  showHomeRowAnchors?: boolean
  showFingerLegend?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
  skinVisual?: KeyboardSkinVisual
}

