/**
 * KeyForge Cosmetics & Inventory Domain Types
 * Defines keyboard skins, rarities, collections, crates, and player cosmetic inventory.
 */

export type SkinRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "secret"

export type SkinCollection =
  | "forge"
  | "shinobi"
  | "cosmic"
  | "cursed"
  | "pirate"
  | "shadow"
  | "cyber"

export type EffectIntensity = "full" | "reduced" | "off"

export interface KeyboardVisualEffects {
  glowColor?: string
  glowIntensity?: "none" | "low" | "medium" | "high" | "intense"
  borderEffect?: "solid" | "pulse" | "neon" | "rgb-flow" | "fire" | "lightning"
  activeKeyAnimation?: "bounce" | "glow" | "spark" | "ripple"
  frameBorderGlow?: string
  keyPressAura?: string
  particleGlow?: boolean
  pulseGlow?: boolean
}

export interface KeyboardSkinVisual {
  frameBg: string
  frameBorder: string
  accentColor: string
  keyBg: string
  keyText: string
  keyBorder: string
  keyExpectedBg: string
  keyExpectedText?: string
  keyExpectedBorder?: string
  keyPressedBg: string
  keyPressedText?: string
  keyCorrectBg: string
  keyIncorrectBg: string
  effects?: KeyboardVisualEffects
}

export interface KeyboardSkin {
  id: string
  name: string
  description: string
  rarity: SkinRarity
  collection: SkinCollection
  theme: string
  visual: KeyboardSkinVisual
  isStarter?: boolean
  obtainableFrom?: string
  shardsValue: number
  isHidden?: boolean
}

export type CrateType = "basic" | "shinobi" | "elite" | "mythic"

export interface CrateRarityWeight {
  rarity: SkinRarity
  weight: number
}

export interface CrateDefinition {
  id: string
  type: CrateType
  name: string
  description: string
  icon: string
  dropWeights: CrateRarityWeight[]
  guaranteedMinRarity?: SkinRarity
}

export interface CosmeticUnlockResult {
  skin: KeyboardSkin
  isDuplicate: boolean
  shardsAwarded: number
}

export interface UserCosmetic {
  id: string
  userId: string
  cosmeticId: string
  cosmeticType: "keyboard_skin"
  unlockedAt: string
}

export interface PlayerCosmeticsState {
  unlockedSkinIds: string[]
  equippedSkinId: string
  crates: Record<string, number>
  forgeShards: number
  updatedAt: string
}

export type KeyboardLayoutPreference = "ABNT2" | "ANSI" | "auto"
export type FingerColorsSetting = "full" | "subtle" | "off"
export type HandGuideSetting = "full" | "subtle" | "off"

export interface KeyboardAccessibilitySettings {
  showKeyboard: boolean
  effectIntensity: EffectIntensity
  showHandsGuide: boolean
  showHomeRowAnchors: boolean
  fingerColors: FingerColorsSetting
  handGuide: HandGuideSetting
  keyboardLayout: KeyboardLayoutPreference
  showFingerName: boolean
}

export const DEFAULT_KEYBOARD_ACCESSIBILITY: KeyboardAccessibilitySettings = {
  showKeyboard: true,
  effectIntensity: "full",
  showHandsGuide: false,
  showHomeRowAnchors: true,
  fingerColors: "subtle",
  handGuide: "subtle",
  keyboardLayout: "auto",
  showFingerName: true,
}

export const DEFAULT_STARTER_SKIN_IDS = [
  "default_forge",
  "midnight_shinobi",
  "clean_light",
] as const

export const DEFAULT_EQUIPPED_SKIN_ID = "default_forge"

export function createDefaultCosmeticsState(): PlayerCosmeticsState {
  return {
    unlockedSkinIds: [...DEFAULT_STARTER_SKIN_IDS],
    equippedSkinId: DEFAULT_EQUIPPED_SKIN_ID,
    crates: {
      basic_crate: 1, // Welcome starter crate
    },
    forgeShards: 50,
    updatedAt: new Date().toISOString(),
  }
}
