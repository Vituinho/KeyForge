"use client"

import React, { createContext, useContext, useSyncExternalStore, useCallback } from "react"
import { Locale, I18nContextType } from "@/types/i18n"
import { en } from "@/locales/en"
import { ptBR } from "@/locales/pt-BR"

const STORAGE_KEY = "keyforge_language"

const dictionaries: Record<Locale, Record<string, unknown>> = {
  en: en as unknown as Record<string, unknown>,
  "pt-BR": ptBR as unknown as Record<string, unknown>,
}

const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function subscribe(callback: () => void) {
  listeners.add(callback)

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && (e.newValue === "pt-BR" || e.newValue === "en")) {
      notifyListeners()
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage)
  }

  return () => {
    listeners.delete(callback)
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage)
    }
  }
}

function getSnapshot(): Locale {
  if (typeof window === "undefined") return "en"
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved === "pt-BR" || saved === "en") {
      return saved
    }
    if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("pt")) {
      return "pt-BR"
    }
  } catch {
    // Ignore access errors
  }
  return "en"
}

function getServerSnapshot(): Locale {
  return "en"
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: (key: string) => key,
})

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".")
  let current: unknown = obj

  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }

  return typeof current === "string" ? current : undefined
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setLocale = useCallback((newLocale: Locale) => {
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
      notifyListeners()
    } catch {
      // Ignore storage errors
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // 1. Try active dictionary
      const activeDict = dictionaries[locale] ?? dictionaries.en
      let text = getNestedValue(activeDict, key)

      // 2. Fallback to English dictionary if not found in active
      if (text === undefined && locale !== "en") {
        text = getNestedValue(dictionaries.en, key)
      }

      // 3. Fallback to key itself to never return undefined
      if (text === undefined) {
        return key
      }

      // 4. Interpolate parameters: {paramName}
      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          text = text?.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal))
        })
      }

      return text
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  return useContext(I18nContext)
}

export const useTranslation = useI18n
