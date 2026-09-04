"use client"

import { motion } from "framer-motion"
import { Enemy } from "@/types/character"
import { Shield, Zap } from "lucide-react"

interface EnemyCardProps {
  enemy: Enemy
  currentHp: number
  isUnderAttack?: boolean
}

export function EnemyCard({ enemy, currentHp, isUnderAttack }: EnemyCardProps) {
  const hpPercent = Math.max(0, (currentHp / enemy.maxHp) * 100)

  const hpColor =
    hpPercent > 60
      ? "bg-green-500"
      : hpPercent > 30
        ? "bg-yellow-500"
        : "bg-red-500"

  return (
    <motion.div
      className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 w-72"
      animate={isUnderAttack ? { x: [0, -8, 8, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
          style={{
            backgroundColor: `${enemy.themeColor}22`,
            color: enemy.themeColor,
            border: `1px solid ${enemy.themeColor}44`,
          }}
        >
          {enemy.type}
        </span>
        <div className="flex items-center gap-1 text-xs text-white/50">
          <Zap size={12} />
          <span>LV.{enemy.level}</span>
        </div>
      </div>

      {/* Name */}
      <h2
        className="text-xl font-black uppercase tracking-wider mb-1"
        style={{ color: enemy.themeColor }}
      >
        {enemy.name}
      </h2>
      <p className="text-xs text-white/40 mb-4">{enemy.anime}</p>

      {/* HP Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-white/60">
          <span className="flex items-center gap-1">
            <Shield size={11} /> HP
          </span>
          <span>
            {currentHp} / {enemy.maxHp}
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${hpColor}`}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              boxShadow: `0 0 8px ${hpPercent > 30 ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.6)"}`,
            }}
          />
        </div>
      </div>

      {/* Aura glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: `inset 0 0 30px ${enemy.themeColor}15`,
        }}
      />
    </motion.div>
  )
}
