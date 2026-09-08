"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldAlert, HardDrive, Cloud, Trophy, Zap, Target, CheckCircle2 } from "lucide-react"
import { PlayerProfile } from "@/types/player"
import { useI18n } from "@/lib/i18n/i18nContext"

interface ProgressConflictModalProps {
  isOpen: boolean
  localProfile: PlayerProfile
  cloudProfile: PlayerProfile
  onKeepCloud: () => void
  onOverwriteCloud: () => Promise<void>
}

export function ProgressConflictModal({
  isOpen,
  localProfile,
  cloudProfile,
  onKeepCloud,
  onOverwriteCloud,
}: ProgressConflictModalProps) {
  const { t } = useI18n()
  const [isResolving, setIsResolving] = useState(false)

  if (!isOpen) return null

  const handleKeepCloud = () => {
    setIsResolving(true)
    try {
      onKeepCloud()
    } finally {
      setIsResolving(false)
    }
  }

  const handleOverwrite = async () => {
    setIsResolving(true)
    try {
      await onOverwriteCloud()
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-2xl rounded-3xl border border-orange-500/30 bg-neutral-950 p-6 sm:p-8 shadow-[0_0_50px_rgba(249,115,22,0.2)] text-white space-y-6"
        >
          {/* Glowing anime background light */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-orange-500/15 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30 font-mono">
              <ShieldAlert size={14} />
              <span>{t("migration.conflictBadge")}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t("migration.conflictTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-white/60 max-w-lg mx-auto leading-relaxed">
              {t("migration.conflictDesc")}
            </p>
          </div>

          {/* Comparison Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            {/* Local Save Card */}
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col justify-between space-y-4 hover:border-orange-500/30 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-white/10 pb-2.5">
                  <HardDrive size={18} className="text-orange-400" />
                  <span>{t("migration.localSave")}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-white/40 block font-mono">{t("migration.level")}</span>
                    <span className="font-black text-base text-orange-400">Lv. {localProfile.level}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-white/40 block font-mono">{t("migration.battlesWon")}</span>
                    <span className="font-black text-base text-white flex items-center gap-1">
                      <Trophy size={14} className="text-yellow-400" />
                      {localProfile.stats.battlesWon}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-white/40 block font-mono">{t("migration.bestWpm")}</span>
                    <span className="font-black text-base text-white flex items-center gap-1">
                      <Zap size={14} className="text-amber-400" />
                      {localProfile.stats.bestWpm}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-white/40 block font-mono">{t("migration.accuracy")}</span>
                    <span className="font-black text-base text-white flex items-center gap-1">
                      <Target size={14} className="text-emerald-400" />
                      {localProfile.stats.averageAccuracy}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isResolving}
                onClick={handleOverwrite}
                className="w-full py-2.5 px-3 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                <span>{t("migration.overwriteCloudBtn")}</span>
              </button>
            </div>

            {/* Cloud Save Card */}
            <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/[0.03] flex flex-col justify-between space-y-4 hover:border-blue-500/50 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-white/10 pb-2.5">
                  <Cloud size={18} className="text-blue-400" />
                  <span>{t("migration.cloudSave")}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-white/40 block font-mono">{t("migration.level")}</span>
                    <span className="font-black text-base text-blue-400">Lv. {cloudProfile.level}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-white/40 block font-mono">{t("migration.battlesWon")}</span>
                    <span className="font-black text-base text-white flex items-center gap-1">
                      <Trophy size={14} className="text-yellow-400" />
                      {cloudProfile.stats.battlesWon}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-white/40 block font-mono">{t("migration.bestWpm")}</span>
                    <span className="font-black text-base text-white flex items-center gap-1">
                      <Zap size={14} className="text-amber-400" />
                      {cloudProfile.stats.bestWpm}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 space-y-0.5">
                    <span className="text-white/40 block font-mono">{t("migration.accuracy")}</span>
                    <span className="font-black text-base text-white flex items-center gap-1">
                      <Target size={14} className="text-emerald-400" />
                      {cloudProfile.stats.averageAccuracy}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isResolving}
                onClick={handleKeepCloud}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
                <span>{t("migration.keepCloudBtn")}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
