"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { User, Home } from "lucide-react"
import { usePlayer } from "@/hooks/usePlayer"
import { RANK_METADATA } from "@/lib/progression/calculateRank"
import { getXpRequiredForLevel } from "@/lib/progression/calculateLevel"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { useI18n } from "@/lib/i18n/i18nContext"

export function PlayerQuickWidget() {
  const { t, locale } = useI18n()
  const { player } = usePlayer()
  const rankMeta = RANK_METADATA[player.rank]
  const xpNeeded = getXpRequiredForLevel(player.level)
  const xpPercent = Math.min(100, Math.round((player.xp / xpNeeded) * 100))

  return (
    <motion.div
      className="relative z-20 w-full max-w-2xl mb-8 p-3 sm:p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between gap-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border shrink-0"
          style={{
            backgroundColor: `${rankMeta.color}20`,
            borderColor: rankMeta.color,
            color: rankMeta.color,
          }}
        >
          {player.rank}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{player.username}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              {t("dashboard.quickWidget.level")} {player.level}
            </span>
            {player.title && (
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 uppercase">
                {player.title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono mt-0.5">
            <span>
              {t("common.rank")} {player.rank} · {rankMeta.label}
            </span>
            <span>·</span>
            {player.campaignProgress?.naruto?.completed ? (
              <span className="text-emerald-400 font-bold">8/8 COMPLETED 🏆</span>
            ) : (
              <span>Naruto: {t("common.stage")} {player.campaignProgress?.naruto?.currentStage ?? 1}/8</span>
            )}
            <span>·</span>
            <span>
              {player.xp} / {xpNeeded} XP ({xpPercent}%)
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <LanguageSwitcher />
        <Link
          href="/"
          title={locale === "pt-BR" ? "Ir para a Página Inicial Pública" : "Visit Public Landing Page"}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-colors text-xs font-bold flex items-center gap-1"
        >
          <Home size={14} />
          <span className="hidden sm:inline">{locale === "pt-BR" ? "Início" : "Home"}</span>
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-colors"
        >
          <User size={14} />
          <span>{t("nav.profile").toUpperCase()}</span>
        </Link>
      </div>
    </motion.div>
  )
}
