"use client"

import { motion, AnimatePresence } from "framer-motion"
import { PlayerRank } from "@/types/player"
import { RANK_METADATA } from "@/lib/progression/calculateRank"
import { ArrowRight, Sparkles } from "lucide-react"

interface RankUpModalProps {
  prevRank: PlayerRank
  newRank: PlayerRank
  isOpen: boolean
  onClose: () => void
}

export function RankUpModal({ prevRank, newRank, isOpen, onClose }: RankUpModalProps) {
  if (!isOpen) return null

  const prevMeta = RANK_METADATA[prevRank]
  const newMeta = RANK_METADATA[newRank]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          className="relative w-full max-w-sm p-6 rounded-3xl border border-white/20 bg-gradient-to-b from-neutral-900 to-black text-center shadow-[0_0_50px_rgba(249,115,22,0.3)] space-y-5"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            <Sparkles size={14} />
            <span>Mastery Attained</span>
          </div>

          <h2 className="text-3xl font-black text-white tracking-wider">
            RANK UP!
          </h2>

          <p className="text-xs text-white/50">
            Your real-world typing accuracy and speed reached a new tier.
          </p>

          {/* Ranks comparison */}
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex flex-col items-center">
              <span className="text-xs text-white/40 uppercase mb-1">Previous</span>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border"
                style={{
                  color: prevMeta.color,
                  backgroundColor: `${prevMeta.color}15`,
                  borderColor: `${prevMeta.color}40`,
                }}
              >
                {prevRank}
              </div>
              <span className="text-[10px] text-white/40 mt-1">{prevMeta.label}</span>
            </div>

            <ArrowRight size={24} className="text-white/40 mt-2" />

            <div className="flex flex-col items-center">
              <span className="text-xs text-orange-400 font-bold uppercase mb-1">Promoted</span>
              <motion.div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl border shadow-lg"
                style={{
                  color: newMeta.color,
                  backgroundColor: `${newMeta.color}25`,
                  borderColor: newMeta.color,
                  boxShadow: `0 0 25px ${newMeta.glow}`,
                }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {newRank}
              </motion.div>
              <span className="text-xs font-bold text-white mt-1">{newMeta.label}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] cursor-pointer"
          >
            CLAIM PROMOTION
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
