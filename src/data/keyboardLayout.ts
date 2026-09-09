import { Finger as TouchFinger, Hand } from "@/lib/keyboard/fingerMap"

export type { Hand }
export type Finger = TouchFinger | "pinky" | "ring" | "middle" | "index"

export interface KeyMetadata {
  key: string
  display?: string
  hand: Hand
  finger: Finger
  isHomeRow?: boolean
  hasBump?: boolean // F and J tactile markers
  width?: "normal" | "wide" | "extra-wide" | "space"
  isModifier?: boolean
}

export const FINGER_COLORS: Record<
  Finger,
  { bg: string; text: string; border: string; glow: string; hex: string }
> = {
  leftPinky: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40", glow: "rgba(231, 76, 60, 0.4)", hex: "#e74c3c" },
  leftRing: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40", glow: "rgba(230, 126, 34, 0.4)", hex: "#e67e22" },
  leftMiddle: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/40", glow: "rgba(241, 196, 15, 0.4)", hex: "#f1c40f" },
  leftIndex: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40", glow: "rgba(46, 204, 113, 0.4)", hex: "#2ecc71" },
  rightIndex: { bg: "bg-sky-500/20", text: "text-sky-400", border: "border-sky-500/40", glow: "rgba(52, 152, 219, 0.4)", hex: "#3498db" },
  rightMiddle: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/40", glow: "rgba(99, 102, 241, 0.4)", hex: "#6366f1" },
  rightRing: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/40", glow: "rgba(168, 85, 247, 0.4)", hex: "#a855f7" },
  rightPinky: { bg: "bg-pink-500/20", text: "text-pink-400", border: "border-pink-500/40", glow: "rgba(236, 72, 153, 0.4)", hex: "#ec4899" },
  thumb: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/40", glow: "rgba(148, 163, 184, 0.4)", hex: "#94a3b8" },
  // Backward compatibility aliases
  pinky: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/40", glow: "rgba(231, 76, 60, 0.4)", hex: "#e74c3c" },
  ring: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40", glow: "rgba(230, 126, 34, 0.4)", hex: "#e67e22" },
  middle: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/40", glow: "rgba(241, 196, 15, 0.4)", hex: "#f1c40f" },
  index: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40", glow: "rgba(46, 204, 113, 0.4)", hex: "#2ecc71" },
}

// ----------------------------------------------------
// PT-BR Layout (ABNT2 / KeyForge Standard)
// ----------------------------------------------------
export const LAYOUT_PT_BR: KeyMetadata[][] = [
  // Row 1: Tab, Q W E R T Y U I O P, Backspace
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
  // Row 2: A S D F G H J K L Ç, Enter
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
  // Row 3: Shift, Z X C V B N M , . ;, Shift
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
  // Row 4: Space
  [
    { key: " ", display: "SPACE", hand: "thumb", finger: "thumb", width: "space" },
  ],
]

// ----------------------------------------------------
// EN Layout (ANSI Standard)
// ----------------------------------------------------
export const LAYOUT_EN: KeyMetadata[][] = [
  // Row 1: Tab, Q W E R T Y U I O P, Backspace
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
  // Row 2: A S D F G H J K L ;, Enter
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
  // Row 3: Shift, Z X C V B N M , . /, Shift
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
  // Row 4: Space
  [
    { key: " ", display: "SPACE", hand: "thumb", finger: "thumb", width: "space" },
  ],
]

// Legacy rows alias for backwards compatibility
export const KEYBOARD_ROWS = LAYOUT_PT_BR.slice(0, 3)

// Helper lookup mapping lowercase char -> KeyMetadata
export const KEY_METADATA_MAP: Record<string, KeyMetadata> = {}

// Register all keys from both layouts
for (const layout of [LAYOUT_PT_BR, LAYOUT_EN]) {
  for (const row of layout) {
    for (const meta of row) {
      KEY_METADATA_MAP[meta.key.toLowerCase()] = meta
    }
  }
}

// Special alias mappings for accents and aliases
KEY_METADATA_MAP["ç"] = {
  key: "ç",
  display: "Ç",
  hand: "right",
  finger: "rightPinky",
  isHomeRow: true,
}
KEY_METADATA_MAP[" "] = {
  key: " ",
  display: "SPACE",
  hand: "thumb",
  finger: "thumb",
  width: "space",
}

export function getKeyMetadata(char: string): KeyMetadata | undefined {
  if (!char) return undefined
  return KEY_METADATA_MAP[char.toLowerCase()]
}
