"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { BookOpen, CheckCircle2, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"

export function LandingAcademySection() {
  const { t } = useI18n()

  const leftHandKeys = [
    { key: "A", finger: t("landing.academy.pinky") },
    { key: "S", finger: t("landing.academy.ring") },
    { key: "D", finger: t("landing.academy.middle") },
    { key: "F", finger: t("landing.academy.index") },
  ]

  const rightHandKeys = [
    { key: "J", finger: t("landing.academy.index") },
    { key: "K", finger: t("landing.academy.middle") },
    { key: "L", finger: t("landing.academy.ring") },
    { key: "Ç", finger: t("landing.academy.pinky") },
  ]

  return (
    <section id="academy" className="py-24 px-4 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">
        {/* Left: Home Row Keyboard Visualization */}
        <motion.div
          className="flex-1 w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-emerald-500/25 bg-neutral-950/90 backdrop-blur-xl shadow-[0_0_50px_rgba(16,185,129,0.1)] space-y-6"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                {t("landing.academy.homeRow")}
              </span>
            </div>
            <span className="text-xs font-mono text-white/40">{t("landing.academy.lessonPreview")}</span>
          </div>

          {/* Visual Keyboard Row */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              {/* Left Hand Cluster */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {leftHandKeys.map((k) => (
                  <div
                    key={k.key}
                    className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-neutral-900 border border-emerald-500/40 flex flex-col items-center justify-between py-2 shadow-inner"
                  >
                    <span className="text-lg sm:text-xl font-black text-white font-mono">
                      {k.key}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400/80 uppercase">
                      {k.finger}
                    </span>
                  </div>
                ))}
              </div>

              {/* Space divider */}
              <div className="w-3" />

              {/* Right Hand Cluster */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {rightHandKeys.map((k) => (
                  <div
                    key={k.key}
                    className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-neutral-900 border border-emerald-500/40 flex flex-col items-center justify-between py-2 shadow-inner"
                  >
                    <span className="text-lg sm:text-xl font-black text-white font-mono">
                      {k.key}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400/80 uppercase">
                      {k.finger}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-xs font-mono text-white/40 pt-2">
              {t("landing.academy.restTip")}
            </p>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/60 font-mono">
            <span>{t("landing.academy.interactiveLessons")}</span>
            <span className="text-emerald-400 font-bold">{t("landing.academy.freeTrack")}</span>
          </div>
        </motion.div>

        {/* Right: Pitch */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
            <BookOpen size={14} />
            <span>{t("landing.academy.tag")}</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {t("landing.academy.title")}
            </h2>
            <p className="text-base text-emerald-400/90 font-mono font-bold">
              {t("landing.academy.subtitle")}
            </p>
            <p className="text-sm text-white/60 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t("landing.academy.description")}
            </p>
          </div>

          <div className="space-y-2 text-sm text-white/70 max-w-md mx-auto lg:mx-0 text-left">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{t("landing.academy.check1")}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{t("landing.academy.check2")}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{t("landing.academy.check3")}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center lg:justify-start">
            <Link
              href="/academy"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <span>{t("landing.academy.btn").toUpperCase()}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
