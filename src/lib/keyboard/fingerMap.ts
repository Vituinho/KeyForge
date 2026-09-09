/**
 * KeyForge Centralized Touch Typing Finger Mapping System
 * 
 * Maps every keyboard key to its designated hand and finger for authentic
 * touch typing instruction across ABNT2 (PT-BR) and ANSI (EN) layouts.
 */

export type Finger =
  | "leftPinky"
  | "leftRing"
  | "leftMiddle"
  | "leftIndex"
  | "rightIndex"
  | "rightMiddle"
  | "rightRing"
  | "rightPinky"
  | "thumb"

export type Hand = "left" | "right" | "thumb"

export type KeyboardLayoutId = "ABNT2" | "ANSI"

export interface FingerInfo {
  key: string
  display?: string
  hand: Hand
  finger: Finger
  isHomeRow?: boolean
  hasBump?: boolean
  width?: "normal" | "wide" | "extra-wide" | "space"
  isModifier?: boolean
}

export interface FingerColorConfig {
  name: { en: string; "pt-BR": string }
  hex: string
  bg: string
  text: string
  border: string
  glow: string
}

export const FINGER_PALETTE: Record<Finger, FingerColorConfig> = {
  leftPinky: {
    name: { en: "Left Pinky", "pt-BR": "Mindinho Esquerdo" },
    hex: "#e74c3c", // Coral Red
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
    glow: "rgba(231, 76, 60, 0.4)",
  },
  leftRing: {
    name: { en: "Left Ring", "pt-BR": "Anelar Esquerdo" },
    hex: "#e67e22", // Amber Orange
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/30",
    glow: "rgba(230, 126, 34, 0.4)",
  },
  leftMiddle: {
    name: { en: "Left Middle", "pt-BR": "Médio Esquerdo" },
    hex: "#f1c40f", // Gold Yellow
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    glow: "rgba(241, 196, 15, 0.4)",
  },
  leftIndex: {
    name: { en: "Left Index", "pt-BR": "Indicador Esquerdo" },
    hex: "#2ecc71", // Lime Green
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    glow: "rgba(46, 204, 113, 0.4)",
  },
  rightIndex: {
    name: { en: "Right Index", "pt-BR": "Indicador Direito" },
    hex: "#3498db", // Sky Blue
    bg: "bg-sky-500/20",
    text: "text-sky-400",
    border: "border-sky-500/30",
    glow: "rgba(52, 152, 219, 0.4)",
  },
  rightMiddle: {
    name: { en: "Right Middle", "pt-BR": "Médio Direito" },
    hex: "#6366f1", // Indigo
    bg: "bg-indigo-500/20",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    glow: "rgba(99, 102, 241, 0.4)",
  },
  rightRing: {
    name: { en: "Right Ring", "pt-BR": "Anelar Direito" },
    hex: "#a855f7", // Violet
    bg: "bg-purple-500/20",
    text: "text-purple-400",
    border: "border-purple-500/30",
    glow: "rgba(168, 85, 247, 0.4)",
  },
  rightPinky: {
    name: { en: "Right Pinky", "pt-BR": "Mindinho Direito" },
    hex: "#ec4899", // Pink
    bg: "bg-pink-500/20",
    text: "text-pink-400",
    border: "border-pink-500/30",
    glow: "rgba(236, 72, 153, 0.4)",
  },
  thumb: {
    name: { en: "Thumb", "pt-BR": "Polegar" },
    hex: "#94a3b8", // Slate
    bg: "bg-slate-500/20",
    text: "text-slate-400",
    border: "border-slate-500/30",
    glow: "rgba(148, 163, 184, 0.4)",
  },
}

