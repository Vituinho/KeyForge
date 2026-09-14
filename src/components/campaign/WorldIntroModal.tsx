"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AnimeWorld } from "@/types/world"
import { useI18n } from "@/lib/i18n/i18nContext"
import { BookOpen, Target, Sparkles, ChevronRight, X } from "lucide-react"

interface WorldIntroModalProps {
  world: AnimeWorld
  isOpen: boolean
  onClose: () => void
}

const INTRO_DURATION_SEC = 8

export function WorldIntroModal({
  world,
  isOpen,
  onClose,
}: WorldIntroModalProps) {
  const { t } = useI18n()
  const [timeLeft, setTimeLeft] = useState(INTRO_DURATION_SEC)

  const handleSkip = useCallback(() => {
    onClose()
  }, [onClose])

  // Timer & Keyboard listener (Space or Escape to skip)
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Escape") {
        e.preventDefault()
        handleSkip()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      clearInterval(interval)
      window.removeEventListener("keydown", handleKeyDown)
      setTimeLeft(INTRO_DURATION_SEC)
    }
  }, [isOpen, onClose, handleSkip])

  const progressPercent = ((INTRO_DURATION_SEC - timeLeft) / INTRO_DURATION_SEC) * 100
  const finalStage = world.stages[world.stages.length - 1]

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
        >
          {/* World thematic radial aura */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `radial-gradient(ellipse at center, ${world.theme.primaryColor} 0%, transparent 70%)`,
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`relative w-full max-w-2xl rounded-3xl border ${world.theme.borderClass} bg-neutral-950/95 p-6 sm:p-8 shadow-2xl overflow-hidden`}
            style={{
              boxShadow: `0 0 50px ${world.theme.glowColor}`,
            }}
          >
            {/* Top Bar: World Number & Skip */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15">
                  {t("animeWorld.worldNumber", { number: world.order })}
                </span>
                <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
                  {world.series}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSkip}
                className="flex items-center gap-1.5 text-xs font-mono text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
              >
                <span>{t("animeWorld.worldIntro.skipButton")}</span>
                <X size={14} />
              </button>
            </div>

            {/* Title & Lore Tagline */}
            <div className="space-y-3 text-center sm:text-left mb-6">
              <h2
                className="text-3xl sm:text-4xl font-black tracking-tight"
                style={{ color: world.theme.primaryColor }}
              >
                {t(world.nameKey as Parameters<typeof t>[0])}
              </h2>
              <p className="text-sm font-semibold text-white/80">
                {t(world.taglineKey as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-xl">
                {t(world.descriptionKey as Parameters<typeof t>[0])}
              </p>
            </div>

            {/* Thematic & Pedagogical Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {/* Pedagogical Focus Card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                  <Target size={15} />
                  <span>{t("animeWorld.worldIntro.pedagogicalFocus").toUpperCase()}</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {t(world.focusKey as Parameters<typeof t>[0])}
                </div>
                <div className="text-[11px] text-white/50">
                  {t("animeWorld.stagesProgress", {
                    cleared: 0,
                    total: world.stages.length,
                  })}
                </div>
              </div>

              {/* World Climax Boss Card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                  <Sparkles size={15} />
                  <span>{t("common.finalBoss").toUpperCase()}</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {finalStage ? finalStage.name : world.series}
                </div>
                <div className="text-[11px] text-white/50">
                  {finalStage?.characterTitle || t("common.status")}
                </div>
              </div>
            </div>

            {/* Bottom Actions & Countdown Progress Bar */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-[11px] font-mono text-white/40 flex items-center gap-1.5">
                  <BookOpen size={13} />
                  {t("animeWorld.worldIntro.pressToSkip", { seconds: timeLeft })}
                </span>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black transition-transform hover:scale-105 active:scale-95 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${world.theme.primaryColor}, ${world.theme.secondaryColor})`,
                    boxShadow: `0 0 20px ${world.theme.glowColor}`,
                  }}
                >
                  <span>{t("animeWorld.worldIntro.enterWorld")}</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: world.theme.primaryColor }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ ease: "linear", duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
