"use client"

import { Suspense, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Dumbbell, Zap, Flame, RotateCcw, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { FreeTypingPractice } from "@/components/training/FreeTypingPractice"
import { WeakKeyTraining } from "@/components/training/WeakKeyTraining"
import { useI18n } from "@/lib/i18n/i18nContext"

type TrainingMode = "weak-keys" | "free-practice" | "speed-test"

const COMMON_KEYS = ["A", "S", "D", "F", "J", "K", "L", "R", "T", "E", "I", "O"]

function TrainingContent() {
  const { t } = useI18n()
  const searchParams = useSearchParams()

  // Parse keys from search params: e.g. ?keys=a,r,t
  const initialKeys = useMemo(() => {
    const raw = searchParams.get("keys")
    if (raw) {
      const parsed = raw
        .split(",")
        .map((k) => k.trim().toUpperCase())
        .filter((k) => k.length === 1)
      if (parsed.length > 0) return Array.from(new Set(parsed))
    }
    return ["A", "R", "T"]
  }, [searchParams])

  const [activeMode, setActiveMode] = useState<TrainingMode>("weak-keys")
  const [selectedKeys, setSelectedKeys] = useState<string[]>(initialKeys)
  const [sessionKey, setSessionKey] = useState(0)

  const toggleKey = (k: string) => {
    setSelectedKeys((prev) => {
      if (prev.includes(k)) {
        if (prev.length <= 1) return prev // keep at least 1 key
        return prev.filter((x) => x !== k)
      }
      return [...prev, k]
    })
    setSessionKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-6 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

      {/* Top bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 z-10">
        <Link
          href="/game"
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          {t("training.backBtn")}
        </Link>
        <div className="text-right">
          <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
            {t("training.title")}
          </span>
        </div>
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-8 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          KEYFORGE <span className="text-orange-400">{t("training.trainingTag")}</span>
        </h1>
        <p className="text-white/60 text-sm mt-2 max-w-md mx-auto">
          {t("training.heroDesc")}
        </p>
      </motion.div>

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 mb-8 z-10 max-w-lg w-full">
        <button
          onClick={() => setActiveMode("weak-keys")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeMode === "weak-keys"
              ? "bg-orange-500 text-black shadow-[0_0_15px_rgba(249,115,22,0.4)]"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Dumbbell size={14} />
          {t("training.modes.weakKeys")}
        </button>

        <button
          onClick={() => setActiveMode("free-practice")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeMode === "free-practice"
              ? "bg-orange-500 text-black"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          <Zap size={14} />
          <span>{t("training.modes.freePractice")}</span>
        </button>

        <button
          onClick={() => setActiveMode("speed-test")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeMode === "speed-test"
              ? "bg-orange-500 text-black"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          <Flame size={14} />
          <span>{t("training.modes.speedTest")}</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-3xl z-10">
        {activeMode === "weak-keys" && (
          <div className="space-y-6">
            {/* Quick Key Picker */}
            <div className="p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                  {t("training.selectKeys")}
                </span>
                <button
                  onClick={() => {
                    setSelectedKeys(["A", "R", "T"])
                    setSessionKey((k) => k + 1)
                  }}
                  className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-bold"
                >
                  <RotateCcw size={11} />
                  {t("training.resetDefaults")}
                </button>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {COMMON_KEYS.map((key) => {
                  const isSelected = selectedKeys.includes(key)
                  return (
                    <button
                      key={key}
                      onClick={() => toggleKey(key)}
                      className={`w-9 h-9 rounded-lg font-mono font-bold text-sm transition-all ${
                        isSelected
                          ? "bg-orange-500 text-black shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                          : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/10"
                      }`}
                    >
                      {key}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Weak Key Training Drill */}
            <WeakKeyTraining
              key={sessionKey}
              targetKeys={selectedKeys}
              onRestart={() => setSessionKey((k) => k + 1)}
            />
          </div>
        )}

        {activeMode !== "weak-keys" && <FreeTypingPractice timed={activeMode === "speed-test"} />}

      </div>
    </div>
  )
}

function TrainingLoadingFallback() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen flex items-center justify-center text-white/30 text-sm">
      {t("training.loading")}
    </div>
  )
}

export default function TrainingPage() {
  return (
    <Suspense fallback={<TrainingLoadingFallback />}>
      <TrainingContent />
    </Suspense>
  )
}
