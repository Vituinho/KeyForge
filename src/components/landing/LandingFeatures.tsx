"use client"

import { motion } from "framer-motion"
import {
  Swords,
  Globe,
  Skull,
  Dumbbell,
  BookOpen,
  Shield,
  BarChart2,
  Lightbulb,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"

export function LandingFeatures() {
  const { t } = useI18n()

  const features = [
    {
      icon: <Swords size={22} />,
      title: t("landing.features.battlesTitle"),
      description: t("landing.features.battlesDesc"),
      color: "#f97316",
    },
    {
      icon: <Globe size={22} />,
      title: t("landing.features.worldsTitle"),
      description: t("landing.features.worldsDesc"),
      color: "#8b5cf6",
    },
    {
      icon: <Skull size={22} />,
      title: t("landing.features.bossesTitle"),
      description: t("landing.features.bossesDesc"),
      color: "#ef4444",
    },
    {
      icon: <Dumbbell size={22} />,
      title: t("landing.features.trainingTitle"),
      description: t("landing.features.trainingDesc"),
      color: "#f59e0b",
    },
    {
      icon: <BookOpen size={22} />,
      title: t("landing.features.academyTitle"),
      description: t("landing.features.academyDesc"),
      color: "#10b981",
    },
    {
      icon: <Shield size={22} />,
      title: t("landing.features.ranksTitle"),
      description: t("landing.features.ranksDesc"),
      color: "#06b6d4",
    },
    {
      icon: <BarChart2 size={22} />,
      title: t("landing.features.statsTitle"),
      description: t("landing.features.statsDesc"),
      color: "#ec4899",
    },
    {
      icon: <Lightbulb size={22} />,
      title: t("landing.features.adviceTitle"),
      description: t("landing.features.adviceDesc"),
      color: "#3b82f6",
    },
  ]

  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400">
            {t("landing.features.tag")}
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {t("landing.features.title")}
          </h2>
          <p className="text-sm text-white/50">
            {t("landing.features.subtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              className="p-6 rounded-2xl border border-white/10 bg-neutral-950/60 hover:bg-neutral-900/60 hover:border-white/20 transition-all space-y-3 relative group overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${feat.color}18`,
                  borderColor: `${feat.color}40`,
                  color: feat.color,
                }}
              >
                {feat.icon}
              </div>

              <h3 className="text-base font-black text-white tracking-wide">
                {feat.title}
              </h3>

              <p className="text-xs text-white/60 leading-relaxed">
                {feat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
