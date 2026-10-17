"use client"

import { CharData } from "@/types/typing"
import { memo, useEffect, useRef } from "react"
import { useI18n } from "@/lib/i18n/i18nContext"

interface TypingAreaProps {
  chars: CharData[]
  inputRef: React.RefObject<HTMLInputElement | null>
  onFocus: () => void
  themeColor?: string
}

const STATE_CLASSES: Record<string, string> = {
  correct: "text-white",
  incorrect: "text-red-400 bg-red-500/20 rounded-sm",
  current: "text-white",
  untyped: "text-white/50",
}

export function TypingArea({ chars, inputRef, onFocus, themeColor = "#f97316" }: TypingAreaProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)

  // Click anywhere on the typing area → focus the hidden input
  const handleClick = () => {
    inputRef.current?.focus()
    onFocus()
  }

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [inputRef])

  const currentIdx = chars.findIndex((c) => c.state === "current")

  return (
    <div
      className="relative rounded-2xl border border-white/10 focus-within:border-orange-400/60 focus-within:ring-1 focus-within:ring-orange-400/20 bg-white/5 backdrop-blur-sm p-4 sm:p-6 cursor-text"
      onClick={handleClick}
      ref={containerRef}
    >
      {/* Hidden input captures keystrokes */}
      <input
        ref={inputRef}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        readOnly
        aria-label={t("battle.typingArea.typingInputAria")}
        tabIndex={0}
      />

      <p className="text-xl sm:text-2xl leading-relaxed font-mono tracking-wide select-none">
        {chars.map((charData, i) => (
          <CharSpan
            key={i}
            char={charData.char}
            state={charData.state}
            isCurrent={i === currentIdx}
            themeColor={themeColor}
          />
        ))}
      </p>

      {/* Click-to-focus overlay hint */}
      {currentIdx === 0 && chars.every((c) => c.state === "current" || c.state === "untyped") && (
        <p
          className="text-center text-white/30 text-sm mt-4"
        >
          {t("battle.typingArea.clickToFocus")}
        </p>
      )}
    </div>
  )
}

const CharSpan = memo(function CharSpan({
  char, state,
  isCurrent,
  themeColor,
}: {
  char: string; state: CharData["state"]
  isCurrent: boolean
  themeColor: string
}) {
  return (
    <span className={`relative ${STATE_CLASSES[state]}`}>
      {isCurrent && (
        <span
          className="absolute -left-0.5 top-0 bottom-0 w-0.5 rounded-full"
          style={{ backgroundColor: themeColor }}
        />
      )}
      {char === " " && state === "incorrect" ? "·" : char}
    </span>
  )
})
