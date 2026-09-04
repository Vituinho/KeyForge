"use client"

import { useState } from "react"
import { usePlayer } from "@/hooks/usePlayer"
import { RANK_METADATA } from "@/lib/progression/calculateRank"
import { getXpRequiredForLevel } from "@/lib/progression/calculateLevel"
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
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

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
  const { player, updatePlayer } = usePlayer()

  const [usernameInput, setUsernameInput] = useState(player.username)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const rankMeta = RANK_METADATA[player.rank]
  const xpNeeded = getXpRequiredForLevel(player.level)
  const xpProgress = Math.min(100, Math.round((player.xp / xpNeeded) * 100))

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
