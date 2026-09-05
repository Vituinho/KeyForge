"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ShieldAlert, UserPlus, LogIn, ArrowLeft, Swords } from "lucide-react"
import { useAuth } from "@/lib/auth/authContext"
import { useI18n } from "@/lib/i18n/i18nContext"

interface MultiplayerAuthGuardProps {
  children: ReactNode
}

export function MultiplayerAuthGuard({ children }: MultiplayerAuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center animate-pulse">
            <Swords className="w-6 h-6 text-orange-400" />
          </div>
          <span className="text-sm font-mono text-white/50 tracking-wider">
            SYNCHRONIZING CHAKRA...
          </span>
        </div>
      </div>
    )
  }

  // Guests or unauthenticated users cannot enter Multiplayer Arena
  if (!isAuthenticated || !user || user.isGuest) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center relative overflow-hidden px-4 selection:bg-orange-500/30 selection:text-orange-200">
        {/* Glowing background auras */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-b from-orange-500/15 via-red-600/10 to-transparent blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 blur-[130px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-orange-500/20 bg-white/[0.03] backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] text-center space-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30 font-mono">
            <ShieldAlert size={14} />
            <span>{t("auth.multiplayerGuardBadge")}</span>
          </div>

          {/* Icon visual */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-orange-500/20 via-red-500/10 to-transparent border border-orange-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.25)]">
            <Swords size={38} className="text-orange-400" />
          </div>

          {/* Title & Description */}
          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t("auth.multiplayerGuardTitle")}
            </h1>
            <p className="text-sm text-white/60 leading-relaxed max-w-md mx-auto">
              {t("auth.multiplayerGuardDesc")}
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register?returnUrl=/multiplayer"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2"
            >
              <UserPlus size={16} />
              <span>{t("auth.multiplayerGuardCreateAccount")}</span>
            </Link>

            <Link
              href="/login?returnUrl=/multiplayer"
              className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={16} className="text-orange-400" />
              <span>{t("auth.multiplayerGuardLogin")}</span>
            </Link>
          </div>

          {/* Return to Dojo */}
          <div className="pt-2 border-t border-white/5">
            <Link
              href="/game"
              className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white transition-colors font-mono uppercase tracking-wider"
            >
              <ArrowLeft size={14} />
              <span>{t("auth.multiplayerGuardReturnToDojo")}</span>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
