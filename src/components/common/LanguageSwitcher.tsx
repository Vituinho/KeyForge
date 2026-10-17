"use client"

import { useState, useRef, useEffect, useId } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"
import { Locale } from "@/types/i18n"

interface LanguageOption {
  code: Locale
  label: string
  flag: string
}

const LANGUAGES: LanguageOption[] = [
  { code: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
  { code: "en", label: "English (US)", flag: "🇺🇸" },
]

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[1]

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    if (isOpen) dropdownRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus()
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  return (
    <div className="relative inline-block shrink-0 text-left" ref={dropdownRef} onBlur={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setIsOpen(false)
    }}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-11 items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-white/80 hover:text-white transition-colors shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={isOpen ? listId : undefined}
        aria-label={t("common.selectLanguage")}
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="uppercase tracking-wider">{current.code}</span>
        <ChevronDown
          size={13}
          className={`text-white/40 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/15 bg-neutral-950/95 backdrop-blur-xl p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 space-y-1"
            role="listbox"
            id={listId}
            onKeyDown={event => {
              const options = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]')]
              const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement)
              const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1
                : event.key === "ArrowDown" ? (currentIndex + 1) % options.length
                : event.key === "ArrowUp" ? (currentIndex - 1 + options.length) % options.length : -1
              if (next >= 0) { event.preventDefault(); options[next]?.focus() }
            }}
            aria-label={t("common.languageOptions")}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === locale
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => {
                    setLocale(lang.code)
                    setIsOpen(false)
                    triggerRef.current?.focus()
                  }}
                  className={`w-full min-h-11 flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    isSelected
                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-orange-400" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
