"use client"

import { useState } from "react"
import { usePlayer } from "@/hooks/usePlayer"
import { RANK_METADATA } from "@/lib/progression/calculateRank"
import { getXpRequiredForLevel } from "@/lib/progression/calculateLevel"
import { clearBattleHistory } from "@/lib/storage/battleHistoryStorage"
import {
  User,
  ChevronLeft,
  Sparkles,
  Shield,
  Calendar,
  Check,
  Edit2,
  BarChart2,
  Swords,
  AlertTriangle,
  Trash2,
  Trophy,
  ChevronRight,
  Lock,
  Star,
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { getAllWorlds, getWorldProgress } from "@/data/worlds"
import { useI18n } from "@/lib/i18n/i18nContext"

function formatDate(iso: string, locale: string, unknownText = "Unknown"): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(locale === "pt-BR" ? "pt-BR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return unknownText
  }
}

export default function ProfilePage() {
  const { t, locale } = useI18n()
  const { player, updatePlayer, reset } = usePlayer()

  const [usernameInput, setUsernameInput] = useState(player.username)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const rankMeta = RANK_METADATA[player.rank]
  const xpNeeded = getXpRequiredForLevel(player.level)
  const xpProgress = Math.min(100, Math.round((player.xp / xpNeeded) * 100))

  const handleConfirmReset = () => {
    reset()
    clearBattleHistory()
    setShowResetModal(false)
    setUsernameInput("Player")
    setResetSuccess(true)
    setTimeout(() => setResetSuccess(false), 3000)
  }

  const handleSaveUsername = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = usernameInput.trim()

    if (trimmed.length < 2) {
      setErrorMsg(t("profile.nameMinLength"))
      return
    }
    if (trimmed.length > 20) {
      setErrorMsg(t("profile.nameMaxLength"))
      return
    }

    updatePlayer((prev) => ({
      ...prev,
      username: trimmed,
    }))

    setErrorMsg(null)
    setIsEditingUsername(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 max-w-4xl mx-auto space-y-8">
      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              className="relative w-full max-w-md p-6 rounded-3xl border border-red-500/30 bg-neutral-950 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)] space-y-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {t("profile.resetModalTitle")}
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                {t("profile.resetModalDesc")}
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs transition-colors"
                >
                  {t("profile.cancelResetBtn")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                  <Trash2 size={14} />
                  <span>{t("profile.confirmResetBtn")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Success Notification */}
      {resetSuccess && (
        <motion.div
          className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Check size={16} />
          <span>{t("profile.resetSuccess")}</span>
        </motion.div>
      )}

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/game"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ChevronLeft size={16} />
          <span>{t("profile.backBtn")}</span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/statistics"
            className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors bg-pink-500/10 hover:bg-pink-500/15 px-3 py-1.5 rounded-lg border border-pink-500/20"
          >
            <BarChart2 size={14} />
            <span>{t("profile.viewStats")}</span>
          </Link>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden space-y-6">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-15"
          style={{ backgroundColor: rankMeta.color }}
        />

        {/* Identity & Avatar Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Rank Avatar Shield */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl border shadow-xl shrink-0"
              style={{
                backgroundColor: `${rankMeta.color}20`,
                borderColor: rankMeta.color,
                color: rankMeta.color,
                boxShadow: `0 0 30px ${rankMeta.glow}`,
              }}
            >
              {player.rank}
            </div>

            {/* Username display / edit */}
            <div className="space-y-1">
              {isEditingUsername ? (
                <form onSubmit={handleSaveUsername} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value)
                      setErrorMsg(null)
                    }}
                    placeholder={t("profile.usernamePlaceholder")}
                    maxLength={20}
                    autoFocus
                    className="px-3 py-1 rounded-xl bg-black/60 border border-orange-500/50 text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs transition-colors"
                    title={t("profile.saveUsername")}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameInput(player.username)
                      setIsEditingUsername(false)
                      setErrorMsg(null)
                    }}
                    className="px-2.5 py-1 text-xs text-white/40 hover:text-white transition-colors"
                  >
                    {t("profile.cancelBtn")}
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {player.username}
                  </h1>
                  <button
                    onClick={() => {
                      setUsernameInput(player.username)
                      setIsEditingUsername(true)
                    }}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                    title={t("profile.editUsername")}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}

              {errorMsg && <p className="text-xs text-red-400 font-bold">{errorMsg}</p>}
              {saveSuccess && (
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={12} />
                  <span>{t("profile.saveSuccess")}</span>
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span
                  className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border"
                  style={{
                    backgroundColor: `${rankMeta.color}15`,
                    borderColor: `${rankMeta.color}40`,
                    color: rankMeta.color,
                  }}
                >
                  {t("profile.rankLabel", {
                    rank: player.rank,
                    label: t(`ranks.${player.rank}`),
                  })}
                </span>

                <span className="text-xs text-white/40 font-mono">
                  {t("profile.levelLabel", { level: player.level })}
                </span>

                {player.title && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex items-center gap-1 font-mono">
                    <Sparkles size={11} />
                    {player.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick CTA */}
          <Link
            href="/battle"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)]"
          >
            <Swords size={14} />
            <span>{t("profile.enterBattleBtn")}</span>
          </Link>
        </div>

        {/* XP Progress Bar */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex justify-between text-xs text-white/60 mb-2 font-mono">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles size={13} className="text-amber-400" />
              {t("profile.levelExp", { level: player.level })}
            </span>
            <span>
              {player.xp} / {xpNeeded} XP ({xpProgress}%)
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden p-0.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-white/30 mt-1.5 font-mono">
            <span>
              {t("profile.totalLifetimeXp", {
                xp: player.totalXp.toLocaleString(locale === "pt-BR" ? "pt-BR" : "en-US"),
              })}
            </span>
            <span>
              {t("profile.xpToNextLevel", {
                xp: xpNeeded - player.xp,
                nextLevel: player.level + 1,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Attributes & Skill Ratings */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Shield className="text-amber-400" size={18} />
              <span>{t("profile.combatAttributesTitle")}</span>
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {t("profile.combatAttributesSub")}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 block">
              {t("profile.overallRating")}
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {player.attributes.overall} / 100
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AttributeCard
            title={t("profile.attributes.speed")}
            score={player.attributes.speed}
            desc={t("profile.attributes.speedDesc")}
            color="#f97316"
          />
          <AttributeCard
            title={t("profile.attributes.accuracy")}
            score={player.attributes.accuracy}
            desc={t("profile.attributes.accuracyDesc")}
            color="#22c55e"
          />
          <AttributeCard
            title={t("profile.attributes.technique")}
            score={player.attributes.technique}
            desc={t("profile.attributes.techniqueDesc")}
            color="#06b6d4"
          />
          <AttributeCard
            title={t("profile.attributes.combo")}
            score={player.attributes.combo}
            desc={t("profile.attributes.comboDesc")}
            color="#ec4899"
          />
        </div>
      </div>

      {/* Campaign Progression & Achievements Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                {t("profile.campaignSectionTitle")}
              </h2>
              <p className="text-xs text-white/50">
                {t("profile.campaignSectionSub")}
              </p>
            </div>
          </div>

          <Link
            href="/anime-world"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <span>{t("animeWorld.hubTitle")}</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Global Campaign Telemetry Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono text-white/40 block">
              {t("animeWorld.activeWorld")}
            </span>
            <span className="text-lg font-black text-orange-400 font-mono">
              {player.worldsUnlocked ?? 1} / 7
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono text-white/40 block">
              {t("animeWorld.clearedBadge")}
            </span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {player.worldsCompleted ?? 0} / 7
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono text-white/40 block">
              {t("animeWorld.masteredBadge")}
            </span>
            <span className="text-lg font-black text-yellow-400 font-mono">
              {player.worldMastery ?? 0} / 7
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
            <span className="text-[10px] uppercase font-mono text-white/40 block">
              {t("animeWorld.stagesCleared")}
            </span>
            <span className="text-lg font-black text-white font-mono">
              {player.totalStagesCleared ?? 0} / 56
            </span>
          </div>
        </div>

        {/* 7 Anime Worlds Campaign Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {getAllWorlds().map((world) => {
            const progress = getWorldProgress(world.id, player)
            return (
              <Link
                key={world.id}
                href={progress.unlocked ? `/anime-world/${world.id}` : "/anime-world"}
                className={`p-4 rounded-2xl border transition-all ${
                  progress.unlocked
                    ? "bg-black/40 border-white/10 hover:border-white/20 hover:scale-[1.01]"
                    : "bg-black/20 border-white/5 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: world.theme.primaryColor }}
                    />
                    <span className="text-sm font-bold text-white">{world.series}</span>
                  </div>
                  {progress.mastered ? (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[9px] font-black uppercase font-mono">
                      {t("animeWorld.masteredBadge")}
                    </span>
                  ) : progress.completed ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase font-mono">
                      {t("animeWorld.clearedBadge")}
                    </span>
                  ) : progress.unlocked ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-black uppercase font-mono">
                      {progress.stagesClearedCount} / {progress.totalStages}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 text-[9px] font-black uppercase font-mono flex items-center gap-1">
                      <Lock size={10} />
                      {t("animeWorld.lockedWorld")}
                    </span>
                  )}
                </div>

                <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress.progressPercent}%`,
                      background: `linear-gradient(90deg, ${world.theme.primaryColor}, ${world.theme.accentColor})`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                  <span>{progress.stagesClearedCount} / {progress.totalStages} Stages</span>
                  <span className="flex items-center gap-1 text-yellow-400/80">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    {progress.masteryStarsCount} Stars
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Unlocked Campaign Badges & Titles list */}
        <div className="pt-3 border-t border-white/5 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-white/40 font-mono uppercase tracking-wider">
            {t("profile.achievementsLabel")}
          </span>
          {player.achievements && player.achievements.length > 0 ? (
            player.achievements
              .filter((a) => a.includes("_world_"))
              .map((ach) => (
                <span
                  key={ach}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-mono font-bold text-xs"
                >
                  <Trophy size={13} />
                  {ach.replace(/_/g, " ").toUpperCase()}
                </span>
              ))
          ) : (
            <span className="text-xs text-white/30 italic">
              {t("profile.narutoLockedAchievement")}
            </span>
          )}
          {player.title && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono font-bold text-xs">
              <Sparkles size={13} />
              {t("profile.titlePrefix", { title: player.title })}
            </span>
          )}
        </div>
      </div>

      {/* Multiplayer Arena Records Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
              <Swords size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider">
                {t("profile.multiplayerSectionTitle")}
              </h2>
              <p className="text-xs text-white/50">
                {t("profile.multiplayerSectionSub")}
              </p>
            </div>
          </div>

          <Link
            href="/multiplayer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <span>{t("profile.goToArenaBtn")}</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* 4 Telemetry metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-mono text-white/40 block">
              {t("profile.matchesPlayed")}
            </span>
            <span className="text-xl font-black font-mono text-white">
              {player.multiplayerStats?.matchesPlayed ?? 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-mono text-white/40 block">
              {t("profile.pvpWinRate")}
            </span>
            <span className="text-xl font-black font-mono text-emerald-400">
              {player.multiplayerStats?.winRate ?? 0}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-mono text-white/40 block">
              {t("profile.pvpBestWpm")}
            </span>
            <span className="text-xl font-black font-mono text-orange-400">
              {player.multiplayerStats?.bestWpm ?? 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-[10px] uppercase font-mono text-white/40 block">
              {t("profile.pvpBestCombo")}
            </span>
            <span className="text-xl font-black font-mono text-amber-400">
              {player.multiplayerStats?.bestCombo ?? 0}x
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Progress Reset */}
      <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-red-400 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{t("profile.dangerZone")}</span>
          </h3>
          <p className="text-xs text-white/40 mt-1 max-w-md">
            {t("profile.dangerDesc")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-black text-xs transition-colors shrink-0"
        >
          <Trash2 size={14} />
          <span>{t("profile.resetBtn")}</span>
        </button>
      </div>

      {/* Account Info Footer */}
      <div className="p-5 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between flex-wrap gap-4 text-xs text-white/40">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-white/30" />
          <span>
            {t("profile.warriorCreated", {
              date: formatDate(player.createdAt, locale, t("profile.unknown")),
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <User size={14} className="text-white/30" />
          <span>ID: {player.id}</span>
        </div>
      </div>
    </div>
  )
}

function AttributeCard({
  title,
  score,
  desc,
  color,
}: {
  title: string
  score: number
  desc: string
  color: string
}) {
  return (
    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white uppercase tracking-wider">{title}</span>
        <span className="text-lg font-black font-mono" style={{ color }}>
          {score} / 100
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <p className="text-[11px] text-white/40">{desc}</p>
    </div>
  )
}
