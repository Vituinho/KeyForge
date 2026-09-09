"use client"

import React from "react"
import { Finger } from "@/lib/keyboard/fingerMap"
import { HandGuideMode, KeyboardLayoutType } from "@/types/keyboard"
import { TypingFinger } from "./TypingFinger"
import { useI18n } from "@/lib/i18n/i18nContext"

export interface TypingHandProps {
  hand: "left" | "right"
  activeFinger?: Finger | null
  layout?: KeyboardLayoutType
  mode?: HandGuideMode
  size?: "sm" | "md" | "lg"
  className?: string
  reducedMotion?: boolean
}

const SIZE_MAP = {
  sm: { width: 110, height: 110 },
  md: { width: 136, height: 136 },
  lg: { width: 160, height: 160 },
}

export const TypingHand = React.memo(function TypingHand({
  hand,
  activeFinger = null,
  layout = "pt-BR",
  mode = "full",
  size = "md",
  className = "",
  reducedMotion = false,
}: TypingHandProps) {
  const { t } = useI18n()
  const isAnsi = layout === "en" || layout === "ANSI"
  const dimensions = SIZE_MAP[size] ?? SIZE_MAP.md

  const isLeft = hand === "left"
  const handTitle = isLeft ? t("keyboard.handLeft") : t("keyboard.handRight")

  // Left hand finger definitions
  const leftFingers = [
    { finger: "leftPinky" as Finger, homeKey: "A", x: 12, y: 32, width: 14, height: 46, angle: 0 },
    { finger: "leftRing" as Finger, homeKey: "S", x: 32, y: 16, width: 14, height: 60, angle: 0 },
    { finger: "leftMiddle" as Finger, homeKey: "D", x: 52, y: 10, width: 14, height: 66, angle: 0 },
    { finger: "leftIndex" as Finger, homeKey: "F", x: 72, y: 18, width: 14, height: 58, angle: 0, isHomeRow: true },
    { finger: "thumb" as Finger, homeKey: "␣", x: 96, y: 48, width: 15, height: 40, angle: 28 },
  ]

  // Right hand finger definitions
  const rightFingers = [
    { finger: "thumb" as Finger, homeKey: "␣", x: 29, y: 48, width: 15, height: 40, angle: -28 },
    { finger: "rightIndex" as Finger, homeKey: "J", x: 54, y: 18, width: 14, height: 58, angle: 0, isHomeRow: true },
    { finger: "rightMiddle" as Finger, homeKey: "K", x: 74, y: 10, width: 14, height: 66, angle: 0 },
    { finger: "rightRing" as Finger, homeKey: "L", x: 94, y: 16, width: 14, height: 60, angle: 0 },
    { finger: "rightPinky" as Finger, homeKey: isAnsi ? ";" : "Ç", x: 114, y: 32, width: 14, height: 46, angle: 0 },
  ]

  const fingers = isLeft ? leftFingers : rightFingers

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Hand Title Header */}
      <span className="text-[11px] font-mono font-bold tracking-wider text-white/50 mb-1.5 select-none">
        {handTitle}
      </span>

      {/* SVG Hand Illustration */}
      <svg
        viewBox="0 0 140 140"
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible drop-shadow-md transition-all duration-300"
        aria-label={handTitle}
      >
        <defs>
          <linearGradient id={`palm-grad-${hand}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#0f172a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Anatomical Palm Base Shape */}
        {isLeft ? (
          <g>
            <path
              d="M 12 74 C 12 60, 28 68, 50 68 C 72 68, 86 64, 90 70 C 104 74, 122 86, 116 108 C 110 124, 98 135, 90 140 L 28 140 C 22 135, 12 116, 12 74 Z"
              fill={`url(#palm-grad-${hand})`}
              stroke="rgba(255, 255, 255, 0.14)"
              strokeWidth="1.2"
            />
            {/* Subtle palm crease details */}
            <path
              d="M 32 94 C 50 96, 75 106, 92 120"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M 88 78 C 84 94, 76 112, 60 126"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              fill="none"
            />
          </g>
        ) : (
          <g>
            <path
              d="M 128 74 C 128 60, 112 68, 90 68 C 68 68, 54 64, 50 70 C 36 74, 18 86, 24 108 C 30 124, 42 135, 50 140 L 112 140 C 118 135, 128 116, 128 74 Z"
              fill={`url(#palm-grad-${hand})`}
              stroke="rgba(255, 255, 255, 0.14)"
              strokeWidth="1.2"
            />
            {/* Subtle palm crease details */}
            <path
              d="M 108 94 C 90 96, 65 106, 48 120"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M 52 78 C 56 94, 64 112, 80 126"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
              fill="none"
            />
          </g>
        )}

        {/* Hand Identifier Letter watermark inside palm */}
        <text
          x={70}
          y={112}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono font-black select-none pointer-events-none"
          fontSize={16}
          fill="rgba(255, 255, 255, 0.12)"
        >
          {isLeft ? "LEFT" : "RIGHT"}
        </text>

        {/* 5 Distinct Touch Typing Fingers */}
        {fingers.map((item) => (
          <TypingFinger
            key={item.finger}
            finger={item.finger}
            hand={hand}
            isActive={activeFinger === item.finger}
            isHomeRow={item.isHomeRow}
            homeKey={item.homeKey}
            x={item.x}
            y={item.y}
            width={item.width}
            height={item.height}
            angle={item.angle}
            mode={mode}
            reducedMotion={reducedMotion}
          />
        ))}
      </svg>
    </div>
  )
})
