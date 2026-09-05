"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Swords, ArrowRight, Shield, Zap, Sparkles } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-12 bg-black text-white">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-orange-500 blur-[130px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-bold uppercase tracking-widest"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Sparkles size={14} />
          <span>Anime RPG Typing Battles</span>
        </motion.div>

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="space-y-4"
        >
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
            KEYFORGE
          </h1>
          <p className="text-xl sm:text-2xl font-black tracking-[0.2em] text-white/40 uppercase">
            Master your keyboard. Defeat the strongest. Evolve.
          </p>
          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed">
            KeyForge transforms touch typing practice into intense anime RPG battles. The faster
            and more accurately you type, the more devastating damage you deal.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex items-center justify-center gap-4 flex-wrap pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/game"
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)]"
          >
            <Swords size={18} />
            <span>PLAY AS GUEST / START</span>
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm uppercase tracking-wider transition-colors"
          >
            <span>LOGIN</span>
          </Link>

          <Link
            href="/register"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-bold text-sm uppercase tracking-wider transition-colors"
          >
            <span>CREATE ACCOUNT</span>
          </Link>
        </motion.div>

        {/* Highlights */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 text-left max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
              <Zap size={14} />
              <span>Real-Time WPM</span>
            </div>
            <p className="text-xs text-white/50">Your typing speed directly powers your attack damage.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Shield size={14} />
              <span>Precision Focus</span>
            </div>
            <p className="text-xs text-white/50">High accuracy unleashes critical strikes and perfect combos.</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles size={14} />
              <span>RPG Progression</span>
            </div>
            <p className="text-xs text-white/50">Earn XP, level up, unlock ranks E → SSS and titles.</p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
