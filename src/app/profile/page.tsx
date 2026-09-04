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
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return "Unknown"
  }
}

export default function ProfilePage() {
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
      setErrorMsg("Username must be at least 2 characters")
      return
    }
    if (trimmed.length > 20) {
      setErrorMsg("Username must be 20 characters or less")
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
                RESET ALL PROGRESS?
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                This action is <strong className="text-red-400">permanent and cannot be undone</strong>. Your Level, XP, Rank, Performance Attributes, Lifetime Statistics, Battle History, and Training records will be wiped back to default.
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                >
                  <Trash2 size={14} />
                  <span>CONFIRM RESET</span>
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
          <span>All player progress and battle records have been safely reset.</span>
        </motion.div>
      )}

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ChevronLeft size={16} />
          <span>RETURN HOME</span>
        </Link>

        <Link
          href="/statistics"
          className="inline-flex items-center gap-2 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors bg-pink-500/10 hover:bg-pink-500/15 px-3 py-1.5 rounded-lg border border-pink-500/20"
        >
          <BarChart2 size={14} />
          <span>VIEW FULL STATISTICS</span>
        </Link>
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
                    placeholder="Enter nickname"
                    maxLength={20}
                    autoFocus
                    className="px-3 py-1 rounded-xl bg-black/60 border border-orange-500/50 text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs transition-colors"
                    title="Save Username"
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
                    Cancel
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
                    title="Edit Username"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}

              {errorMsg && <p className="text-xs text-red-400 font-bold">{errorMsg}</p>}
              {saveSuccess && (
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={12} />
                  <span>Username updated!</span>
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
                  Rank {player.rank} · {rankMeta.label}
                </span>

                <span className="text-xs text-white/40 font-mono">
                  Level <strong className="text-white font-bold">{player.level}</strong>
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
            <span>ENTER BATTLE</span>
          </Link>
        </div>

        {/* XP Progress Bar */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex justify-between text-xs text-white/60 mb-2 font-mono">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles size={13} className="text-amber-400" />
              Level {player.level} Experience
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
            <span>Total Lifetime XP: {player.totalXp.toLocaleString()}</span>
            <span>{xpNeeded - player.xp} XP to Level {player.level + 1}</span>
          </div>
        </div>
      </div>

      {/* Attributes & Skill Ratings */}
      <div className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Shield className="text-amber-400" size={18} />
              <span>KEYBOARD COMBAT ATTRIBUTES</span>
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              Reflects real performance in battles, accuracy discipline, and training drills.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 block">
              Overall Rating
            </span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {player.attributes.overall} / 100
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AttributeCard
            title="Speed"
            score={player.attributes.speed}
            desc="Calculated from average and peak WPM"
            color="#f97316"
          />
          <AttributeCard
            title="Accuracy"
            score={player.attributes.accuracy}
            desc="Heavily weighted at 35% towards Rank"
            color="#22c55e"
          />
          <AttributeCard
            title="Technique"
            score={player.attributes.technique}
            desc="Touch-typing discipline & training consistency"
            color="#06b6d4"
          />
          <AttributeCard
            title="Combo"
            score={player.attributes.combo}
            desc="Uninterrupted streaks and flow state"
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
                Campaign Progression & Shinobi Trials
              </h2>
              <p className="text-xs text-white/50">
                Conquer the Anime World campaigns and defeat legendary bosses
              </p>
            </div>
          </div>

          <Link
            href="/anime-world/naruto"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <span>Open Naruto Map</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Naruto World Campaign Status */}
        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-orange-400">NARUTO WORLD</span>
              {player.campaignProgress?.naruto?.completed ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Check size={10} />
                  8 / 8 COMPLETED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  Stage {player.campaignProgress?.naruto?.currentStage ?? 1} / 8
                </span>
              )}
            </div>

            <span className="text-xs font-mono text-white/60">
              Stages Cleared: {player.campaignProgress?.naruto?.completedStages?.length ?? 0} / 8
            </span>
          </div>

          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(
                  100,
                  (((player.campaignProgress?.naruto?.completedStages?.length ?? 0)) / 8) * 100
                )}%`,
              }}
              transition={{ duration: 0.6 }}
            />
          </div>

          {/* Unlocked Achievements list */}
          <div className="pt-2 border-t border-white/5 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-white/40 font-mono uppercase tracking-wider">Achievements:</span>
            {player.achievements && player.achievements.includes("naruto_world_completed") ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-mono font-bold text-xs">
                <Trophy size={13} />
                Naruto World Champion
              </span>
            ) : (
              <span className="text-xs text-white/30 italic">Defeat Madara Uchiha in Stage 8 to unlock</span>
            )}
            {player.title && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono font-bold text-xs">
                <Sparkles size={13} />
                Title: {player.title}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone: Progress Reset */}
      <div className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-red-400 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>DANGER ZONE</span>
          </h3>
          <p className="text-xs text-white/40 mt-1 max-w-md">
            Permanently clear all save data, including rank progression, battle history, and training statistics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-black text-xs transition-colors shrink-0"
        >
          <Trash2 size={14} />
          <span>RESET PROGRESS</span>
        </button>
      </div>

      {/* Account Info Footer */}
      <div className="p-5 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between flex-wrap gap-4 text-xs text-white/40">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-white/30" />
          <span>Warrior Created: {formatDate(player.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <User size={14} className="text-white/30" />
          <span>Warrior ID: {player.id}</span>
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
