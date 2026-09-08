"use client"

import { motion } from "framer-motion"
import { Heart } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"

interface PlayerCardProps {
  currentHp: number
  maxHp: number
  isUnderAttack?: boolean
}

export function PlayerCard({ currentHp, maxHp, isUnderAttack }: PlayerCardProps) {
  const { t } = useI18n()
  const hpPercent = Math.max(0, (currentHp / maxHp) * 100)

  const hpColor =
    hpPercent > 60
      ? "bg-emerald-500"
      : hpPercent > 30
        ? "bg-yellow-500"
        : "bg-red-500"

  return (
    <motion.div
      className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 w-64"
      animate={isUnderAttack ? { x: [0, 10, -10, 5, -5, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold">
          P
        </div>
        <div>
          <p className="text-sm font-bold text-white">{t("battle.playerCard.player").toUpperCase()}</p>
          <p className="text-xs text-white/40">{t("battle.playerCard.challenger")}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-white/60">
          <span className="flex items-center gap-1">
            <Heart size={11} /> HP
          </span>
          <span>
            {currentHp} / {maxHp}
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${hpColor}`}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              boxShadow: `0 0 8px rgba(16,185,129,0.5)`,
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}
