"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Globe, Flame, Skull, ArrowRight, Lock } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"

export function LandingAnimeWorldSection() {
  const { t } = useI18n()

  const narutoRoster = [
    { stage: "01", name: "Naruto Uzumaki", focus: "Balanced Warmup", wpm: "30 WPM", color: "#f97316" },
    { stage: "02", name: "Sakura Haruno", focus: "Chakra Precision", wpm: "35 WPM", color: "#ec4899" },
    { stage: "03", name: "Rock Lee", focus: "Eight Gates Burst", wpm: "50 WPM", color: "#22c55e" },
    { stage: "04", name: "Kakashi Hatake", focus: "Copy Ninja Cadence", wpm: "55 WPM", color: "#06b6d4" },
    { stage: "05", name: "Sasuke Uchiha", focus: "Sharingan Combo", wpm: "60 WPM", color: "#8b5cf6" },
    { stage: "06", name: "Itachi Uchiha", focus: "Tsukuyomi Genjutsu", wpm: "65 WPM", color: "#dc2626" },
    { stage: "07", name: "Pain (Nagato)", focus: "Six Paths Endurance", wpm: "70 WPM", color: "#f59e0b" },
    { stage: "08", name: "Madara Uchiha", focus: "Calamity Final Boss", wpm: "80 WPM", color: "#ef4444", isBoss: true },
  ]

  const comingSoonWorlds = [
    { title: "Dragon Ball World", boss: "Frieza", series: "Dragon Ball Z", color: "#f59e0b" },
    { title: "Jujutsu World", boss: "Ryomen Sukuna", series: "Jujutsu Kaisen", color: "#8b5cf6" },
    { title: "Grand Line World", boss: "Kaido", series: "One Piece", color: "#3b82f6" },
    { title: "Shadow Monarch World", boss: "Beru", series: "Solo Leveling", color: "#06b6d4" },
  ]

  return (
    <section id="anime-worlds" className="py-24 px-4 relative bg-black/50 border-t border-white/5">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Globe size={14} />
            <span>{t("landing.animeWorlds.tag")}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {t("landing.animeWorlds.title")}
          </h2>
          <p className="text-sm text-white/50">
            {t("landing.animeWorlds.subtitle")}
          </p>
        </div>

        {/* Featured: Naruto World */}
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                <Flame size={20} />
              </span>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider">
                  World 01: Naruto World
                </h3>
                <p className="text-xs text-white/50 font-mono">
                  {t("landing.animeWorlds.chapter")}
                </p>
              </div>
            </div>

            <Link
              href="/anime-world/naruto"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 hover:bg-orange-500/20 px-4 py-2 rounded-xl border border-orange-500/30"
            >
              <span>{t("landing.animeWorlds.mapBtn").toUpperCase()}</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* 8 Shinobi Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {narutoRoster.map((c, i) => (
              <motion.div
                key={c.name}
                className="p-5 rounded-2xl border border-white/10 bg-neutral-950/70 hover:border-white/20 transition-all space-y-3 relative group overflow-hidden"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white/40">
                    {t("common.stage").toUpperCase()} {c.stage}
                  </span>
                  {c.isBoss ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <Skull size={10} />
                      {t("common.finalBoss").toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-white/50">
                      {c.wpm}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-black text-white group-hover:text-orange-400 transition-colors">
                    {c.name}
                  </h4>
                  <p className="text-xs font-mono text-orange-400/80 mt-0.5">
                    {c.focus}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Coming Soon Worlds */}
        <div className="space-y-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-white/40" />
            <h3 className="text-sm font-black text-white/60 uppercase tracking-wider font-mono">
              {t("landing.animeWorlds.comingSoon").toUpperCase()}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {comingSoonWorlds.map((w) => (
              <div
                key={w.title}
                className="p-5 rounded-2xl border border-white/5 bg-neutral-950/40 space-y-2 opacity-60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider">
                    {w.series}
                  </span>
                  <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
                    {t("common.soon").toUpperCase()}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white">{w.title}</h4>
                <p className="text-xs text-white/40 font-mono">Boss: {w.boss}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
