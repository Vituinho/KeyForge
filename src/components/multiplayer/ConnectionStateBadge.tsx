"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  Radio,
  Swords,
  CheckCircle2,
  RefreshCw,
  WifiOff,
  XCircle,
  Activity,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"

export type MultiplayerConnectionState =
  | "connecting"
  | "waiting"
  | "opponent_found"
  | "ready"
  | "reconnecting"
  | "disconnected"
  | "cancelled"

export interface ConnectionStateBadgeProps {
  state: MultiplayerConnectionState
  pingMs?: number
  variant?: "pill" | "banner" | "modal"
  onRetry?: () => void
  onCancel?: () => void
  className?: string
}

export function ConnectionStateBadge({
  state,
  pingMs,
  variant = "pill",
  onRetry,
  onCancel,
  className = "",
}: ConnectionStateBadgeProps) {
  const { t } = useI18n()

  const config = {
    connecting: {
      label: t("connectionStates.connecting"),
      desc: t("connectionStates.connectingDesc"),
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      dot: "bg-amber-400",
      icon: <Loader2 size={13} className="animate-spin text-amber-400" />,
    },
    waiting: {
      label: t("connectionStates.waiting"),
      desc: t("connectionStates.waitingDesc"),
      color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
      dot: "bg-blue-400",
      icon: <Radio size={13} className="animate-pulse text-blue-400" />,
    },
    opponent_found: {
      label: t("connectionStates.opponentFound"),
      desc: t("connectionStates.opponentFoundDesc"),
      color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      dot: "bg-purple-400",
      icon: <Swords size={13} className="text-purple-400" />,
    },
    ready: {
      label: t("connectionStates.ready"),
      desc: t("connectionStates.readyDesc"),
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      dot: "bg-emerald-400",
      icon: <CheckCircle2 size={13} className="text-emerald-400" />,
    },
    reconnecting: {
      label: t("connectionStates.reconnecting"),
      desc: t("connectionStates.reconnectingDesc"),
      color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
      dot: "bg-orange-400",
      icon: <RefreshCw size={13} className="animate-spin text-orange-400" />,
    },
    disconnected: {
      label: t("connectionStates.disconnected"),
      desc: t("connectionStates.disconnectedDesc"),
      color: "text-red-400 bg-red-500/10 border-red-500/30",
      dot: "bg-red-400",
      icon: <WifiOff size={13} className="text-red-400" />,
    },
    cancelled: {
      label: t("connectionStates.cancelled"),
      desc: t("connectionStates.cancelledDesc"),
      color: "text-white/40 bg-white/5 border-white/10",
      dot: "bg-white/40",
      icon: <XCircle size={13} className="text-white/40" />,
    },
  }[state]

  if (variant === "modal") {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`w-full max-w-sm p-6 rounded-3xl border bg-neutral-950/90 text-center space-y-4 shadow-2xl ${config.color}`}
          >
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-white/5 border border-white/10">
              {config.icon}
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-white">{config.label}</h4>
              <p className="text-xs text-white/50">{config.desc}</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition-colors cursor-pointer"
                >
                  {t("connectionStates.retryBtn")}
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-xs font-bold transition-colors cursor-pointer"
                >
                  {t("multiplayerHub.cancelSearchBtn")}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    )
  }

  if (variant === "banner") {
    return (
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-4 backdrop-blur-md ${config.color} ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/5">{config.icon}</div>
          <div>
            <div className="text-xs font-black text-white tracking-wide">{config.label}</div>
            <div className="text-[11px] text-white/50">{config.desc}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pingMs !== undefined && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-white/40">
              <Activity size={12} className="text-emerald-400" />
              <span>{pingMs}ms</span>
            </div>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {t("connectionStates.retryBtn")}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Default "pill" variant
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-bold ${config.color} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>

      <span className="flex items-center gap-1.5">
        {config.icon}
        <span>{config.label}</span>
      </span>

      {pingMs !== undefined && (
        <>
          <span className="text-white/20">•</span>
          <span className="text-[10px] text-white/50">{pingMs}ms</span>
        </>
      )}
    </div>
  )
}
