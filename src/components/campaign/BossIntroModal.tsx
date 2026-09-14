"use client"

import { useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Enemy } from "@/types/character"
import { useI18n } from "@/lib/i18n/i18nContext"
import { Skull, Zap, ChevronRight } from "lucide-react"

interface BossIntroModalProps {
  enemy: Enemy
  isOpen: boolean
  onComplete: () => void
  isRematch?: boolean
}

export function BossIntroModal({
  enemy,
  isOpen,
  onComplete,
  isRematch = false,
}: BossIntroModalProps) {
  const { t } = useI18n()

  const handleProceed = useCallback(() => {
    onComplete()
  }, [onComplete])

  // Keyboard shortcut (Space, Enter, Escape) to skip boss intro
  useEffect(() => {
    if (!isOpen) return

    // If it's a rematch, allow auto-skip after 800ms
    const autoSkipTimer = setTimeout(
      () => {
        handleProceed()
      },
      isRematch ? 800 : 3500
    )

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
        e.preventDefault()
        handleProceed()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      clearTimeout(autoSkipTimer)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, handleProceed, isRematch])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl"
        >
          {/* Pulsing boss glow aura */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              background: `radial-gradient(circle at center, ${enemy.themeColor} 0%, transparent 65%)`,
            }}
            animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="relative w-full max-w-lg rounded-3xl border-2 bg-neutral-950/95 p-6 sm:p-8 text-center shadow-2xl overflow-hidden"
            style={{
              borderColor: `${enemy.themeColor}80`,
              boxShadow: `0 0 60px ${enemy.themeColor}55`,
            }}
          >
            {/* Warning tag */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-widest border"
                style={{
                  backgroundColor: `${enemy.themeColor}15`,
                  borderColor: `${enemy.themeColor}40`,
                  color: enemy.themeColor,
                }}
              >
                <Skull size={14} className="animate-pulse" />
                {t("battle.bossIntro.warning")}
              </span>
            </div>

            {/* Boss portrait icon */}
            <motion.div
              className="w-24 h-24 rounded-3xl mx-auto mb-4 flex items-center justify-center text-4xl font-black border-2"
              style={{
                background: `linear-gradient(135deg, ${enemy.themeColor}33, ${enemy.accentColor}33)`,
                borderColor: enemy.themeColor,
                boxShadow: `0 0 40px ${enemy.themeColor}66`,
                color: enemy.themeColor,
              }}
              animate={{ rotate: [0, -2, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {enemy.name[0]}
            </motion.div>

            {/* Boss Name & Anime Series */}
            <h2
              className="text-3xl sm:text-4xl font-black tracking-wider uppercase mb-1"
              style={{ color: enemy.themeColor }}
            >
              {enemy.name}
            </h2>
            <p className="text-xs font-mono text-white/50 uppercase tracking-widest mb-4">
              {enemy.anime}
            </p>

            {/* Boss thematic quote */}
            {enemy.description && (
              <p className="text-xs sm:text-sm text-white/70 italic px-4 mb-6 leading-relaxed">
                &ldquo;{enemy.description}&rdquo;
              </p>
            )}

            {/* Target requirement chip */}
            <div className="flex items-center justify-center gap-4 mb-6 text-xs font-mono">
              <span className="text-white/40">
                {t("animeWorld.recommendedSpeed")}:{" "}
                <strong className="text-white">{enemy.recommendedWpm} WPM</strong>
              </span>
              <span className="text-white/20">·</span>
              <span className="text-white/40">
                {t("animeWorld.targetAcc")}:{" "}
                <strong className="text-white">{enemy.recommendedAccuracy}%</strong>
              </span>
            </div>

            {/* Action button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleProceed}
                className="w-full py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider text-black flex items-center justify-center gap-2 shadow-xl hover:scale-102 active:scale-98 transition-transform"
                style={{
                  background: `linear-gradient(135deg, ${enemy.themeColor}, ${enemy.accentColor})`,
                  boxShadow: `0 0 25px ${enemy.themeColor}66`,
                }}
              >
                <Zap size={16} />
                <span>{t("battle.bossIntro.pressToFight")}</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
