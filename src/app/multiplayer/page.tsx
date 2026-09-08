"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Flame,
  Swords,
  ArrowLeft,
  Zap,
  Users,
  Trophy,
  Loader2,
  Copy,
  Check,
  Radio,
  Clock,
  Sparkles,
  Shield,
  HelpCircle,
} from "lucide-react"
import { MultiplayerAuthGuard } from "@/components/multiplayer/MultiplayerAuthGuard"
import { PrivateRoomLobby } from "@/components/multiplayer/PrivateRoomLobby"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { useAuth } from "@/lib/auth/authContext"
import { usePlayer } from "@/hooks/usePlayer"
import { useI18n } from "@/lib/i18n/i18nContext"
import { createInitialRoomState, joinRoomState } from "@/lib/multiplayer/roomManager"
import { RoomState, MultiplayerPlayer } from "@/types/multiplayer"
import { useMultiplayerPresence } from "@/hooks/useMultiplayerPresence"
import { useCosmetics } from "@/hooks/useCosmetics"

function MultiplayerContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { player } = usePlayer()
  const { equippedSkin } = useCosmetics()
  const { t } = useI18n()
  const { onlineCount } = useMultiplayerPresence("in_lobby")

  const [isSearching, setIsSearching] = useState(false)
  const [roomCodeInput, setRoomCodeInput] = useState("")
  const [activeRoom, setActiveRoom] = useState<RoomState | null>(null)
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentPlayer: MultiplayerPlayer = {
    id: user?.id || "player_local",
    username: user?.username || player.username,
    level: player.level,
    rank: player.rank,
    ready: false,
    isHost: false,
    currentWpm: player.stats.bestWpm,
    progress: 0,
    errors: 0,
    combo: 0,
    currentStreak: 0,
    health: 100,
    isAlive: true,
    lastActiveAt: new Date().toISOString(),
  }

  // Initial ELO rating based on rank / level
  const eloRating = 1200 + (player.level - 1) * 25 + Math.round(player.stats.bestWpm * 1.5)

  const handleStartQuickMatch = () => {
    setIsSearching(true)
    setErrorMessage(null)
  }

  const handleCancelQuickMatch = () => {
    setIsSearching(false)
  }

  const handleCreatePrivateRoom = () => {
    const hostPlayer: MultiplayerPlayer = {
      ...currentPlayer,
      isHost: true,
      ready: false,
    }
    const newRoom = createInitialRoomState(hostPlayer)
    setCreatedRoomCode(newRoom.code)
    setActiveRoom(newRoom)
    setErrorMessage(null)
  }

  const handleCopyCode = () => {
    if (!createdRoomCode) return
    navigator.clipboard.writeText(createdRoomCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = roomCodeInput.trim().toUpperCase()
    if (!trimmed.startsWith("KF-") || trimmed.length < 6) {
      setErrorMessage(t("multiplayerHub.invalidRoomCode"))
      return
    }
    setErrorMessage(null)
    const rivalHost: MultiplayerPlayer = {
      id: "host_rival",
      username: "Shinobi Rival",
      level: Math.max(1, player.level),
      rank: player.rank,
      ready: false,
      isHost: true,
      currentWpm: 0,
      progress: 0,
      errors: 0,
      combo: 0,
      currentStreak: 0,
      health: 100,
      isAlive: true,
      lastActiveAt: new Date().toISOString(),
    }
    const joinedRoom = joinRoomState(
      createInitialRoomState(rivalHost, trimmed),
      currentPlayer
    )
    setActiveRoom(joinedRoom)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden selection:bg-orange-500/30 selection:text-orange-200">
      {/* Ambient anime lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-orange-500/15 via-red-600/10 to-transparent blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link
          href="/game"
          className="flex items-center gap-2 group transition-transform active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] transition-all">
            <Flame className="w-5 h-5 text-black" />
          </div>
          <span className="font-black text-xl tracking-wider text-white">
            KEY<span className="text-orange-500">FORGE</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/game"
            className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 font-bold"
          >
            <ArrowLeft size={14} />
            <span>{t("auth.multiplayerGuardReturnToDojo")}</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col justify-center space-y-6">
        {activeRoom ? (
          <PrivateRoomLobby
            room={activeRoom}
            currentPlayer={currentPlayer}
            onLeaveRoom={() => setActiveRoom(null)}
            onStartMatch={(room) => {
              router.push(`/multiplayer/demo?room=${room.code}`)
            }}
          />
        ) : (
          <>
            {/* Player Shinobi Status Ribbon */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-lg flex flex-wrap items-center justify-between gap-4"
            >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500/20 via-red-500/20 to-neutral-900 border border-orange-500/30 flex items-center justify-center font-black text-orange-400">
              {user?.username ? user.username.charAt(0).toUpperCase() : "S"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white tracking-wide">
                  {user?.username || player.username}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[10px] font-bold">
                  Rank {player.rank}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/50 font-mono">
                <span>Lv. {player.level}</span>
                <span>•</span>
                <span className="text-amber-400/90 font-bold">
                  {t("multiplayerHub.eloRating")}: {eloRating}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/locker"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs font-mono"
              title={t("dashboard.quickWidget.locker")}
            >
              <span>⌨️</span>
              <span className="font-bold text-white/90">{equippedSkin.name}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                {equippedSkin.rarity}
              </span>
            </Link>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{t("multiplayerHub.shinobisOnline", { count: onlineCount })}</span>
            </div>
          </div>
        </motion.div>

        {/* Title & Subtitle */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
            <Radio size={13} className="text-orange-400 animate-pulse" />
            <span>{t("multiplayerHub.badge")}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            MULTIPLAYER <span className="text-orange-500">ARENA</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/50 max-w-xl mx-auto">
            {t("multiplayerHub.subtitle")}
          </p>
        </div>

        {/* Action Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center max-w-md mx-auto">
            {errorMessage}
          </div>
        )}

        {/* 3 Main Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CARD 1: QUICK MATCH */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-6 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden ${
              isSearching
                ? "border-orange-500/60 bg-orange-950/20 shadow-[0_0_35px_rgba(249,115,22,0.25)]"
                : "border-white/10 bg-white/[0.02] hover:border-orange-500/30"
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-white">
                  {t("multiplayerHub.quickMatchTitle")}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  {t("multiplayerHub.quickMatchDesc")}
                </p>
              </div>
            </div>

            <div className="pt-6">
              {isSearching ? (
                <div className="space-y-3">
                  <div className="py-3 px-4 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-orange-400" />
                    <span>{t("multiplayerHub.searchingOpponent")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelQuickMatch}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t("multiplayerHub.cancelSearchBtn")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleStartQuickMatch}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(249,115,22,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Swords size={16} />
                  <span>{t("multiplayerHub.findOpponentBtn")}</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* CARD 2: PRIVATE BATTLE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-blue-500/30 transition-all flex flex-col justify-between relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-white">
                  {t("multiplayerHub.privateBattleTitle")}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  {t("multiplayerHub.privateBattleDesc")}
                </p>
              </div>

              {/* Room Code Display if created */}
              <AnimatePresence>
                {createdRoomCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/40 space-y-2"
                  >
                    <span className="text-[10px] uppercase font-mono text-blue-300 font-bold block">
                      {t("multiplayerHub.roomCreatedNotice", { code: "" })}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xl tracking-widest text-white">
                        {createdRoomCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Copy Room Code"
                      >
                        {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleCreatePrivateRoom}
                className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles size={14} />
                <span>{t("multiplayerHub.createRoomBtn")}</span>
              </button>

              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder={t("multiplayerHub.enterRoomPlaceholder")}
                  maxLength={10}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500 transition-colors uppercase"
                />
                <button
                  type="submit"
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  {t("multiplayerHub.joinRoomBtn")}
                </button>
              </form>
            </div>
          </motion.div>

          {/* CARD 3: RANKED SEASON */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col justify-between relative overflow-hidden opacity-80"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-purple-400" />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] font-mono font-bold text-purple-300">
                  {t("multiplayerHub.comingSoonBadge")}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                  <Clock size={12} />
                  <span>{t("multiplayerHub.rankedSeasonBadge")}</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  {t("multiplayerHub.rankedSeasonTitle")}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  {t("multiplayerHub.rankedSeasonDesc")}
                </p>
              </div>
            </div>

            <div className="pt-6">
              <div className="py-2.5 rounded-xl bg-white/5 border border-white/5 text-center text-xs font-mono text-white/40">
                {t("multiplayerHub.comingSoonBadge")}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Arena Rules Section */}
        <div className="pt-2">
          <div className="p-5 rounded-3xl border border-white/5 bg-white/[0.015] backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/60 font-bold">
              <HelpCircle size={15} className="text-orange-400" />
              <span>{t("multiplayerHub.rulesTitle")}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Swords size={14} className="text-orange-400" />
                  {t("multiplayerHub.rule1Title")}
                </span>
                <p className="text-white/40 leading-relaxed">
                  {t("multiplayerHub.rule1Desc")}
                </p>
              </div>

              <div className="space-y-1 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Radio size={14} className="text-blue-400" />
                  {t("multiplayerHub.rule2Title")}
                </span>
                <p className="text-white/40 leading-relaxed">
                  {t("multiplayerHub.rule2Desc")}
                </p>
              </div>

              <div className="space-y-1 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Shield size={14} className="text-amber-400" />
                  {t("multiplayerHub.rule3Title")}
                </span>
                <p className="text-white/40 leading-relaxed">
                  {t("multiplayerHub.rule3Desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 text-center text-xs text-white/30 font-mono">
        KeyForge v2.3 · Multiplayer Arena Foundation
      </footer>
    </div>
  )
}

export default function MultiplayerPage() {
  return (
    <MultiplayerAuthGuard>
      <MultiplayerContent />
    </MultiplayerAuthGuard>
  )
}
