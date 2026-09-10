"use client"

import { usePlayer } from "@/hooks/usePlayer"
import { useI18n } from "@/lib/i18n/i18nContext"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Globe,
  ChevronLeft,
  Swords,
  Lock,
  Flame,
  ChevronRight,
  Sparkles,
  Star,
  CheckCircle2,
  Zap,
  Target,
  Trophy,
  Activity,
} from "lucide-react"
import {
  getAllWorlds,
  getWorldProgress,
  getRecommendedNextStage,
} from "@/data/worlds"
import { WorldProgressSummary } from "@/types/world"

export default function AnimeWorldHubPage() {
  const { t } = useI18n()
  const { player } = usePlayer()

  const worlds = getAllWorlds()

  // Calculate global campaign totals
  const worldProgressMap: Record<string, WorldProgressSummary> = {}
  let totalUnlockedWorlds = 0
  let totalStagesCleared = 0
  let totalMasteryStarsEarned = 0
  const totalCampaignStages = worlds.length * 8
  const totalCampaignStars = totalCampaignStages * 3

  worlds.forEach((world) => {
    const progress = getWorldProgress(world.id, player)
    worldProgressMap[world.id] = progress
    if (progress.unlocked) totalUnlockedWorlds += 1
    totalStagesCleared += progress.stagesClearedCount
    totalMasteryStarsEarned += progress.masteryStarsCount
  })

  const recommended = getRecommendedNextStage(player)

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/game"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ChevronLeft size={16} />
          <span>{t("common.dashboard")}</span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-purple-300">
            <Globe size={14} className="text-purple-400" />
            <span>
              {t("animeWorld.totalWorldsProgress", {
                unlocked: totalUnlockedWorlds,
                total: worlds.length,
              })}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-300">
            <Trophy size={14} className="text-amber-400" />
            <span>
              {t("animeWorld.totalStagesProgress", {
                cleared: totalStagesCleared,
                total: totalCampaignStages,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Page Title & Mission Statement */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-widest text-purple-400 uppercase">
          <Sparkles size={14} />
          <span>{t("animeWorld.hubTag")}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-3">
          <Globe className="text-purple-400" size={36} />
          <span>{t("animeWorld.hubTitle")}</span>
        </h1>
        <p className="text-white/60 text-sm sm:text-base max-w-3xl leading-relaxed">
          {t("animeWorld.hubDesc")}
        </p>
      </div>

      {/* Recommended Next Stage Hero Banner */}
      {recommended && (
        <motion.div
          className="relative p-6 sm:p-7 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-neutral-900/90 to-neutral-950 backdrop-blur-md overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.15)]"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {t("animeWorld.nextRecommended")}
                </span>
                <span className="text-xs font-mono text-white/50">
                  {recommended.world.series}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{recommended.stage.name}</span>
                <span className="text-purple-400 text-sm font-mono font-normal">
                  (Stage {recommended.stage.stageNumber})
                </span>
              </h2>
              <div className="flex items-center gap-4 text-xs text-white/70 flex-wrap pt-1 font-mono">
                <span className="flex items-center gap-1.5">
                  <Target size={14} className="text-emerald-400" />
                  <span>
                    {t("animeWorld.targetAcc")}: {recommended.stage.recommendedAccuracy}%
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400" />
                  <span>
                    {t("animeWorld.targetSpeed")}: {recommended.stage.recommendedWpm} WPM
                  </span>
                </span>
              </div>
            </div>

            <Link
              href={`/battle?enemy=${recommended.stage.enemyId}`}
              className="flex items-center justify-center gap-2 w-full md:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-black text-sm transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] shrink-0"
            >
              <Swords size={18} />
              <span>{t("animeWorld.continueCampaign")}</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Worlds Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-widest text-white/50 uppercase flex items-center gap-2">
            <Flame size={14} className="text-orange-400" />
            <span>{t("animeWorld.progressionPath")}</span>
          </h2>
          <span className="text-xs font-mono text-white/40">
            {t("animeWorld.totalMasteryProgress", {
              stars: totalMasteryStarsEarned,
              total: totalCampaignStars,
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {worlds.map((world, idx) => {
            const progress = worldProgressMap[world.id]
            const isUnlocked = progress.unlocked
            const isCompleted = progress.completed
            const isMastered = progress.mastered

            // Path to navigate
            const worldRoute =
              world.id === "naruto"
                ? "/anime-world/naruto"
                : `/anime-world/${world.id}`

            return (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={`relative rounded-3xl border p-6 flex flex-col justify-between transition-all overflow-hidden ${
                  isUnlocked
                    ? `${world.theme.cardGradient} ${world.theme.borderClass} shadow-lg`
                    : "border-neutral-800/80 bg-neutral-950/70 opacity-70"
                }`}
                style={{
                  boxShadow: isUnlocked
                    ? `0 0 35px ${world.theme.glowColor}`
                    : undefined,
                }}
              >
                {/* Header row: World Number, Series, Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-white/80 border border-white/15">
                        {t("animeWorld.worldNumber", { number: world.order })}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-white/50 uppercase tracking-wider">
                        {world.series}
                      </span>
                    </div>

                    {/* Status Pill */}
                    {isMastered ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        <Star size={12} className="fill-purple-300" />
                        {t("animeWorld.masteredBadge")}
                      </span>
                    ) : isCompleted ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 size={12} />
                        {t("animeWorld.clearedBadge")}
                      </span>
                    ) : isUnlocked ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <Flame size={12} />
                        {progress.stagesClearedCount > 0
                          ? t("animeWorld.inProgressBadge")
                          : t("animeWorld.availableBadge")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-neutral-800 text-neutral-400 border border-neutral-700">
                        <Lock size={12} />
                        {t("animeWorld.lockedWorld")}
                      </span>
                    )}
                  </div>

                  {/* World Title & Tagline */}
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {t(world.nameKey as Parameters<typeof t>[0])}
                    </h3>
                    <p className="text-xs font-medium text-white/60 mt-0.5">
                      {t(world.taglineKey as Parameters<typeof t>[0])}
                    </p>
                  </div>

                  {/* World Description */}
                  <p className="text-xs text-white/50 leading-relaxed">
                    {t(world.descriptionKey as Parameters<typeof t>[0])}
                  </p>

                  {/* Typing Focus & Difficulty Badges */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${world.theme.badgeClass}`}
                    >
                      <Activity size={12} />
                      <span>{t(world.focusKey as Parameters<typeof t>[0])}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono text-white/50 bg-white/5 border border-white/10">
                      {t("animeWorld.difficultyRating", { rating: world.baseDifficulty })}
                    </span>
                  </div>
                </div>

                {/* Progress & Bottom Actions */}
                <div className="mt-6 pt-4 border-t border-white/10 space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-1.5">
                      <span>
                        {t("animeWorld.stagesProgress", {
                          cleared: progress.stagesClearedCount,
                          total: progress.totalStages,
                        })}
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star size={12} className="fill-amber-400" />
                        <span>
                          {progress.masteryStarsCount} / {progress.totalMasteryStars}
                        </span>
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress.progressPercent}%`,
                          backgroundColor: world.theme.primaryColor,
                        }}
                      />
                    </div>

                    {/* Best stats if recorded */}
                    {progress.bestWpm > 0 && (
                      <div className="text-[11px] font-mono text-white/40 mt-1.5">
                        {t("animeWorld.bestSpeedAcc", {
                          wpm: progress.bestWpm,
                          acc: progress.bestAccuracy,
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Link or Unlock Requirement */}
                  {isUnlocked ? (
                    <Link
                      href={worldRoute}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-black transition-all hover:brightness-110 shadow-md"
                      style={{
                        backgroundColor: world.theme.primaryColor,
                      }}
                    >
                      <Swords size={16} />
                      <span>{t("animeWorld.enterWorld")}</span>
                      <ChevronRight size={14} />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs text-white/40 font-mono">
                      <Lock size={14} className="text-neutral-500 shrink-0" />
                      <span>
                        {t(
                          world.unlockRequirement.descriptionKey as Parameters<
                            typeof t
                          >[0]
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
