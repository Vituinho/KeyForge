"use client"

import React from "react"
import { motion } from "framer-motion"
import { Finger, FINGER_PALETTE } from "@/lib/keyboard/fingerMap"
import { HandGuideMode } from "@/types/keyboard"

export interface TypingFingerProps {
  finger: Finger
  hand: "left" | "right"
  isActive: boolean
  isHomeRow?: boolean
  homeKey?: string
  x: number
  y: number
  width: number
  height: number
  angle?: number
  mode?: HandGuideMode
  reducedMotion?: boolean
}

export const TypingFinger = React.memo(function TypingFinger({
  finger,
  isActive,
  isHomeRow = false,
  homeKey,
  x,
  y,
  width,
  height,
  angle = 0,
  mode = "full",
  reducedMotion = false,
}: TypingFingerProps) {
  const palette = FINGER_PALETTE[finger]
  const color = palette?.hex ?? "#94a3b8"

  const radius = width / 2
  const tipRadius = width * 0.38

  const showVividColors = mode === "full"

  return (
    <motion.g
      initial={false}
      animate={{
        y: isActive && !reducedMotion ? -4 : 0,
        opacity: isActive ? 1 : 0.45,
      }}
      transition={{ type: "spring", stiffness: 450, damping: 28 }}
      style={{
        transformOrigin: `${x + width / 2}px ${y + height}px`,
        transform: angle ? `rotate(${angle}deg)` : undefined,
      }}
      className="cursor-default select-none pointer-events-none"
    >
      {/* Active Glow Ring / Aura behind finger */}
      {isActive && (
        <rect
          x={x - 3}
          y={y - 3}
          width={width + 6}
          height={height + 6}
          rx={radius + 3}
          fill={color}
          opacity={0.35}
          filter="blur(4px)"
        />
      )}

      {/* Finger Capsule Body */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={radius}
        fill={isActive ? (showVividColors ? color : "#334155") : "#1e293b"}
        fillOpacity={isActive ? (showVividColors ? 0.35 : 0.6) : 0.55}
        stroke={isActive ? color : "rgba(255, 255, 255, 0.16)"}
        strokeWidth={isActive ? 2 : 1.2}
      />

      {/* Knuckle Joint Line */}
      <line
        x1={x + 2.5}
        y1={y + height * 0.52}
        x2={x + width - 2.5}
        y2={y + height * 0.52}
        stroke={isActive ? color : "rgba(255, 255, 255, 0.12)"}
        strokeWidth={1}
        strokeDasharray="2 1"
        opacity={0.6}
      />

      {/* Fingertip Highlight Accent */}
      <circle
        cx={x + width / 2}
        cy={y + radius + 1}
        r={tipRadius}
        fill={showVividColors || isActive ? color : "#64748b"}
        fillOpacity={isActive ? 1 : 0.75}
      />

      {/* Tactile bump marker on Index home row keys (F and J) */}
      {isHomeRow && (finger === "leftIndex" || finger === "rightIndex") && (
        <rect
          x={x + width / 2 - 2.5}
          y={y + radius + 10}
          width={5}
          height={1.8}
          rx={0.9}
          fill={isActive ? "#ffffff" : "rgba(255, 255, 255, 0.55)"}
        />
      )}

      {/* Home Row resting key letter badge */}
      {homeKey && (
        <text
          x={x + width / 2}
          y={y + height * 0.76}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-mono font-bold select-none"
          fontSize={width > 15 ? 8.5 : 7.5}
          fill={isActive ? "#ffffff" : "rgba(255, 255, 255, 0.45)"}
        >
          {homeKey}
        </text>
      )}
    </motion.g>
  )
})
