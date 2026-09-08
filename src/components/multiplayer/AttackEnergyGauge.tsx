"use client"

import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"

export interface AttackEnergyGaugeProps {
  energy: number // 0 - 100
  isPlayer1?: boolean
  label?: string
  className?: string
  lastAttackTimestamp?: number
}

export function AttackEnergyGauge({
  energy,
  isPlayer1 = true,
  label,
  className = "",
  lastAttackTimestamp,
}: AttackEnergyGaugeProps) {
  const { t } = useI18n()
  const displayLabel = label ?? t("multiplayerArena.atkEnergy")
  const isCharged = energy >= 100
  const primaryColor = isPlayer1 ? "from-orange-500 to-amber-400" : "from-blue-500 to-cyan-400"
  const glowColor = isPlayer1 ? "rgba(249,115,22,0.8)" : "rgba(59,130,246,0.8)"

  return (
    <div className={`space-y-1 font-mono ${className}`}>
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1">
          <Zap
            size={11}
            className={`${
              isCharged
                ? isPlayer1
                  ? "text-orange-400 animate-bounce"
                  : "text-blue-400 animate-bounce"
                : "text-white/40"
            }`}
          />
          <span className="text-white/60 font-bold uppercase tracking-wider">{displayLabel}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isCharged && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                isPlayer1
                  ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                  : "bg-blue-500/20 text-blue-300 border-blue-500/40"
              }`}
            >
              {t("multiplayerArena.readyBadge")}
            </motion.span>
          )}
          <span
            className={`font-black ${
              isCharged ? (isPlayer1 ? "text-orange-400" : "text-blue-400") : "text-white"
            }`}
          >
            {Math.min(100, Math.max(0, energy))}%
          </span>
        </div>
      </div>

      {/* Energy Bar Track */}
      <div className="relative w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-white/10 p-[1px]">
        {/* Fill */}
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${primaryColor} relative`}
          animate={{ width: `${Math.min(100, Math.max(0, energy))}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            boxShadow: isCharged ? `0 0 12px ${glowColor}` : "none",
          }}
        >
          {/* Subtle light shimmer sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
        </motion.div>

        {/* Declarative Attack Unleashed Flash */}
        {lastAttackTimestamp ? (
          <motion.div
            key={lastAttackTimestamp}
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-white z-10 pointer-events-none"
          />
        ) : null}
      </div>
    </div>
  )
}