// ----------------------------------------------------
// ABNT2 (PT-BR) Standard Mapping
// ----------------------------------------------------
export const ABNT2_KEY_ROWS: FingerInfo[][] = [
  // Row 1
  [
    { key: "Tab", display: "TAB", hand: "left", finger: "leftPinky", width: "wide", isModifier: true },
    { key: "q", hand: "left", finger: "leftPinky" },
    { key: "w", hand: "left", finger: "leftRing" },
    { key: "e", hand: "left", finger: "leftMiddle" },
    { key: "r", hand: "left", finger: "leftIndex" },
    { key: "t", hand: "left", finger: "leftIndex" },
    { key: "y", hand: "right", finger: "rightIndex" },
    { key: "u", hand: "right", finger: "rightIndex" },
    { key: "i", hand: "right", finger: "rightMiddle" },
    { key: "o", hand: "right", finger: "rightRing" },
    { key: "p", hand: "right", finger: "rightPinky" },
    { key: "Backspace", display: "⌫", hand: "right", finger: "rightPinky", width: "wide", isModifier: true },
  ],
  // Row 2 (Home Row)
  [
    { key: "a", hand: "left", finger: "leftPinky", isHomeRow: true },
    { key: "s", hand: "left", finger: "leftRing", isHomeRow: true },
    { key: "d", hand: "left", finger: "leftMiddle", isHomeRow: true },
    { key: "f", hand: "left", finger: "leftIndex", isHomeRow: true, hasBump: true },
    { key: "g", hand: "left", finger: "leftIndex" },
    { key: "h", hand: "right", finger: "rightIndex" },
    { key: "j", hand: "right", finger: "rightIndex", isHomeRow: true, hasBump: true },
    { key: "k", hand: "right", finger: "rightMiddle", isHomeRow: true },
    { key: "l", hand: "right", finger: "rightRing", isHomeRow: true },
    { key: "ç", display: "Ç", hand: "right", finger: "rightPinky", isHomeRow: true },
    { key: "Enter", display: "↵ ENTER", hand: "right", finger: "rightPinky", width: "wide", isModifier: true },
  ],
  // Row 3
  [
    { key: "ShiftLeft", display: "⇧ SHIFT", hand: "left", finger: "leftPinky", width: "wide", isModifier: true },
    { key: "z", hand: "left", finger: "leftPinky" },
    { key: "x", hand: "left", finger: "leftRing" },
    { key: "c", hand: "left", finger: "leftMiddle" },
    { key: "v", hand: "left", finger: "leftIndex" },
    { key: "b", hand: "left", finger: "leftIndex" },
    { key: "n", hand: "right", finger: "rightIndex" },
    { key: "m", hand: "right", finger: "rightIndex" },
    { key: ",", display: ",", hand: "right", finger: "rightMiddle" },
    { key: ".", display: ".", hand: "right", finger: "rightRing" },
    { key: ";", display: ";", hand: "right", finger: "rightPinky" },
    { key: "ShiftRight", display: "⇧", hand: "right", finger: "rightPinky", width: "wide", isModifier: true },
  ],
  // Row 4
  [
    { key: " ", display: "SPACE", hand: "thumb", finger: "thumb", width: "space" },
  ],
]

// ----------------------------------------------------
// ANSI (EN) Standard Mapping
// ----------------------------------------------------
export const ANSI_KEY_ROWS: FingerInfo[][] = [
  // Row 1
  [
    { key: "Tab", display: "TAB", hand: "left", finger: "leftPinky", width: "wide", isModifier: true },
    { key: "q", hand: "left", finger: "leftPinky" },
    { key: "w", hand: "left", finger: "leftRing" },
    { key: "e", hand: "left", finger: "leftMiddle" },
    { key: "r", hand: "left", finger: "leftIndex" },
    { key: "t", hand: "left", finger: "leftIndex" },
    { key: "y", hand: "right", finger: "rightIndex" },
    { key: "u", hand: "right", finger: "rightIndex" },
    { key: "i", hand: "right", finger: "rightMiddle" },
    { key: "o", hand: "right", finger: "rightRing" },
    { key: "p", hand: "right", finger: "rightPinky" },
    { key: "Backspace", display: "⌫", hand: "right", finger: "rightPinky", width: "wide", isModifier: true },
  ],
  // Row 2 (Home Row)
  [
    { key: "a", hand: "left", finger: "leftPinky", isHomeRow: true },
    { key: "s", hand: "left", finger: "leftRing", isHomeRow: true },
    { key: "d", hand: "left", finger: "leftMiddle", isHomeRow: true },
    { key: "f", hand: "left", finger: "leftIndex", isHomeRow: true, hasBump: true },
    { key: "g", hand: "left", finger: "leftIndex" },
    { key: "h", hand: "right", finger: "rightIndex" },
    { key: "j", hand: "right", finger: "rightIndex", isHomeRow: true, hasBump: true },
    { key: "k", hand: "right", finger: "rightMiddle", isHomeRow: true },
    { key: "l", hand: "right", finger: "rightRing", isHomeRow: true },
    { key: ";", display: ";", hand: "right", finger: "rightPinky", isHomeRow: true },
    { key: "Enter", display: "↵ ENTER", hand: "right", finger: "rightPinky", width: "wide", isModifier: true },
  ],
  // Row 3
  [
    { key: "ShiftLeft", display: "⇧ SHIFT", hand: "left", finger: "leftPinky", width: "wide", isModifier: true },
    { key: "z", hand: "left", finger: "leftPinky" },
    { key: "x", hand: "left", finger: "leftRing" },
    { key: "c", hand: "left", finger: "leftMiddle" },
    { key: "v", hand: "left", finger: "leftIndex" },
    { key: "b", hand: "left", finger: "leftIndex" },
    { key: "n", hand: "right", finger: "rightIndex" },
    { key: "m", hand: "right", finger: "rightIndex" },
    { key: ",", display: ",", hand: "right", finger: "rightMiddle" },
    { key: ".", display: ".", hand: "right", finger: "rightRing" },
    { key: "/", display: "/", hand: "right", finger: "rightPinky" },
    { key: "ShiftRight", display: "⇧", hand: "right", finger: "rightPinky", width: "wide", isModifier: true },
  ],
  // Row 4
  [
    { key: " ", display: "SPACE", hand: "thumb", finger: "thumb", width: "space" },
  ],
]

