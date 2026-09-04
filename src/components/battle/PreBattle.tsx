"use client"

import { motion } from "framer-motion"
import { Enemy } from "@/types/character"
import { Swords, ChevronRight, ChevronLeft } from "lucide-react"
import { usePlayer } from "@/hooks/usePlayer"
import Link from "next/link"

interface PreBattleProps {
  enemy: Enemy
  onFight: () => void
}

export function PreBattle({ enemy, onFight }: PreBattleProps) {
  const { player } = usePlayer()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href={enemy.world ? `/anime-world/${enemy.world}` : "/anime-world"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ChevronLeft size={14} />
          <span>EXIT BATTLE</span>
        </Link>
      </div>

      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${enemy.themeColor} 0%, transparent 70%)`,
        }}
      />

      {/* Typing focus banner */}
      {enemy.typingFocus && (
        <motion.div
          className="relative z-10 mb-8 px-4 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-widest border"
          style={{
            backgroundColor: `${enemy.themeColor}15`,
            borderColor: `${enemy.themeColor}40`,
            color: enemy.themeColor,
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Stage 0{enemy.stage ?? 1} · {enemy.typingFocus} Trial
        </motion.div>
      )}

      {/* VS Layout */}
      <motion.div
        className="relative z-10 flex items-center gap-8 sm:gap-16 flex-wrap justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "backOut" }}
      >
        {/* Player side */}
        <motion.div
          className="text-center"
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 flex items-center justify-center text-3xl font-black mb-4 mx-auto border-2 border-violet-400/50 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
            {player.username[0]?.toUpperCase() ?? "P"}
          </div>
          <p className="font-black text-xl tracking-wider text-white truncate max-w-[150px]">
            {player.username.toUpperCase()}
          </p>
          <p className="text-sm text-white/40 font-mono">
            Rank {player.rank} · Lv. {player.level}
          </p>
        </motion.div>

        {/* VS */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4, type: "spring" }}
        >
          <Swords size={32} className="text-white/30 mb-2" />
          <span className="text-5xl font-black text-white/20 tracking-widest">VS</span>
        </motion.div>

        {/* Enemy side */}
        <motion.div
          className="text-center"
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black mb-4 mx-auto border-2"
            style={{
              background: `linear-gradient(135deg, ${enemy.themeColor}33, ${enemy.accentColor}33)`,
              borderColor: `${enemy.themeColor}66`,
              boxShadow: `0 0 30px ${enemy.themeColor}44`,
              color: enemy.themeColor,
            }}
          >
            {enemy.name[0]}
          </div>
          <p
            className="font-black text-xl tracking-wider"
            style={{ color: enemy.themeColor }}
          >
            {enemy.name.toUpperCase()}
          </p>
          <p className="text-sm text-white/40">{enemy.anime}</p>
        </motion.div>
      </motion.div>

      {/* Enemy stats */}
      <motion.div
        className="relative z-10 mt-12 flex gap-6"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <StatChip label="LEVEL" value={enemy.level} color={enemy.themeColor} />
        <StatChip label="REC. WPM" value={`${enemy.recommendedWpm}+`} color={enemy.themeColor} />
        <StatChip label="REC. ACC" value={`${enemy.recommendedAccuracy}%`} color={enemy.themeColor} />
        <StatChip label="DIFFICULTY" value={enemy.difficulty} color={enemy.themeColor} />
      </motion.div>

      {enemy.description && (
        <motion.p
          className="relative z-10 mt-6 max-w-md text-center text-white/40 text-sm italic px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          &ldquo;{enemy.description}&rdquo;
        </motion.p>
      )}

      {/* FIGHT button */}
      <motion.button
        className="relative z-10 mt-10 flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-xl uppercase tracking-widest text-black transition-transform"
        style={{
          background: `linear-gradient(135deg, ${enemy.themeColor}, ${enemy.accentColor})`,
          boxShadow: `0 0 30px ${enemy.themeColor}66`,
        }}
        onClick={onFight}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
      >
        FIGHT
        <ChevronRight size={22} />
      </motion.button>
    </div>
  )
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  return (
    <div
      className="flex flex-col items-center px-5 py-3 rounded-xl border"
      style={{
        borderColor: `${color}33`,
        background: `${color}0f`,
      }}
    >
      <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">
        {label}
      </span>
      <span className="text-lg font-black mt-0.5" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
