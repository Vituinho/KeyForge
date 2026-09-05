"use client"

import { useState } from "react"
import { usePlayer } from "@/hooks/usePlayer"
import { CHARACTERS } from "@/data/characters"
import { Enemy } from "@/types/character"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useI18n } from "@/lib/i18n/i18nContext"
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
} from "lucide-react"

export default function NarutoWorldMapPage() {
  const { t } = useI18n()
  const { player } = usePlayer()

  const narutoCharacters = CHARACTERS.filter(
    (c) => c.world === "naruto"
  ).sort((a, b) => (a.stage ?? 0) - (b.stage ?? 0))

  const progress = player.campaignProgress?.naruto
  const completedStages = progress?.completedStages ?? []
  const defeatedEnemies = progress?.defeatedEnemies ?? []

  // Check if character is unlocked
  const isCharacterUnlocked = (c: Enemy): boolean => {
    if (!c.stage || c.stage === 1) return true
    const prevStage = c.stage - 1
    const prevCharacter = narutoCharacters.find((char) => char.stage === prevStage)
    return (
      completedStages.includes(prevStage) ||
      (prevCharacter ? defeatedEnemies.includes(prevCharacter.id) : false)
    )
  }

  const isCharacterDefeated = (c: Enemy): boolean => {
    return (
      (c.stage !== undefined && completedStages.includes(c.stage)) ||
      defeatedEnemies.includes(c.id)
    )
  }

  // Auto-select first undefeated unlocked character, or default to Naruto
  const [selectedId, setSelectedId] = useState<string>(() => {
    const nextAvailable = narutoCharacters.find(
      (c) => isCharacterUnlocked(c) && !isCharacterDefeated(c)
    )
    return nextAvailable ? nextAvailable.id : (narutoCharacters[0]?.id ?? "naruto")
  })

  const selectedEnemy =
    narutoCharacters.find((c) => c.id === selectedId) ?? narutoCharacters[0]

  const isSelectedUnlocked = selectedEnemy ? isCharacterUnlocked(selectedEnemy) : false
  const isSelectedDefeated = selectedEnemy ? isCharacterDefeated(selectedEnemy) : false

  const bestScore = selectedEnemy
    ? progress?.bestScores?.[selectedEnemy.id]
    : undefined

  const isFirstClearClaimed = selectedEnemy
    ? progress?.firstClearClaimed?.[selectedEnemy.id] ?? false
    : false

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/anime-world"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ChevronLeft size={16} />
          <span>CAMPAIGN HUB</span>
        </Link>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-white/40">NARUTO WORLD</span>
          <span className="text-orange-400 font-bold">
            {completedStages.length} / {narutoCharacters.length} COMPLETED
          </span>
        </div>
      </div>

      {/* Hero Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-400 font-mono mb-1">
            <Flame size={14} />
            <span>Chapter 1: The Leaf to the War</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {t("animeWorld.narutoMapTitle")}
          </h1>
          <p className="text-white/40 text-xs sm:text-sm mt-1 max-w-xl">
            Overcome each shinobi trial in sequential order. Each battle tests a distinct keyboard mastery discipline.
          </p>
        </div>

        {progress?.completed && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
            <CheckCircle2 size={16} />
            <span>CAMPAIGN MASTERED</span>
          </div>
        )}
      </div>

      {/* Main Campaign Layout: Left Map Path + Right Stage Briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Sequential RPG Path (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase mb-4 flex items-center gap-1.5">
            <Activity size={14} className="text-orange-400" />
            {t("animeWorld.progressionPath")}
          </h2>

          <div className="space-y-3 relative">
            {/* Connecting vertical spine line */}
            <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-orange-500/40 via-purple-500/30 to-red-500/40 pointer-events-none" />

            {narutoCharacters.map((char) => {
              const unlocked = isCharacterUnlocked(char)
              const defeated = isCharacterDefeated(char)
              const isSelected = char.id === selectedEnemy?.id
              const isBoss = char.isBoss

              return (
                <motion.div
                  key={char.id}
                  onClick={() => setSelectedId(char.id)}
                  className={`relative z-10 flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white/10 border-orange-500/60 shadow-[0_0_25px_rgba(249,115,22,0.2)]"
                      : unlocked
                        ? "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
                        : "bg-black/40 border-white/5 opacity-50 cursor-pointer"
                  }`}
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
                            : "bg-orange-500/20 border-orange-500/40 text-orange-400"
                          : "bg-white/5 border-white/10 text-white/30"
                    }`}
                  >
                    {defeated ? (
                      <CheckCircle2 size={22} />
                    ) : unlocked ? (
                      isBoss ? (
                        <Skull size={22} />
                      ) : (
                        <span className="font-mono text-sm font-bold">0{char.stage}</span>
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
                        {char.name}
                      </h3>
                      {isBoss && (
                        <span className="px-2 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase tracking-wider">
                          {t("common.finalBoss").toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-white/40 font-mono mt-0.5">
                      <span>Lvl {char.level}</span>
                      <span>·</span>
                      <span className="capitalize text-orange-400/80 font-bold">
                        {char.typingFocus} focus
                      </span>
                      <span>·</span>
                      <span>{char.recommendedWpm} WPM</span>
                    </div>
                  </div>

                  {/* Right Status Badge */}
                  <div className="shrink-0 text-right">
                    {defeated ? (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {t("common.defeated").toUpperCase()}
                      </span>
                    ) : unlocked ? (
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
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
            {selectedEnemy && (
              <motion.div
                key={selectedEnemy.id}
                className="p-6 rounded-3xl border border-white/15 bg-neutral-950/80 backdrop-blur-md space-y-6 shadow-2xl relative overflow-hidden"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                {/* Glow accent */}
                <div
                  className="absolute top-0 right-0 w-60 h-60 rounded-full blur-[90px] pointer-events-none opacity-20"
                  style={{ backgroundColor: selectedEnemy.themeColor }}
                />

                {/* Card Header */}
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-orange-400 uppercase tracking-widest">
                      {t("animeWorld.stageBriefing", { stage: selectedEnemy.stage ?? 1 })}
                    </span>
                    {selectedEnemy.isBoss && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase tracking-wider">
                        {t("common.finalBoss").toUpperCase()}
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {selectedEnemy.name}
                  </h2>
                  <p className="text-xs text-white/50 leading-relaxed">
                    {selectedEnemy.description}
                  </p>
                </div>

                {/* Requirements Grid */}
                <div className="grid grid-cols-2 gap-3 relative z-10">
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1 flex items-center gap-1">
                      <Zap size={12} className="text-yellow-400" />
                      {t("animeWorld.targetSpeed")}
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {selectedEnemy.recommendedWpm} WPM
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1 flex items-center gap-1">
                      <Target size={12} className="text-emerald-400" />
                      {t("animeWorld.targetAcc")}
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {selectedEnemy.recommendedAccuracy}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/50 border border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-white/40 block mb-1 flex items-center gap-1">
                      <Flame size={12} className="text-orange-400" />
                      {t("animeWorld.combatFocus")}
                    </span>
                    <span className="text-sm font-black text-orange-400 font-mono uppercase">
                      {selectedEnemy.typingFocus}
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
                      <span>{selectedEnemy.mechanics[0].name}</span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      {selectedEnemy.mechanics[0].description}
                    </p>
                  </div>
                )}

                {/* Best Score Record if any */}
                {bestScore && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono space-y-1 relative z-10">
                    <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                      Your Personal Best Record
                    </span>
                    <div className="flex justify-between text-emerald-200">
                      <span>WPM: <strong>{bestScore.bestWpm}</strong></span>
                      <span>Acc: <strong>{bestScore.bestAccuracy}%</strong></span>
                      <span>Combo: <strong>×{bestScore.bestCombo}</strong></span>
                    </div>
                  </div>
                )}

                {/* XP Rewards section */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-white/60 pt-2 border-t border-white/10 relative z-10">
                  <span>Standard Reward: <strong className="text-amber-400 font-bold">+{selectedEnemy.xpReward ?? 50} XP</strong></span>
                  {!isFirstClearClaimed && selectedEnemy.firstClearBonusXp && (
                    <span className="text-emerald-400 font-bold">
                      +{selectedEnemy.firstClearBonusXp} XP 1st Clear
                    </span>
                  )}
                </div>

                {/* Action CTA Button */}
                <div className="relative z-10 pt-2">
                  {isSelectedUnlocked ? (
                    <Link
                      href={`/battle?enemy=${selectedEnemy.id}`}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                    >
                      <Swords size={18} />
                      <span>{isSelectedDefeated ? t("animeWorld.rematchBattle").toUpperCase() : t("animeWorld.startBattle").toUpperCase()}</span>
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white/40">
                        <Lock size={14} />
                        <span>{t("animeWorld.lockedStage").toUpperCase()}</span>
                      </div>
                      <p className="text-[11px] text-white/30">
                        Defeat the previous opponent on the campaign path to unlock this battle.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
