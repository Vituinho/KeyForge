"use client"

import { motion, AnimatePresence } from "framer-motion"
import { PersonalBestMilestone } from "@/types/progression"
import { useI18n } from "@/lib/i18n/i18nContext"
import { Award, Zap, Target, Flame } from "lucide-react"

interface PersonalBestBannerProps {
  milestone: PersonalBestMilestone | null
}

export function PersonalBestBanner({ milestone }: PersonalBestBannerProps) {
  const { t } = useI18n()

  if (!milestone) return null

  const getIcon = () => {
    switch (milestone.type) {
      case "wpm":
        return <Zap size={18} className="text-amber-300" />
      case "accuracy":
        return <Target size={18} className="text-emerald-300" />
      case "combo":
        return <Flame size={18} className="text-orange-300" />
      default:
        return <Award size={18} className="text-yellow-300" />
    }
  }

  const getMessage = () => {
    switch (milestone.type) {
      case "wpm":
        return t("battle.feedback.newWpmRecord", { val: milestone.newValue })
      case "accuracy":
        return t("battle.feedback.newAccRecord", { val: milestone.newValue })
      case "combo":
        return t("battle.feedback.comboMilestone", { combo: milestone.newValue })
      default:
        return t("battle.feedback.newPersonalBest")
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed top-6 right-6 z-50 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.9 }}
          transition={{ duration: 0.35, ease: "backOut" }}
          className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/90 border-2 border-amber-400/70 shadow-[0_0_35px_rgba(251,191,36,0.4)] backdrop-blur-md"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shrink-0">
            {getIcon()}
          </div>

          <div className="text-left">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400 block">
              {t("battle.feedback.newPersonalBest")}
            </span>
            <span className="text-sm font-black text-white font-mono">
              {getMessage()}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
