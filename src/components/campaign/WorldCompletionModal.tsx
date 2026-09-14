"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AnimeWorld } from "@/types/world"
import { PlayerProfile } from "@/types/player"
import { useI18n } from "@/lib/i18n/i18nContext"
import { Trophy, Sparkles, TrendingUp, Award, ArrowRight, X, AlertCircle } from "lucide-react"
import Link from "next/link"
import { calculateImprovement } from "@/lib/progression/baselineService"
import { ANIME_WORLD_ORDER, getWorldById } from "@/data/worlds"

interface WorldCompletionModalProps {
  world: AnimeWorld
  isOpen: boolean
  onClose: () => void
  player: PlayerProfile
}

export function WorldCompletionModal({
  world,
  isOpen,
  onClose,
  player,
}: WorldCompletionModalProps) {
  const { t } = useI18n()

  if (!isOpen) return null

  const improvement = calculateImprovement(player, world.id)
  const isUncalibrated = improvement.confidence === "uncalibrated" || !improvement.baselineWpm

  // Next world
  const currentIdx = ANIME_WORLD_ORDER.indexOf(world.id)
  const nextWorldId = ANIME_WORLD_ORDER[currentIdx + 1]
  const nextWorld = nextWorldId ? getWorldById(nextWorldId) : undefined

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto"
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            background: `radial-gradient(ellipse at center, ${world.theme.primaryColor} 0%, transparent 70%)`,
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ duration: 0.4, ease: "backOut" }}
          className={`relative w-full max-w-2xl rounded-3xl border-2 ${world.theme.borderClass} bg-neutral-950/95 p-6 sm:p-8 shadow-2xl space-y-6 my-8`}
          style={{
            boxShadow: `0 0 60px ${world.theme.glowColor}`,
          }}
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.15 }}
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border-2"
              style={{
                background: `linear-gradient(135deg, ${world.theme.primaryColor}33, ${world.theme.secondaryColor}33)`,
                borderColor: world.theme.primaryColor,
                color: world.theme.primaryColor,
                boxShadow: `0 0 30px ${world.theme.glowColor}`,
              }}
            >
              <Trophy size={32} />
            </motion.div>

            <span className="text-xs font-mono font-black uppercase tracking-widest text-amber-400">
              {t("animeWorld.completion.title")}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wide">
              {t(world.nameKey as Parameters<typeof t>[0])}
            </h2>
            <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto">
              {t("animeWorld.completion.subtitle", {
                world: t(world.nameKey as Parameters<typeof t>[0]),
              })}
            </p>
          </div>

          {/* Real Progression Card (Before vs After) */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={15} />
                {t("animeWorld.completion.baselineVsFinal")}
              </span>
              <span className="text-[10px] font-mono text-white/40 uppercase">
                {world.stages.length} / {world.stages.length} Stages
              </span>
            </div>

            {isUncalibrated ? (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {t("animeWorld.completion.uncalibratedNotice")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Speed Comparison */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1 text-center">
                  <span className="text-[11px] font-mono text-white/50 uppercase">
                    {t("animeWorld.completion.speedDelta")}
                  </span>
                  <div className="flex items-center justify-center gap-2 text-lg font-black font-mono">
                    <span className="text-white/50">{improvement.baselineWpm} WPM</span>
                    <ArrowRight size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">{improvement.currentWpm} WPM</span>
                  </div>
                  {improvement.wpmDelta !== null && (
                    <span
                      className={`text-xs font-mono font-bold ${
                        improvement.wpmDelta >= 0 ? "text-emerald-400" : "text-white/40"
                      }`}
                    >
                      {improvement.wpmDelta >= 0 ? `+${improvement.wpmDelta}` : improvement.wpmDelta} WPM
                    </span>
                  )}
                </div>

                {/* Accuracy Comparison */}
                <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1 text-center">
                  <span className="text-[11px] font-mono text-white/50 uppercase">
                    {t("animeWorld.completion.accDelta")}
                  </span>
                  <div className="flex items-center justify-center gap-2 text-lg font-black font-mono">
                    <span className="text-white/50">{improvement.baselineAccuracy}%</span>
                    <ArrowRight size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">{improvement.currentAccuracy}%</span>
                  </div>
                  {improvement.accuracyDelta !== null && (
                    <span
                      className={`text-xs font-mono font-bold ${
                        improvement.accuracyDelta >= 0 ? "text-emerald-400" : "text-white/40"
                      }`}
                    >
                      {improvement.accuracyDelta >= 0
                        ? `+${improvement.accuracyDelta}`
                        : improvement.accuracyDelta}
                      %
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Separate All-Time Personal Best Card */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                <Award size={16} />
                <span className="font-bold">{t("animeWorld.completion.personalBestTitle")}:</span>
              </div>
              <div className="text-xs font-black text-white font-mono">
                {player.bestWpm} WPM · {player.bestAccuracy}% ACC
              </div>
            </div>
          </div>

          {/* Rewards Claimed */}
          {world.completionReward && (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-yellow-300">
                <Sparkles size={14} />
                <span>{t("animeWorld.completion.rewardsClaimed")}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-yellow-500/30 text-yellow-300">
                  +{world.completionReward.xp} XP
                </span>
                {world.completionReward.title && (
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-purple-500/30 text-purple-300">
                    [{world.completionReward.title}]
                  </span>
                )}
                {world.completionReward.crateId && (
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-amber-500/30 text-amber-300">
                    +1 Crate
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-2 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono transition-colors"
            >
              <X size={14} />
              <span>{t("animeWorld.completion.viewMap")}</span>
            </button>

            {nextWorld ? (
              <Link
                href={`/anime-world/${nextWorld.id}`}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black transition-transform hover:scale-105 active:scale-95 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${world.theme.primaryColor}, ${world.theme.secondaryColor})`,
                  boxShadow: `0 0 20px ${world.theme.glowColor}`,
                }}
              >
                <span>
                  {t("animeWorld.nextWorldBtn", {
                    name: t(nextWorld.nameKey as Parameters<typeof t>[0]),
                  })}
                </span>
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                href="/anime-world"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black bg-white hover:bg-white/90 transition-transform"
              >
                <span>{t("animeWorld.campaignHub")}</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
