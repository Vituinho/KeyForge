/**
 * KeyForge Cosmetics Local Storage
 * Manages local persistent cosmetics state, unlocked skins, equipped skin,
 * crates, shards, and visual keyboard settings with multi-tab sync.
 */

import {
  PlayerCosmeticsState,
  KeyboardAccessibilitySettings,
  createDefaultCosmeticsState,
  DEFAULT_KEYBOARD_ACCESSIBILITY,
  DEFAULT_STARTER_SKIN_IDS,
  DEFAULT_EQUIPPED_SKIN_ID,
} from "@/types/cosmetics"

export const COSMETICS_STORAGE_KEY = "keyforge_cosmetics_v1"
export const KEYBOARD_SETTINGS_STORAGE_KEY = "keyforge_keyboard_settings_v1"
export const COSMETICS_UPDATE_EVENT = "keyforge:cosmetics-updated"
export const KEYBOARD_SETTINGS_UPDATE_EVENT = "keyforge:keyboard-settings-updated"

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export function notifyCosmeticsUpdate() {
  if (isBrowser()) {
    window.dispatchEvent(new Event(COSMETICS_UPDATE_EVENT))
  }
}

export function notifySettingsUpdate() {
  if (isBrowser()) {
    window.dispatchEvent(new Event(KEYBOARD_SETTINGS_UPDATE_EVENT))
  }
}

/**
 * Load local cosmetics state safely.
 * Guarantees default starter skins are always present and equipped skin is valid.
 */
export function loadCosmeticsState(): PlayerCosmeticsState {
  if (!isBrowser()) {
    return createDefaultCosmeticsState()
  }

  try {
    const raw = localStorage.getItem(COSMETICS_STORAGE_KEY)
    if (!raw) {
      const initial = createDefaultCosmeticsState()
      localStorage.setItem(COSMETICS_STORAGE_KEY, JSON.stringify(initial))
      return initial
    }

    const parsed = JSON.parse(raw) as Partial<PlayerCosmeticsState>
    const starterSet = new Set(DEFAULT_STARTER_SKIN_IDS)
    const existingUnlocked = Array.isArray(parsed.unlockedSkinIds) ? parsed.unlockedSkinIds : []

    // Ensure all starters are present in unlocked list
    starterSet.forEach((s) => {
      if (!existingUnlocked.includes(s)) {
        existingUnlocked.push(s)
      }
    })

    const validated: PlayerCosmeticsState = {
      unlockedSkinIds: existingUnlocked,
      equippedSkinId: parsed.equippedSkinId || DEFAULT_EQUIPPED_SKIN_ID,
      crates: typeof parsed.crates === "object" && parsed.crates !== null ? parsed.crates : { basic_crate: 1 },
      forgeShards: typeof parsed.forgeShards === "number" && parsed.forgeShards >= 0 ? parsed.forgeShards : 50,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    }

    return validated
  } catch (err) {
    console.warn("[CosmeticsStorage] Failed to parse local state, resetting to default:", err)
    return createDefaultCosmeticsState()
  }
}

/**
 * Save cosmetics state to localStorage and notify listeners.
 */
export function saveCosmeticsState(state: PlayerCosmeticsState): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(COSMETICS_STORAGE_KEY, JSON.stringify(state))
    notifyCosmeticsUpdate()
  } catch (err) {
    console.error("[CosmeticsStorage] Error saving local state:", err)
  }
}

/**
 * Load accessibility settings safely.
 */
export function loadKeyboardAccessibilitySettings(): KeyboardAccessibilitySettings {
  if (!isBrowser()) {
    return DEFAULT_KEYBOARD_ACCESSIBILITY
  }

  try {
    const raw = localStorage.getItem(KEYBOARD_SETTINGS_STORAGE_KEY)
    if (!raw) {
      return DEFAULT_KEYBOARD_ACCESSIBILITY
    }
    const parsed = JSON.parse(raw) as Partial<KeyboardAccessibilitySettings>
    return {
      showKeyboard: parsed.showKeyboard ?? DEFAULT_KEYBOARD_ACCESSIBILITY.showKeyboard,
      effectIntensity: parsed.effectIntensity ?? DEFAULT_KEYBOARD_ACCESSIBILITY.effectIntensity,
      showHandsGuide: parsed.showHandsGuide ?? DEFAULT_KEYBOARD_ACCESSIBILITY.showHandsGuide,
      showHomeRowAnchors: parsed.showHomeRowAnchors ?? DEFAULT_KEYBOARD_ACCESSIBILITY.showHomeRowAnchors,
    }
  } catch {
    return DEFAULT_KEYBOARD_ACCESSIBILITY
  }
}

/**
 * Save keyboard accessibility settings.
 */
export function saveKeyboardAccessibilitySettings(settings: KeyboardAccessibilitySettings): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(KEYBOARD_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    notifySettingsUpdate()
  } catch (err) {
    console.error("[CosmeticsStorage] Error saving accessibility settings:", err)
  }
}
