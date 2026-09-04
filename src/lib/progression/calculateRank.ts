import { PlayerAttributes, PlayerRank } from "@/types/player"

export const RANK_ORDER: PlayerRank[] = ["E", "D", "C", "B", "A", "S", "SS", "SSS"]

export interface RankDetails {
  rank: PlayerRank
  label: string
  color: string
  bg: string
  border: string
  glow: string
  minOverall: number
}

export const RANK_METADATA: Record<PlayerRank, RankDetails> = {
  E: {
    rank: "E",
    label: "Initiate",
    color: "#94a3b8",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    glow: "rgba(148, 163, 184, 0.4)",
    minOverall: 0,
  },
  D: {
    rank: "D",
    label: "Apprentice",
    color: "#60a5fa",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    glow: "rgba(96, 165, 250, 0.4)",
    minOverall: 30,
  },
  C: {
    rank: "C",
    label: "Adept",
    color: "#34d399",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glow: "rgba(52, 211, 153, 0.4)",
    minOverall: 40,
  },
  B: {
    rank: "B",
    label: "Expert",
    color: "#a78bfa",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    glow: "rgba(167, 139, 250, 0.4)",
    minOverall: 50,
  },
  A: {
    rank: "A",
    label: "Master",
    color: "#fbbf24",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glow: "rgba(251, 191, 36, 0.4)",
    minOverall: 60,
  },
  S: {
    rank: "S",
    label: "Grandmaster",
    color: "#f97316",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    glow: "rgba(249, 115, 22, 0.5)",
    minOverall: 75,
  },
  SS: {
    rank: "SS",
    label: "Mythic",
    color: "#ef4444",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    glow: "rgba(239, 68, 68, 0.5)",
    minOverall: 85,
  },
  SSS: {
    rank: "SSS",
    label: "Legendary",
    color: "#ec4899",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    glow: "rgba(236, 72, 153, 0.6)",
    minOverall: 95,
  },
}

/**
 * Calculates player rank from overall rating and accuracy.
 *
 * Enforces accuracy caps so that high speed cannot compensate for sloppy accuracy:
 * - SSS requires overall >= 95 AND accuracy >= 97%
 * - SS requires overall >= 85 AND accuracy >= 94%
 * - S requires overall >= 75 AND accuracy >= 90%
 * - A requires overall >= 60 AND accuracy >= 80%
 */
export function calculateRank(
  overall: number,
  accuracy = 100
): PlayerRank {
  const safeOverall = Math.max(0, Math.min(100, Math.round(overall || 0)))
  const safeAccuracy = Math.max(0, Math.min(100, Math.round(accuracy || 0)))

  if (safeOverall >= 95 && safeAccuracy >= 97) return "SSS"
  if (safeOverall >= 85 && safeAccuracy >= 94) return "SS"
  if (safeOverall >= 75 && safeAccuracy >= 90) return "S"
  if (safeOverall >= 60 && safeAccuracy >= 80) return "A"
  if (safeOverall >= 50) return "B"
  if (safeOverall >= 40) return "C"
  if (safeOverall >= 30) return "D"
  return "E"
}

/**
 * Calculates player rank directly from PlayerAttributes.
 */
export function calculateRankFromAttributes(attributes: PlayerAttributes): PlayerRank {
  return calculateRank(attributes.overall, attributes.accuracy)
}

/**
 * Checks if newRank is strictly higher than prevRank.
 */
export function isRankUp(prevRank: PlayerRank, newRank: PlayerRank): boolean {
  return RANK_ORDER.indexOf(newRank) > RANK_ORDER.indexOf(prevRank)
}
