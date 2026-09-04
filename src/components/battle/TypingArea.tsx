"use client"

import { CharData } from "@/types/typing"
import { motion } from "framer-motion"
import { useEffect, useRef } from "react"

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
  untyped: "text-white/30",
}

export function TypingArea({ chars, inputRef, onFocus, themeColor = "#f97316" }: TypingAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Click anywhere on the typing area → focus the hidden input
  const handleClick = () => {
    inputRef.current?.focus()
    onFocus()
  }

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
  }, [inputRef])

  const currentIdx = chars.findIndex((c) => c.state === "current")

  return (
    <div
      className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 cursor-text"
      onClick={handleClick}
      ref={containerRef}
    >
      {/* Hidden input captures keystrokes */}
      <input
        ref={inputRef}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        readOnly
        aria-label="Typing input"
        tabIndex={0}
      />

      <p className="text-xl leading-relaxed font-mono tracking-wide select-none">
        {chars.map((charData, i) => (
          <CharSpan
            key={i}
            charData={charData}
            isCurrent={i === currentIdx}
            themeColor={themeColor}
          />
        ))}
      </p>

      {/* Click-to-focus overlay hint */}
      {currentIdx === 0 && chars.every((c) => c.state === "current" || c.state === "untyped") && (
        <motion.p
          className="text-center text-white/30 text-sm mt-4"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Click here and start typing…
        </motion.p>
      )}
    </div>
  )
}

function CharSpan({
  charData,
  isCurrent,
  themeColor,
}: {
  charData: CharData
  isCurrent: boolean
  themeColor: string
}) {
  return (
    <span className={`relative ${STATE_CLASSES[charData.state]}`}>
      {isCurrent && (
        <motion.span
          className="absolute -left-0.5 top-0 bottom-0 w-0.5 rounded-full"
          style={{ backgroundColor: themeColor }}
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
      {charData.char === " " && charData.state === "incorrect" ? "·" : charData.char}
    </span>
  )
}
