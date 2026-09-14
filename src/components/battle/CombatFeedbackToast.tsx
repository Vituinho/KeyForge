"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CombatFeedbackEvent } from "@/types/progression"
import { Sparkles, Zap, Flame, ShieldAlert } from "lucide-react"

interface CombatFeedbackToastProps {
  event: CombatFeedbackEvent | null
}

export function CombatFeedbackToast({ event }: CombatFeedbackToastProps) {
  if (!event) return null

  const getIcon = () => {
    switch (event.type) {
      case "perfect_sentence":
        return <Sparkles size={16} className="text-emerald-300" />
      case "speed_surge":
        return <Zap size={16} className="text-cyan-300" />
      case "combo_milestone":
        return <Flame size={16} className="text-orange-400" />
      case "boss_phase":
        return <ShieldAlert size={16} className="text-red-400" />
      default:
        return <Sparkles size={16} className="text-white" />
    }
  }

  const getBorderColor = () => {
    switch (event.type) {
      case "perfect_sentence":
        return "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
      case "speed_surge":
        return "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
      case "combo_milestone":
        return "border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
      case "boss_phase":
        return "border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.4)]"
      default:
        return "border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.15)]"
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/90 border backdrop-blur-md ${getBorderColor()}`}
        >
          {getIcon()}
          <span className="text-xs font-black font-mono tracking-wider uppercase text-white">
            {event.title}
          </span>
          {event.subtitle && (
            <span className="text-[11px] font-mono text-white/60">
              {event.subtitle}
            </span>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
