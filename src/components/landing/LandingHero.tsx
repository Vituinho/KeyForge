"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Swords, ArrowRight, Shield, Zap, Target, Flame, Sparkles, Skull } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"

export function LandingHero() {
  const { t } = useI18n()

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 px-4 overflow-hidden">
      {/* Dynamic background lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-orange-600/20 via-amber-500/15 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 relative z-10">
        {/* Left: Copy & CTAs */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-mono font-bold uppercase tracking-widest shadow-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles size={14} />
            <span>{t("landing.hero.badge")}</span>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight text-white leading-none">
              {t("landing.hero.title")}
            </h1>
            <p className="text-xl sm:text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-200 uppercase">
              {t("landing.hero.subtitle")}
            </p>
            <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t("landing.hero.description")}
            </p>
          </motion.div>

          <motion.div
            className="flex items-center justify-center lg:justify-start gap-4 flex-wrap pt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href="/game"
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)] group"
            >
              <Swords size={18} />
              <span>{t("landing.hero.startBtn").toUpperCase()}</span>
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>

            <Link
              href="/login"
              className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm uppercase tracking-wider transition-colors"
            >
              {t("landing.hero.loginBtn").toUpperCase()}
            </Link>
          </motion.div>

          {/* Quick Stats Highlights */}
          <motion.div
            className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-md mx-auto lg:mx-0 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            <div>
              <span className="text-2xl font-black text-white font-mono block">8</span>
              <span className="text-xs text-white/40 font-mono uppercase">{t("landing.hero.shinobiBosses")}</span>
            </div>
            <div>
              <span className="text-2xl font-black text-orange-400 font-mono block">E → SSS</span>
              <span className="text-xs text-white/40 font-mono uppercase">{t("landing.hero.rankSystem")}</span>
            </div>
            <div>
              <span className="text-2xl font-black text-emerald-400 font-mono block">100%</span>
              <span className="text-xs text-white/40 font-mono uppercase">{t("landing.hero.realSkill")}</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Mock Game Battle Interface */}
        <motion.div
          className="flex-1 w-full max-w-lg lg:max-w-none"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="relative rounded-3xl border border-white/15 bg-neutral-950/90 p-5 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden space-y-5">
            {/* Enemy Header Simulation */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                    <Skull size={10} />
                    {t("landing.mock.bossBadge")}
                  </span>
                  <span className="text-xs font-mono text-white/40">LV. 25</span>
                </div>
                <h3 className="text-xl font-black text-red-500 tracking-wide">
                  {t("landing.mock.bossName").toUpperCase()}
                </h3>
                <p className="text-xs text-orange-400/90 font-mono">{t("landing.mock.bossPhase")}</p>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs text-white/40 block">{t("landing.mock.bossHp")}</span>
                <span className="text-sm font-black text-red-400">420 / 1800</span>
              </div>
            </div>

            {/* Boss HP Bar */}
            <div className="space-y-1">
              <div className="h-2.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                  style={{ width: "23%" }}
                />
              </div>
            </div>

            {/* Battle Telemetry HUD */}
            <div className="grid grid-cols-4 gap-2 text-center py-2 bg-black/50 rounded-2xl border border-white/5 font-mono">
              <div className="p-1">
                <span className="text-[10px] text-white/40 block flex items-center justify-center gap-1">
                  <Zap size={10} className="text-orange-400" /> {t("common.wpm")}
                </span>
                <span className="text-base font-black text-orange-400">92</span>
              </div>
              <div className="p-1">
                <span className="text-[10px] text-white/40 block flex items-center justify-center gap-1">
                  <Target size={10} className="text-emerald-400" /> {t("common.accuracy").slice(0, 3).toUpperCase()}
                </span>
                <span className="text-base font-black text-emerald-400">98%</span>
              </div>
              <div className="p-1">
                <span className="text-[10px] text-white/40 block flex items-center justify-center gap-1">
                  <Flame size={10} className="text-amber-400" /> {t("common.combo").toUpperCase()}
                </span>
                <span className="text-base font-black text-amber-400">×28</span>
              </div>
              <div className="p-1">
                <span className="text-[10px] text-white/40 block flex items-center justify-center gap-1">
                  <Shield size={10} className="text-purple-400" /> {t("common.rank").toUpperCase()}
                </span>
                <span className="text-base font-black text-purple-400">S</span>
              </div>
            </div>

            {/* Typing Sentence Box Mock */}
            <div className="p-4 rounded-2xl bg-black/80 border border-white/10 font-mono text-sm leading-relaxed relative">
              <div className="absolute -top-3 right-3 px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-black uppercase tracking-wider animate-bounce">
                {t("landing.mock.strikePopup")}
              </div>
              <span className="text-emerald-400 font-bold">
                {t("landing.mock.sampleTextStart")}
              </span>{" "}
              <span className="bg-orange-500/30 text-white font-black underline decoration-orange-400 underline-offset-4">
                {t("landing.mock.sampleTextWord")}
              </span>{" "}
              <span className="text-white/30">{t("landing.mock.sampleTextEnd")}</span>
            </div>

            {/* Battle Effect Badge */}
            <div className="flex items-center justify-between text-xs font-mono text-white/50 pt-1">
              <span className="text-orange-400 font-bold flex items-center gap-1.5">
                <Sparkles size={12} />
                {t("landing.mock.effectActive").toUpperCase()}
              </span>
              <span>{t("landing.mock.roundInfo")}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
