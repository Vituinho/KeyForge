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

    let missingStarters = false
    starterSet.forEach((s) => {
      if (!existingUnlocked.includes(s)) {
        existingUnlocked.push(s)
        missingStarters = true
      }
    })

    const validated: PlayerCosmeticsState = {
      unlockedSkinIds: existingUnlocked,
      equippedSkinId: parsed.equippedSkinId || DEFAULT_EQUIPPED_SKIN_ID,
      crates: typeof parsed.crates === "object" && parsed.crates !== null ? parsed.crates : { basic_crate: 1 },
      forgeShards: typeof parsed.forgeShards === "number" && parsed.forgeShards >= 0 ? parsed.forgeShards : 50,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    }

    if (missingStarters) {
      localStorage.setItem(COSMETICS_STORAGE_KEY, JSON.stringify(validated))
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
 * Directly add crates to player inventory.
 * Safely creates or increments crate entry in local storage and dispatches update.
 */
export function addCratesDirectly(crateId: string, count: number = 1): PlayerCosmeticsState {
  const current = loadCosmeticsState()
  const existingCount = current.crates[crateId] || 0
  const updated: PlayerCosmeticsState = {
    ...current,
    crates: {
      ...current.crates,
      [crateId]: existingCount + count,
    },
    updatedAt: new Date().toISOString(),
  }
  saveCosmeticsState(updated)
  return updated
}

/**
 * Directly add forge shards to player balance.
 */
export function addShardsDirectly(shards: number): PlayerCosmeticsState {
  const current = loadCosmeticsState()
  const updated: PlayerCosmeticsState = {
    ...current,
    forgeShards: (current.forgeShards || 0) + Math.max(0, shards),
    updatedAt: new Date().toISOString(),
  }
  saveCosmeticsState(updated)
  return updated
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
      fingerColors: parsed.fingerColors ?? DEFAULT_KEYBOARD_ACCESSIBILITY.fingerColors,
      handGuide: parsed.handGuide ?? DEFAULT_KEYBOARD_ACCESSIBILITY.handGuide,
      keyboardLayout: parsed.keyboardLayout ?? DEFAULT_KEYBOARD_ACCESSIBILITY.keyboardLayout,
      showFingerName: parsed.showFingerName ?? DEFAULT_KEYBOARD_ACCESSIBILITY.showFingerName,
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
