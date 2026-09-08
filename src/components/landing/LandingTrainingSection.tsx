"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Dumbbell, Target, ArrowRight, Sparkles } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"

export function LandingTrainingSection() {
  const { t } = useI18n()

  const weakKeysMock = [
    { key: "A", accuracy: "82%", latency: "380ms", errors: "6", finger: t("landing.training.mockFingerA") },
    { key: "R", accuracy: "87%", latency: "340ms", errors: "4", finger: t("landing.training.mockFingerR") },
    { key: "T", accuracy: "91%", latency: "310ms", errors: "3", finger: t("landing.training.mockFingerT") },
  ]

  return (
    <section id="training" className="py-24 px-4 relative bg-neutral-950/60 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left: Explanation */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Dumbbell size={14} />
            <span>{t("landing.training.tag")}</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {t("landing.training.title")}
            </h2>
            <p className="text-base text-orange-400/90 font-mono font-bold">
              {t("landing.training.subtitle")}
            </p>
            <p className="text-sm text-white/60 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t("landing.training.description")}
            </p>
          </div>

          <div className="pt-2 flex justify-center lg:justify-start">
            <Link
              href="/training"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm uppercase tracking-wider transition-colors"
            >
              <span>{t("landing.training.btn").toUpperCase()}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right: Visual Weakness & Personalized Training Showcase */}
        <div className="flex-1 w-full max-w-lg space-y-4">
          {/* Card: Weakness Diagnostic */}
          <motion.div
            className="p-6 rounded-3xl border border-red-500/30 bg-neutral-900/90 backdrop-blur-md space-y-4 shadow-[0_0_40px_rgba(239,68,68,0.15)]"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                  <Target size={16} />
                </div>
                <h3 className="text-xs font-black tracking-widest text-red-400 uppercase font-mono">
                  {t("landing.training.weakTitle")}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-white/40 uppercase">{t("landing.training.postTelemetry")}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {weakKeysMock.map((item) => (
                <div
                  key={item.key}
                  className="p-4 rounded-2xl bg-black/60 border border-red-500/20 text-center space-y-1.5"
                >
                  <span className="text-3xl font-black text-red-400 block font-mono">
                    {item.key}
                  </span>
                  <div className="text-xs font-mono font-bold text-white">
                    {item.accuracy}
                  </div>
                  <div className="text-[10px] text-white/40 font-mono">
                    {item.latency}
                  </div>
                  <span className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-300">
                    {item.finger}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card: Generated Personalized Training */}
          <motion.div
            className="p-6 rounded-3xl border border-amber-500/30 bg-neutral-900/90 backdrop-blur-md space-y-3 shadow-[0_0_40px_rgba(245,158,11,0.15)]"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Sparkles size={16} />
              </div>
              <h3 className="text-xs font-black tracking-widest text-amber-400 uppercase font-mono">
                {t("landing.training.drillTitle")}
              </h3>
            </div>

            <p className="text-xs text-white/60">
              {t("landing.training.drillSub")}
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-white/90">
                ara ara tar rat art tara rata tara rata
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-white/90">
                at rat art tart rata tara trait trust tract
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
