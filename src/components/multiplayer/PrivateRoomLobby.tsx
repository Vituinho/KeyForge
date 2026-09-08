"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Swords,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react"
import { MultiplayerPlayer, RoomState } from "@/types/multiplayer"
import {
  subscribeToRoomChannel,
  setPlayerReadyState,
  leaveRoomState,
} from "@/lib/multiplayer/roomManager"
import { useI18n } from "@/lib/i18n/i18nContext"
import { ConnectionStateBadge } from "./ConnectionStateBadge"

interface PrivateRoomLobbyProps {
  room: RoomState
  currentPlayer: MultiplayerPlayer
  onLeaveRoom: () => void
  onStartMatch: (room: RoomState) => void
}

export function PrivateRoomLobby({
  room: initialRoom,
  currentPlayer,
  onLeaveRoom,
  onStartMatch,
}: PrivateRoomLobbyProps) {
  const { t } = useI18n()
  const [room, setRoom] = useState<RoomState>(initialRoom)
  const [copiedCode, setCopiedCode] = useState(false)

  const isHost = room.host.id === currentPlayer.id
  const myReady = isHost ? room.host.ready : room.guest?.ready ?? false
  const bothReady = room.host.ready && Boolean(room.guest?.ready)

  // Supabase Realtime channel subscription
  useEffect(() => {
    const { broadcastRoom, unsubscribe } = subscribeToRoomChannel(
      room.code,
      (updatedRoom) => {
        setRoom(updatedRoom)
      },
      (eventPayload) => {
        if (eventPayload.event === "MATCH_START") {
          onStartMatch(room)
        }
      }
    )

    // Broadcast our latest state to channel
    broadcastRoom(room)

    return () => {
      unsubscribe()
    }
  }, [room.code, onStartMatch, room])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleToggleReady = () => {
    const nextRoom = setPlayerReadyState(room, currentPlayer.id, !myReady)
    setRoom(nextRoom)
    const { broadcastRoom, broadcastEvent, unsubscribe } = subscribeToRoomChannel(
      room.code,
      () => {}
    )
    broadcastRoom(nextRoom)
    broadcastEvent("PLAYER_READY", currentPlayer.id, { ready: !myReady })
    unsubscribe()
  }

  const handleStartDuel = () => {
    if (!isHost || !bothReady) return
    const { broadcastEvent, unsubscribe } = subscribeToRoomChannel(room.code, () => {})
    broadcastEvent("MATCH_START", currentPlayer.id)
    unsubscribe()
    onStartMatch(room)
  }

  const handleExit = () => {
    const nextRoom = leaveRoomState(room, currentPlayer.id)
    const { broadcastRoom, broadcastEvent, unsubscribe } = subscribeToRoomChannel(
      room.code,
      () => {}
    )
    broadcastRoom(nextRoom)
    broadcastEvent("PLAYER_LEFT", currentPlayer.id)
    unsubscribe()
    onLeaveRoom()
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl border border-white/10 bg-neutral-950/80 backdrop-blur-xl shadow-2xl text-white space-y-8">
      {/* Top bar with Room Code */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-[11px] font-mono text-orange-400 font-bold uppercase tracking-widest block">
            {t("multiplayerHub.lobbyRoomTitle")}
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-3xl font-black font-mono tracking-wider text-white">
              {room.code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors cursor-pointer"
              title="Copy Room Code"
            >
              {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ConnectionStateBadge
            state={
              bothReady
                ? "ready"
                : room.guest
                ? "opponent_found"
                : "waiting"
            }
          />
          <button
            type="button"
            onClick={handleExit}
            className="py-2 px-3.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut size={14} />
            <span>{t("multiplayerHub.lobbyLeaveRoom")}</span>
          </button>
        </div>
      </div>

      {/* VS Duel Shinobi Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
        {/* HOST CARD (Left 2 cols) */}
        <div className="md:col-span-2 p-5 rounded-3xl border border-orange-500/30 bg-orange-950/20 relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-mono font-bold uppercase">
              {t("multiplayerHub.lobbyHostTitle")}
            </span>
            {room.host.ready ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-bold">
                <CheckCircle2 size={15} />
                {t("multiplayerHub.lobbyReadyBadge")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-white/40 font-mono text-xs font-bold">
                <Clock size={15} />
                {t("multiplayerHub.lobbyNotReadyBadge")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-xl text-black shadow-lg">
              {room.host.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-lg font-black text-white">{room.host.username}</h4>
              <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
                <span>Lv. {room.host.level}</span>
                <span>•</span>
                <span className="text-orange-400 font-bold">Rank {room.host.rank}</span>
              </div>
            </div>
          </div>
        </div>

        {/* VS CENTER ICON (Center 1 col) */}
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_25px_rgba(249,115,22,0.2)]"
          >
            <Swords className="w-8 h-8 text-orange-400" />
          </motion.div>
          <span className="font-black text-xs font-mono text-white/30 tracking-widest mt-2 uppercase">
            DUEL
          </span>
        </div>

        {/* GUEST CARD (Right 2 cols) */}
        <div className="md:col-span-2 p-5 rounded-3xl border border-white/10 bg-white/[0.02] relative overflow-hidden space-y-4">
          {room.guest ? (
            <>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold uppercase">
                  {t("multiplayerHub.lobbyChallengerTitle")}
                </span>
                {room.guest.ready ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-bold">
                    <CheckCircle2 size={15} />
                    {t("multiplayerHub.lobbyReadyBadge")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-white/40 font-mono text-xs font-bold">
                    <Clock size={15} />
                    {t("multiplayerHub.lobbyNotReadyBadge")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center font-black text-xl text-black shadow-lg">
                  {room.guest.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">{room.guest.username}</h4>
                  <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
                    <span>Lv. {room.guest.level}</span>
                    <span>•</span>
                    <span className="text-blue-400 font-bold">Rank {room.guest.rank}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              <p className="text-xs font-bold text-white/70">
                {t("multiplayerHub.lobbyWaitingGuest")}
              </p>
              <p className="text-[11px] text-white/30 max-w-xs">
                {t("multiplayerHub.lobbyShareCodeTip")}{" "}
                <span className="font-mono font-bold text-white/60">{room.code}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Notice & Match Launch Button */}
      <div className="space-y-4 pt-4 border-t border-white/10 text-center">
        {bothReady && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold max-w-md mx-auto">
            {t("multiplayerHub.lobbyBothReadyNotice")}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
          {/* Ready Toggle */}
          <button
            type="button"
            onClick={handleToggleReady}
            className={`py-3 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              myReady
                ? "bg-white/10 hover:bg-white/15 border border-white/20 text-white"
                : "bg-emerald-500 hover:bg-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.35)]"
            }`}
          >
            {myReady ? t("multiplayerHub.lobbyCancelReady") : t("multiplayerHub.lobbyToggleReady")}
          </button>

          {/* Host Start Duel Button */}
          {isHost && (
            <button
              type="button"
              disabled={!bothReady}
              onClick={handleStartDuel}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>{t("multiplayerHub.lobbyStartMatch")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
