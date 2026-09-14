"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { usePlayer } from "@/hooks/usePlayer"
import { useI18n } from "@/lib/i18n/i18nContext"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft,
  Swords,
  Lock,
  CheckCircle2,
  Skull,
  Zap,
  Target,
  Flame,
  Sparkles,
  Shield,
  Activity,
  ArrowRight,
  Star,
  AlertCircle,
  BookOpen,
} from "lucide-react"
import {
  getWorldById,
  isWorldUnlocked,
  ANIME_WORLD_ORDER,
} from "@/data/worlds"
import { AnimeWorldId, WorldStage } from "@/types/world"
import { WorldIntroModal } from "@/components/campaign/WorldIntroModal"
import { captureWorldEntryBaseline } from "@/lib/progression/baselineService"

export default function AnimeWorldDynamicMapPage() {
  const { t } = useI18n()
  const { player, updatePlayer } = usePlayer()
  const params = useParams()

  const rawWorldId = params?.worldId
  const worldId = (
    Array.isArray(rawWorldId) ? rawWorldId[0] : rawWorldId
  ) as AnimeWorldId

  const world = getWorldById(worldId)
  const [showWorldIntro, setShowWorldIntro] = useState(() => {
    if (!world) return false
    return !player.worldIntroSeen?.[world.id]
  })

  // Capture baseline once on entering this unlocked world
  useEffect(() => {
    if (!world || !isWorldUnlocked(world.id, player)) return

    if (!player.worldBaselines?.[world.id]) {
      const baseline = captureWorldEntryBaseline(player, world.id)
      updatePlayer((prev) => ({
        ...prev,
        worldBaselines: {
          ...prev.worldBaselines,
          [world.id]: baseline,
        },
      }))
    }
  }, [world, player, updatePlayer])

  const handleCloseWorldIntro = useCallback(() => {
    setShowWorldIntro(false)
    if (world && !player.worldIntroSeen?.[world.id]) {
      updatePlayer((prev) => ({
        ...prev,
        worldIntroSeen: {
          ...prev.worldIntroSeen,
          [world.id]: true,
        },
      }))
    }
  }, [world, player.worldIntroSeen, updatePlayer])

  // Progression calculation
  const progress = world ? player.campaignProgress?.[world.id] : undefined
  const completedStages = progress?.completedStages ?? []
  const defeatedEnemies = progress?.defeatedEnemies ?? []

  const isStageUnlocked = (stage: WorldStage): boolean => {
    if (!world) return false
    if (stage.stageNumber === 1) return true
    const prevStageNum = stage.stageNumber - 1
    const prevStageConfig = world.stages.find((s) => s.stageNumber === prevStageNum)
    return (
      completedStages.includes(prevStageNum) ||
      (prevStageConfig ? defeatedEnemies.includes(prevStageConfig.enemyId) : false)
    )
  }

  const isStageDefeated = (stage: WorldStage): boolean => {
    return (
      completedStages.includes(stage.stageNumber) ||
      defeatedEnemies.includes(stage.enemyId)
    )
  }

  // Hook called unconditionally at top of component
  const [selectedStageId, setSelectedStageId] = useState<string>(() => {
    if (!world) return ""
    const nextAvailable = world.stages.find(
      (s) => isStageUnlocked(s) && !isStageDefeated(s)
    )
    return nextAvailable ? nextAvailable.id : (world.stages[0]?.id ?? "")
  })

  // 1. World Not Found fallback
  if (!world) {
    return (
      <div className="min-h-screen bg-black text-white px-4 py-16 max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black">{t("animeWorld.worldNotFound")}</h1>
          <p className="text-white/50 text-sm max-w-md">
            {t("animeWorld.worldNotFoundDesc")}
          </p>
        </div>
        <Link
          href="/anime-world"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all"
        >
          <ChevronLeft size={16} />
          <span>{t("animeWorld.returnToHub")}</span>
        </Link>
      </div>
    )
  }

  // 2. World Locked fallback
  const isUnlocked = isWorldUnlocked(world.id, player)
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-black text-white px-4 py-16 max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 shadow-xl">
          <Lock size={36} />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-white/50">
            {world.series}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            {t(world.nameKey as Parameters<typeof t>[0])}
          </h1>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            {t(world.unlockRequirement.descriptionKey as Parameters<typeof t>[0])}
          </p>
        </div>
        <Link
          href="/anime-world"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all"
        >
          <ChevronLeft size={16} />
          <span>{t("animeWorld.returnToHub")}</span>
        </Link>
      </div>
    )
  }

  // 3. World is Unlocked
  const selectedStage =
    world.stages.find((s) => s.id === selectedStageId) ?? world.stages[0]
  const selectedEnemy = selectedStage?.enemyConfig

  const isSelectedUnlocked = selectedStage ? isStageUnlocked(selectedStage) : false
  const isSelectedDefeated = selectedStage ? isStageDefeated(selectedStage) : false

  const bestScore = selectedStage
    ? progress?.bestScores?.[selectedStage.id] ||
      progress?.bestScores?.[selectedStage.enemyId]
    : undefined

  const isFirstClearClaimed = selectedStage
    ? progress?.firstClearClaimed?.[selectedStage.id] ||
      progress?.firstClearClaimed?.[selectedStage.enemyId] ||
      false
    : false

  const isWorldCompleted =
    Boolean(progress?.completed) || completedStages.length >= world.stages.length

  // Next world in sequence
  const currentWorldIndex = ANIME_WORLD_ORDER.indexOf(world.id)
  const nextWorldId = ANIME_WORLD_ORDER[currentWorldIndex + 1]
  const nextWorld = nextWorldId ? getWorldById(nextWorldId) : undefined

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/anime-world"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ChevronLeft size={16} />
          <span>{t("animeWorld.campaignHub").toUpperCase()}</span>
        </Link>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-white/40">{world.series.toUpperCase()}</span>
          <span
            className="font-bold"
            style={{ color: world.theme.primaryColor }}
          >
            {t("animeWorld.completedCount", {
              count: completedStages.length,
              total: world.stages.length,
            }).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Hero Title Banner */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border ${world.theme.borderClass} ${world.theme.bgGradient} relative overflow-hidden backdrop-blur-md shadow-2xl`}
        style={{
          boxShadow: `0 0 40px ${world.theme.glowColor}`,
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-white/80 border border-white/15">
                {t("animeWorld.worldNumber", { number: world.order })}
              </span>
              <span className="text-xs font-mono font-bold text-white/50 uppercase tracking-wider">
                {world.series}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${world.theme.badgeClass}`}
              >
                <Activity size={10} />
                <span>{t(world.focusKey as Parameters<typeof t>[0])}</span>
              </span>

              <button
                type="button"
                onClick={() => setShowWorldIntro(true)}
                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 hover:bg-white/15 text-white/80 border border-white/15 transition-colors"
              >
                <BookOpen size={11} />
                <span>{t("animeWorld.worldIntro.openLore")}</span>
              </button>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {t(world.nameKey as Parameters<typeof t>[0])}
            </h1>

            <p className="text-xs sm:text-sm font-semibold text-white/75">
              {t(world.taglineKey as Parameters<typeof t>[0])}
            </p>

            <p className="text-xs text-white/60 max-w-2xl leading-relaxed pt-1">
              {t(world.descriptionKey as Parameters<typeof t>[0])}
            </p>
          </div>

          {isWorldCompleted && (
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                <CheckCircle2 size={16} />
                <span>{t("animeWorld.campaignMastered").toUpperCase()}</span>
              </div>
              {nextWorld && (
                <Link
                  href={`/anime-world/${nextWorld.id}`}
                  className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-white/80 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 transition-all font-mono"
                >
                  <span>
                    {t("animeWorld.nextWorldBtn", {
                      name: t(nextWorld.nameKey as Parameters<typeof t>[0]),
                    })}
                  </span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Campaign Layout: Left Map Path + Right Stage Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Sequential RPG Path (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4 flex items-center gap-1.5">
            <Activity
              size={14}
              style={{ color: world.theme.primaryColor }}
            />
            {t("animeWorld.progressionPath")}
          </h2>

          <div className="space-y-3 relative">
            {/* Connecting vertical spine line */}
            <div
              className="absolute left-[39px] top-6 bottom-6 w-0.5 pointer-events-none opacity-40"
              style={{
                background: `linear-gradient(to bottom, ${world.theme.primaryColor}, ${world.theme.accentColor})`,
              }}
            />

            {world.stages.map((stage) => {
              const unlocked = isStageUnlocked(stage)
              const defeated = isStageDefeated(stage)
              const isSelected = stage.id === selectedStage?.id
              const isBoss = stage.isBoss

              return (
                <motion.div
                  key={stage.id}
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`relative z-10 flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/10 shadow-lg"
                      : unlocked
                        ? "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
                        : "bg-black/40 border-white/5 opacity-50"
                  }`}
                  style={{
                    borderColor: isSelected
                      ? world.theme.primaryColor
                      : undefined,
                    boxShadow: isSelected
                      ? `0 0 25px ${world.theme.glowColor}`
                      : undefined,
                  }}
                  whileHover={{ x: unlocked ? 4 : 0 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* Node Icon Avatar */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border relative transition-all ${
                      defeated
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        : unlocked
                          ? isBoss
                            ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
                            : "border-white/20 text-white"
                          : "bg-white/5 border-white/10 text-white/30"
                    }`}
                    style={{
                      backgroundColor:
                        !defeated && unlocked && !isBoss
                          ? `${world.theme.primaryColor}22`
                          : undefined,
                      borderColor:
                        !defeated && unlocked && !isBoss
                          ? `${world.theme.primaryColor}66`
                          : undefined,
                      color:
                        !defeated && unlocked && !isBoss
                          ? world.theme.primaryColor
                          : undefined,
                    }}
                  >
                    {defeated ? (
                      <CheckCircle2 size={22} />
                    ) : unlocked ? (
                      isBoss ? (
                        <Skull size={22} />
                      ) : (
                        <span className="font-mono text-sm font-bold">
                          0{stage.stageNumber}
                        </span>
                      )
                    ) : (
                      <Lock size={18} />
                    )}
                  </div>

                  {/* Character Quick Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`text-sm font-black truncate ${
                          unlocked ? "text-white" : "text-white/40"
                        }`}
                      >
                        {stage.name}
                      </h3>
                      {stage.characterTitle && (
                        <span className="text-[11px] text-white/50 truncate hidden sm:inline">
                          — {stage.characterTitle}
                        </span>
                      )}
                      {isBoss && (
                        <span className="px-2 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase tracking-wider">
                          {t("common.finalBoss").toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-white/40 font-mono mt-0.5">
                      <span>
                        {t("common.level")} {stage.enemyConfig.level}
                      </span>
                      <span>·</span>
                      <span
                        className="font-bold capitalize"
                        style={{ color: world.theme.primaryColor }}
                      >
                        {t("animeWorld.focusTag", {
                          focus:
                            (stage.typingFocus
                              ? t(
                                  `battle.focusTypes.${stage.typingFocus}` as Parameters<
                                    typeof t
                                  >[0]
                                )
                              : "") || stage.typingFocus,
                        })}
                      </span>
                      <span>·</span>
                      <span>{stage.recommendedWpm} WPM</span>
                      <span>·</span>
                      <span>{stage.recommendedAccuracy}% ACC</span>
                    </div>
                  </div>

                  {/* Right Status Badge */}
                  <div className="shrink-0 text-right">
                    {defeated ? (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {t("common.defeated").toUpperCase()}
                      </span>
                    ) : unlocked ? (
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: `${world.theme.primaryColor}15`,
                          borderColor: `${world.theme.primaryColor}40`,
                          color: world.theme.primaryColor,
                        }}
                      >
                        {t("common.available").toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        {t("common.locked").toUpperCase()}
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* RIGHT: Selected Stage Briefing Card (5 cols) */}
        <div className="lg:col-span-5 sticky top-6">
          <AnimatePresence mode="wait">
            {selectedStage && selectedEnemy && (
              <motion.div
                key={selectedStage.id}
                className="p-6 rounded-3xl border border-white/15 bg-neutral-950/80 backdrop-blur-md space-y-6 shadow-2xl relative overflow-hidden"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glow accent */}
                <div
                  className="absolute top-0 right-0 w-60 h-60 rounded-full blur-[90px] pointer-events-none opacity-20"
                  style={{
                    backgroundColor:
                      selectedEnemy.themeColor || world.theme.primaryColor,
                  }}
                />

                {/* Card Header */}
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-mono font-bold uppercase tracking-widest"
                      style={{ color: world.theme.primaryColor }}
                    >
                      {t("animeWorld.stageBriefing", {
                        stage: selectedStage.stageNumber,
                      })}
                    </span>
                    {selectedStage.isBoss && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase tracking-wider">
                        {t("common.finalBoss").toUpperCase()}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {selectedStage.name}
                  </h2>
                  {selectedStage.characterTitle && (
                    <p className="text-xs font-mono font-bold text-white/50">
                      {selectedStage.characterTitle}
                    </p>
                  )}
                  <p className="text-xs text-white/50 leading-relaxed pt-1">
                    {t(
                      `battle.characterDescriptions.${selectedEnemy.id.replace("-", "_")}` as Parameters<
                        typeof t
                      >[0]
                    ) || selectedEnemy.description}
                  </p>
                </div>

                {/* Requirements Grid */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1 flex items-center gap-1">
                      <Zap size={12} className="text-yellow-400" />
                      {t("animeWorld.recommendedSpeed")}
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {selectedStage.recommendedWpm} WPM
                    </span>
                    {selectedStage.masteryObjectives?.find((o) => o.minWpm !== undefined)?.minWpm && (
                      <span className="text-[10px] font-mono text-amber-400/90 block mt-0.5">
                        {t("animeWorld.masteryTarget")}: {selectedStage.masteryObjectives.find((o) => o.minWpm !== undefined)!.minWpm} WPM
                      </span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1 flex items-center gap-1">
                      <Target size={12} className="text-emerald-400" />
                      {t("animeWorld.targetAcc")}
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {selectedStage.recommendedAccuracy}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1 flex items-center gap-1">
                      <Flame
                        size={12}
                        style={{ color: world.theme.primaryColor }}
                      />
                      {t("animeWorld.combatFocus")}
                    </span>
                    <span
                      className="text-sm font-black font-mono uppercase truncate block"
                      style={{ color: world.theme.primaryColor }}
                    >
                      {t(
                        `battle.focusTypes.${selectedStage.typingFocus}` as Parameters<
                          typeof t
                        >[0]
                      ) || selectedStage.typingFocus}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1 flex items-center gap-1">
                      <Shield size={12} className="text-cyan-400" />
                      {t("animeWorld.enemyHp")}
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {selectedEnemy.maxHp} HP
                    </span>
                  </div>
                </div>

                {/* Special Battle Mechanic Note */}
                {selectedEnemy.mechanics && selectedEnemy.mechanics.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1 relative z-10">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <Sparkles size={14} />
                      <span>
                        {t(
                          selectedStage.mechanicKey as Parameters<typeof t>[0]
                        ) || selectedEnemy.mechanics[0].name}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      {t(
                        selectedStage.mechanicSummaryKey as Parameters<typeof t>[0]
                      ) || selectedEnemy.mechanics[0].description}
                    </p>
                  </div>
                )}

                {/* Mastery Objectives */}
                {selectedStage.masteryObjectives &&
                  selectedStage.masteryObjectives.length > 0 && (
                    <div className="space-y-1.5 relative z-10 pt-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 block">
                        {t("animeWorld.objectivesTitle")}
                      </span>
                      <div className="space-y-1">
                        {selectedStage.masteryObjectives.map((obj, i) => (
                          <div
                            key={obj.id}
                            className="flex items-center gap-2 text-xs font-mono text-white/60 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5"
                          >
                            <Star
                              size={12}
                              className={
                                bestScore &&
                                (i === 0 ||
                                  (i === 1 &&
                                    obj.minAccuracy &&
                                    bestScore.bestAccuracy >= obj.minAccuracy) ||
                                  (i === 2 &&
                                    obj.minWpm &&
                                    bestScore.bestWpm >= obj.minWpm))
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-white/20"
                              }
                            />
                            <span>
                              {obj.id === "clear"
                                ? t("animeWorld.objectiveClear")
                                : obj.minAccuracy
                                  ? t("animeWorld.objectiveAcc", {
                                      acc: obj.minAccuracy,
                                    })
                                  : obj.minWpm
                                    ? t("animeWorld.objectiveWpm", {
                                        wpm: obj.minWpm,
                                      })
                                    : obj.minCombo
                                      ? t("animeWorld.objectiveCombo", {
                                          combo: obj.minCombo,
                                        })
                                      : obj.id}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Best Score Record if any */}
                {bestScore && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono space-y-1 relative z-10">
                    <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                      {t("animeWorld.personalBestRecord")}
                    </span>
                    <div className="flex justify-between text-emerald-200">
                      <span>
                        {t("common.wpm")}: <strong>{bestScore.bestWpm}</strong>
                      </span>
                      <span>
                        {t("battle.hud.acc")}:{" "}
                        <strong>{bestScore.bestAccuracy}%</strong>
                      </span>
                      <span>
                        {t("common.combo")}:{" "}
                        <strong>×{bestScore.bestCombo}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* XP Rewards section */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-white/60 pt-2 border-t border-white/10 relative z-10">
                  <span>
                    {t("animeWorld.standardReward", {
                      xp: selectedEnemy.xpReward ?? 50,
                    })}
                  </span>
                  {!isFirstClearClaimed && selectedEnemy.firstClearBonusXp && (
                    <span className="text-emerald-400 font-bold">
                      {t("animeWorld.firstClearBonus", {
                        xp: selectedEnemy.firstClearBonusXp,
                      })}
                    </span>
                  )}
                </div>

                {/* Action CTA Button */}
                <div className="relative z-10 pt-2">
                  {isSelectedUnlocked ? (
                    <Link
                      href={`/battle?enemy=${selectedEnemy.id}`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-black text-sm transition-all text-black hover:brightness-110 shadow-lg"
                      style={{
                        backgroundColor: world.theme.primaryColor,
                        boxShadow: `0 0 25px ${world.theme.glowColor}`,
                      }}
                    >
                      <Swords size={18} />
                      <span>
                        {isSelectedDefeated
                          ? t("animeWorld.rematchBattle").toUpperCase()
                          : t("animeWorld.startBattle").toUpperCase()}
                      </span>
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white/40">
                        <Lock size={14} />
                        <span>{t("animeWorld.lockedStage").toUpperCase()}</span>
                      </div>
                      <p className="text-[11px] text-white/30">
                        {t("animeWorld.lockedStageDesc")}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* World Intro Cinematic Modal */}
      <WorldIntroModal
        world={world}
        isOpen={showWorldIntro}
        onClose={handleCloseWorldIntro}
      />
    </div>
  )
}