// ----------------------------------------------------
// Lookup Table Compilation
// ----------------------------------------------------
const ABNT2_MAP = new Map<string, FingerInfo>()
const ANSI_MAP = new Map<string, FingerInfo>()

function populateMap(targetMap: Map<string, FingerInfo>, rows: FingerInfo[][]) {
  for (const row of rows) {
    for (const info of row) {
      targetMap.set(info.key.toLowerCase(), info)
    }
  }
}

populateMap(ABNT2_MAP, ABNT2_KEY_ROWS)
populateMap(ANSI_MAP, ANSI_KEY_ROWS)

// Additional key mappings (numbers, symbols, punctuation, and accented aliases)
const COMMON_ADDITIONAL_KEYS: Array<{ keys: string[]; info: Omit<FingerInfo, "key"> }> = [
  // Numbers & Symbols Left Hand
  { keys: ["1", "!"], info: { hand: "left", finger: "leftPinky" } },
  { keys: ["2", "@"], info: { hand: "left", finger: "leftRing" } },
  { keys: ["3", "#"], info: { hand: "left", finger: "leftMiddle" } },
  { keys: ["4", "$", "5", "%"], info: { hand: "left", finger: "leftIndex" } },

  // Numbers & Symbols Right Hand
  { keys: ["6", "^", "7", "&"], info: { hand: "right", finger: "rightIndex" } },
  { keys: ["8", "*"], info: { hand: "right", finger: "rightMiddle" } },
  { keys: ["9", "("], info: { hand: "right", finger: "rightRing" } },
  { keys: ["0", ")", "-", "_", "=", "+", "[", "{", "]", "}", "\\", "|", "'", "\"", ":"], info: { hand: "right", finger: "rightPinky" } },

  // Accented character mappings for PT-BR
  { keys: ["á", "à", "ã", "â"], info: { hand: "left", finger: "leftPinky", isHomeRow: true } },
  { keys: ["é", "ê"], info: { hand: "left", finger: "leftMiddle" } },
  { keys: ["í"], info: { hand: "right", finger: "rightMiddle" } },
  { keys: ["ó", "õ", "ô"], info: { hand: "right", finger: "rightRing" } },
  { keys: ["ú", "ü"], info: { hand: "right", finger: "rightIndex" } },
  { keys: ["ç"], info: { hand: "right", finger: "rightPinky", isHomeRow: true } },
]

for (const entry of COMMON_ADDITIONAL_KEYS) {
  for (const k of entry.keys) {
    const info: FingerInfo = { key: k, ...entry.info }
    if (!ABNT2_MAP.has(k)) ABNT2_MAP.set(k, info)
    if (!ANSI_MAP.has(k)) ANSI_MAP.set(k, info)
  }
}

/**
 * Returns touch typing finger information for a given key in the specified layout.
 */
export function getFingerForKey(
  key: string | null | undefined,
  layout: KeyboardLayoutId = "ABNT2"
): FingerInfo | null {
  if (!key) return null
  const normalized = key.toLowerCase()
  const map = layout === "ANSI" ? ANSI_MAP : ABNT2_MAP
  return map.get(normalized) ?? null
}

/**
 * Returns which hand is responsible for a finger.
 */
export function getHandForFinger(finger: Finger): Hand {
  if (finger === "thumb") return "thumb"
  return finger.startsWith("left") ? "left" : "right"
}

export function isLeftHand(finger: Finger): boolean {
  return finger.startsWith("left")
}

export function isRightHand(finger: Finger): boolean {
  return finger.startsWith("right")
}

/**
 * Resolves standard default keyboard layout from application locale.
 */
export function resolveDefaultLayout(locale: string): KeyboardLayoutId {
  return locale === "en" ? "ANSI" : "ABNT2"
}
