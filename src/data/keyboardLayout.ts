export type Hand = "left" | "right" | "thumb"
export type Finger = "pinky" | "ring" | "middle" | "index" | "thumb"

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
  { bg: string; text: string; border: string; glow: string }
> = {
  pinky: {
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    border: "border-rose-500/30",
    glow: "rgba(244, 63, 94, 0.4)",
  },
  ring: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
    glow: "rgba(245, 158, 11, 0.4)",
  },
  middle: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    glow: "rgba(16, 185, 129, 0.4)",
  },
  index: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    glow: "rgba(6, 182, 212, 0.4)",
  },
  thumb: {
    bg: "bg-violet-500/20",
    text: "text-violet-400",
    border: "border-violet-500/30",
    glow: "rgba(139, 92, 246, 0.4)",
  },
}

// ----------------------------------------------------
// PT-BR Layout (ABNT2 / KeyForge Standard)
// ----------------------------------------------------
export const LAYOUT_PT_BR: KeyMetadata[][] = [
  // Row 1: Tab, Q W E R T Y U I O P, Backspace
  [
    { key: "Tab", display: "TAB", hand: "left", finger: "pinky", width: "wide", isModifier: true },
    { key: "q", hand: "left", finger: "pinky" },
    { key: "w", hand: "left", finger: "ring" },
    { key: "e", hand: "left", finger: "middle" },
    { key: "r", hand: "left", finger: "index" },
    { key: "t", hand: "left", finger: "index" },
    { key: "y", hand: "right", finger: "index" },
    { key: "u", hand: "right", finger: "index" },
    { key: "i", hand: "right", finger: "middle" },
    { key: "o", hand: "right", finger: "ring" },
    { key: "p", hand: "right", finger: "pinky" },
    { key: "Backspace", display: "⌫", hand: "right", finger: "pinky", width: "wide", isModifier: true },
  ],
  // Row 2: A S D F G H J K L Ç, Enter
  [
    { key: "a", hand: "left", finger: "pinky", isHomeRow: true },
    { key: "s", hand: "left", finger: "ring", isHomeRow: true },
    { key: "d", hand: "left", finger: "middle", isHomeRow: true },
    { key: "f", hand: "left", finger: "index", isHomeRow: true, hasBump: true },
    { key: "g", hand: "left", finger: "index" },
    { key: "h", hand: "right", finger: "index" },
    { key: "j", hand: "right", finger: "index", isHomeRow: true, hasBump: true },
    { key: "k", hand: "right", finger: "middle", isHomeRow: true },
    { key: "l", hand: "right", finger: "ring", isHomeRow: true },
    { key: "ç", display: "Ç", hand: "right", finger: "pinky", isHomeRow: true },
    { key: "Enter", display: "↵ ENTER", hand: "right", finger: "pinky", width: "wide", isModifier: true },
  ],
  // Row 3: Shift, Z X C V B N M , . ;, Shift
  [
    { key: "ShiftLeft", display: "⇧ SHIFT", hand: "left", finger: "pinky", width: "wide", isModifier: true },
    { key: "z", hand: "left", finger: "pinky" },
    { key: "x", hand: "left", finger: "ring" },
    { key: "c", hand: "left", finger: "middle" },
    { key: "v", hand: "left", finger: "index" },
    { key: "b", hand: "left", finger: "index" },
    { key: "n", hand: "right", finger: "index" },
    { key: "m", hand: "right", finger: "index" },
    { key: ",", display: ",", hand: "right", finger: "middle" },
    { key: ".", display: ".", hand: "right", finger: "ring" },
    { key: ";", display: ";", hand: "right", finger: "pinky" },
    { key: "ShiftRight", display: "⇧", hand: "right", finger: "pinky", width: "wide", isModifier: true },
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
    { key: "Tab", display: "TAB", hand: "left", finger: "pinky", width: "wide", isModifier: true },
    { key: "q", hand: "left", finger: "pinky" },
    { key: "w", hand: "left", finger: "ring" },
    { key: "e", hand: "left", finger: "middle" },
    { key: "r", hand: "left", finger: "index" },
    { key: "t", hand: "left", finger: "index" },
    { key: "y", hand: "right", finger: "index" },
    { key: "u", hand: "right", finger: "index" },
    { key: "i", hand: "right", finger: "middle" },
    { key: "o", hand: "right", finger: "ring" },
    { key: "p", hand: "right", finger: "pinky" },
    { key: "Backspace", display: "⌫", hand: "right", finger: "pinky", width: "wide", isModifier: true },
  ],
  // Row 2: A S D F G H J K L ;, Enter
  [
    { key: "a", hand: "left", finger: "pinky", isHomeRow: true },
    { key: "s", hand: "left", finger: "ring", isHomeRow: true },
    { key: "d", hand: "left", finger: "middle", isHomeRow: true },
    { key: "f", hand: "left", finger: "index", isHomeRow: true, hasBump: true },
    { key: "g", hand: "left", finger: "index" },
    { key: "h", hand: "right", finger: "index" },
    { key: "j", hand: "right", finger: "index", isHomeRow: true, hasBump: true },
    { key: "k", hand: "right", finger: "middle", isHomeRow: true },
    { key: "l", hand: "right", finger: "ring", isHomeRow: true },
    { key: ";", display: ";", hand: "right", finger: "pinky", isHomeRow: true },
    { key: "Enter", display: "↵ ENTER", hand: "right", finger: "pinky", width: "wide", isModifier: true },
  ],
  // Row 3: Shift, Z X C V B N M , . /, Shift
  [
    { key: "ShiftLeft", display: "⇧ SHIFT", hand: "left", finger: "pinky", width: "wide", isModifier: true },
    { key: "z", hand: "left", finger: "pinky" },
    { key: "x", hand: "left", finger: "ring" },
    { key: "c", hand: "left", finger: "middle" },
    { key: "v", hand: "left", finger: "index" },
    { key: "b", hand: "left", finger: "index" },
    { key: "n", hand: "right", finger: "index" },
    { key: "m", hand: "right", finger: "index" },
    { key: ",", display: ",", hand: "right", finger: "middle" },
    { key: ".", display: ".", hand: "right", finger: "ring" },
    { key: "/", display: "/", hand: "right", finger: "pinky" },
    { key: "ShiftRight", display: "⇧", hand: "right", finger: "pinky", width: "wide", isModifier: true },
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
  finger: "pinky",
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
