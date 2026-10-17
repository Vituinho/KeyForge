"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Swords,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  Sparkles,
  Zap,
} from "lucide-react"
import { MultiplayerPlayer, RoomState } from "@/types/multiplayer"
import {
  subscribeToRoomChannel,
  setPlayerReadyState,
  leaveRoomState,
} from "@/lib/multiplayer/roomManager"
import { setPlayerReady,getMatchById,cancelMatch,forfeitMatch } from "@/lib/multiplayer/matchService"
import { backend } from "@/lib/backend/client"
import { subscribeRealtime } from "@/lib/backend/realtime"
import type { MultiplayerMatchRow } from "@/types/database"
import { useI18n } from "@/lib/i18n/i18nContext"
import { ConnectionStateBadge } from "./ConnectionStateBadge"
import { getSkinById, RARITY_DETAILS } from "@/data/keyboardSkins"

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
  const { t, locale } = useI18n()
  const [room, setRoom] = useState<RoomState>(initialRoom)
  const [copiedCode, setCopiedCode] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [verificationFailed,setVerificationFailed]=useState(false)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  const isHost = room.host.id === currentPlayer.id
  const myReady = isHost ? room.host.ready : room.guest?.ready ?? false
  const bothReady = Boolean(room.host.ready && room.guest?.ready)

  // Retrieve equipped skins
  const hostSkin = getSkinById(room.host.skinId || "default_forge")
  const hostRarity = RARITY_DETAILS[hostSkin.rarity] || RARITY_DETAILS.common

  const guestSkin = room.guest
    ? getSkinById(room.guest.skinId || "default_forge")
    : null
  const guestRarity = guestSkin
    ? RARITY_DETAILS[guestSkin.rarity] || RARITY_DETAILS.common
    : null

  const cancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
    setCountdown(null)
  }

  const startCountdownSequence = () => {
    setCountdown(3)
    let currentCount = 3
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }
    countdownTimerRef.current = setInterval(() => {
      currentCount -= 1
      if (currentCount > 0) {
        setCountdown(currentCount)
      } else if (currentCount === 0) {
        setCountdown(0) // "FORGE!"
      } else {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
          countdownTimerRef.current = null
        }
        onStartMatch(room)
      }
    }, 1000)
  }

  // server Realtime channel subscription
  useEffect(() => {
    if(initialRoom.matchId&&!initialRoom.matchId.startsWith('match_')) {
      let active=true,started=false
      const profiles=new Map<string,{id:string;username:string;level:number;rank:string}>()
      const identity=async(id:string)=>{
        if(!profiles.has(id)) {
          const result=await backend<{id:string;username:string;level:number;rank:string}>('players/'+encodeURIComponent(id))
          profiles.set(id,result)
        }
        return profiles.get(id)!
      }
      const refresh=async(incoming?:MultiplayerMatchRow)=>{
        const match=incoming??await getMatchById(initialRoom.matchId!)
        if(!match) throw new Error('Match unavailable')
        const [host,guest]=await Promise.all([identity(match.player_1_id),match.player_2_id?identity(match.player_2_id):null])
        if(!active) return
        const next:RoomState={...initialRoom,host:{...initialRoom.host,...host,ready:match.player_1_ready,skinId:match.player_1_skin_id},
          guest:guest?{...currentPlayer,...guest,isHost:false,ready:match.player_2_ready,skinId:match.player_2_skin_id}:null,
          status:match.status==='cancelled'?'closed':match.player_1_ready&&match.player_2_ready?'ready':'waiting'}
        setRoom(next);setVerificationFailed(false)
        if(match.status==='cancelled') {onLeaveRoom();return}
        if(match.status==='countdown'&&match.started_at) setCountdown(Math.max(0,Math.ceil((new Date(match.started_at).getTime()-Date.now())/1000)))
        if(!started&&(match.status==='playing'||match.status==='finished'||match.status==='countdown'&&match.started_at&&Date.now()>=new Date(match.started_at).getTime())) {started=true;onStartMatch(next)}
      }
      const poll=()=>{void refresh().catch(()=>{if(active) setVerificationFailed(true)})}
      poll();const timer=setInterval(poll,1000)
      const unsubscribe=subscribeRealtime(message=>{if(message.type==='match') void refresh(message.match as MultiplayerMatchRow).catch(()=>{if(active) setVerificationFailed(true)})},initialRoom.matchId)
      return()=>{active=false;clearInterval(timer);unsubscribe()}
    }
    const { broadcastRoom, unsubscribe } = subscribeToRoomChannel(
      room.code,
      (updatedRoom) => {
        setRoom((prev) => {
          const nextState: RoomState = {
            ...updatedRoom,
            host: {
              ...updatedRoom.host,
              skinId: updatedRoom.host.skinId || prev.host.skinId,
            },
            guest: updatedRoom.guest
              ? {
                  ...updatedRoom.guest,
                  skinId: updatedRoom.guest.skinId || prev.guest?.skinId,
                }
              : null,
          }
          const isBothReady = Boolean(nextState.host.ready && nextState.guest?.ready)
          if (isBothReady) {
            startCountdownSequence()
          } else {
            cancelCountdown()
          }
          return nextState
        })
      },
      (eventPayload) => {
        if (eventPayload.event === "MATCH_START") {
          startCountdownSequence()
        } else if (eventPayload.event === "PLAYER_LEFT") {
          cancelCountdown()
        }
      }
    )

    // Broadcast our updated room with skin info
    const enrichedRoom: RoomState = {
      ...room,
      host: {
        ...room.host,
        skinId: isHost ? currentPlayer.skinId : room.host.skinId,
      },
      guest: room.guest
        ? {
            ...room.guest,
            skinId: !isHost ? currentPlayer.skinId : room.guest.skinId,
          }
        : null,
    }
    broadcastRoom(enrichedRoom)

    return () => {
      unsubscribe()
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.code, isHost, currentPlayer.skinId,initialRoom.matchId])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleToggleReady = () => {
    if(room.matchId&&!room.matchId.startsWith('match_')) {
      void setPlayerReady({matchId:room.matchId,isReady:!myReady}).then(m=>{
        setVerificationFailed(false);setRoom(prev=>({...prev,host:{...prev.host,ready:m.player_1_ready},guest:prev.guest?{...prev.guest,ready:m.player_2_ready}:null}))
      }).catch(()=>setVerificationFailed(true))
      return
    }
    const nextRoom = setPlayerReadyState(room, currentPlayer.id, !myReady)
    // Preserve skinId on ready toggle
    if (isHost) {
      nextRoom.host.skinId = currentPlayer.skinId
    } else if (nextRoom.guest) {
      nextRoom.guest.skinId = currentPlayer.skinId
    }
    setRoom(nextRoom)

    const { broadcastRoom, broadcastEvent, unsubscribe } = subscribeToRoomChannel(
      room.code,
      () => {}
    )
    broadcastRoom(nextRoom)
    broadcastEvent("PLAYER_READY", currentPlayer.id, {
      ready: !myReady,
      skinId: currentPlayer.skinId,
    })
    unsubscribe()

    setPlayerReady({
      matchId: room.matchId??room.code,
      isReady: !myReady,
      playerId: currentPlayer.id,
    }).catch((err) => {
      console.warn("[PrivateRoom] Authoritative set ready notice:", err)
    })
  }

  const handleStartDuel = () => {
    if(room.matchId&&!room.matchId.startsWith('match_')) return
    if (!isHost || !bothReady) return
    const { broadcastEvent, unsubscribe } = subscribeToRoomChannel(room.code, () => {})
    broadcastEvent("MATCH_START", currentPlayer.id)
    unsubscribe()
    startCountdownSequence()
  }

  const handleExit = () => {
    if(room.matchId&&!room.matchId.startsWith('match_')) {
      void cancelMatch({matchId:room.matchId}).catch(()=>forfeitMatch({matchId:room.matchId!})).then(onLeaveRoom,onLeaveRoom)
      return
    }
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
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
    <div className="relative w-full max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl border border-white/10 bg-neutral-950/80 backdrop-blur-xl shadow-2xl text-white space-y-8 overflow-hidden">
      {verificationFailed&&<p role="alert" className="text-sm text-red-300">{t('security.unavailable')}</p>}
      {/* Anime Background Auras */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* Top bar with Room Code */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
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
              title={t("multiplayerHub.copyRoomCode")}
            >
              {copiedCode ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
        {/* HOST CARD (Left 2 cols) */}
        <div className="md:col-span-2 p-5 rounded-3xl border border-orange-500/30 bg-orange-950/20 relative overflow-hidden space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-xl text-black shadow-lg">
              {room.host.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="text-lg font-black text-white [overflow-wrap:anywhere]">{room.host.username}</h4>
              <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
                <span>{t("dashboard.quickWidget.level")} {room.host.level}</span>
                <span>•</span>
                <span className="text-orange-400 font-bold">Rank {room.host.rank}</span>
              </div>
            </div>
          </div>

          {/* Host Equipped Keyboard Skin Preview */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">⌨️</span>
              <div>
                <span className="text-[11px] font-mono text-white/90 font-bold block leading-tight">
                  {hostSkin.name}
                </span>
                <span className="text-[9px] font-mono text-white/40 uppercase">
                  {hostSkin.theme}
                </span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border ${hostRarity.bgBadge}`}
            >
              {hostRarity.name[locale]}
            </span>
          </div>
        </div>

        {/* VS CENTER ICON (Center 1 col) */}
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ scale: bothReady ? [1, 1.2, 1] : [1, 1.06, 1] }}
            transition={{ duration: bothReady ? 0.8 : 2, repeat: Infinity }}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              bothReady
                ? "bg-gradient-to-br from-orange-500 to-amber-500 shadow-[0_0_35px_rgba(249,115,22,0.6)]"
                : "bg-white/5 border border-white/10 shadow-[0_0_25px_rgba(249,115,22,0.2)]"
            }`}
          >
            <Swords className={`w-8 h-8 ${bothReady ? "text-black" : "text-orange-400"}`} />
          </motion.div>
          <span className="font-black text-xs font-mono text-white/40 tracking-widest mt-2 uppercase">
            {t("multiplayerHub.duelLabel")}
          </span>
        </div>

        {/* GUEST CARD (Right 2 cols) */}
        <div className="md:col-span-2 p-5 rounded-3xl border border-white/10 bg-white/[0.02] relative overflow-hidden space-y-4">
          {room.guest ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center font-black text-xl text-black shadow-lg">
                  {room.guest.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-black text-white [overflow-wrap:anywhere]">{room.guest.username}</h4>
                  <div className="flex items-center gap-2 text-xs text-white/50 font-mono">
                    <span>{t("dashboard.quickWidget.level")} {room.guest.level}</span>
                    <span>•</span>
                    <span className="text-blue-400 font-bold">Rank {room.guest.rank}</span>
                  </div>
                </div>
              </div>

              {/* Guest Equipped Keyboard Skin Preview */}
              {guestSkin && guestRarity && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⌨️</span>
                    <div>
                      <span className="text-[11px] font-mono text-white/90 font-bold block leading-tight">
                        {guestSkin.name}
                      </span>
                      <span className="text-[9px] font-mono text-white/40 uppercase">
                        {guestSkin.theme}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase border ${guestRarity.bgBadge}`}
                  >
                    {guestRarity.name[locale]}
                  </span>
                </div>
              )}
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

      {/* Status Notice & Match Launch Controls */}
      <div className="relative z-10 space-y-4 pt-4 border-t border-white/10 text-center">
        {bothReady && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold max-w-md mx-auto flex items-center justify-center gap-2">
            <Zap size={15} className="text-emerald-400 animate-bounce" />
            <span>{t("multiplayerHub.lobbyBothReadyNotice")}</span>
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

          {/* Host Manual Force Start Duel Button */}
          {isHost && (
            <button
              type="button"
              disabled={!bothReady || countdown !== null}
              onClick={handleStartDuel}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-30 disabled:cursor-not-allowed text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>{t("multiplayerHub.lobbyStartMatch")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Synchronized Anime Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.2, 1], opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-4"
            >
              {countdown > 0 ? (
                <div className="relative">
                  <div className="text-8xl sm:text-9xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-amber-300 to-red-500 drop-shadow-[0_0_40px_rgba(249,115,22,0.8)]">
                    {countdown}
                  </div>
                  <p className="text-sm font-mono uppercase tracking-widest text-orange-400/80 font-bold mt-2">
                    {t("multiplayerHub.getReadyToType")}
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="text-6xl sm:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 drop-shadow-[0_0_50px_rgba(249,115,22,1)] uppercase">
                    {t("multiplayerArena.fight")}
                  </div>
                  <p className="text-xs font-mono uppercase tracking-widest text-white/80 font-bold mt-2">
                    {t("multiplayerHub.clashOfShinobi")}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
