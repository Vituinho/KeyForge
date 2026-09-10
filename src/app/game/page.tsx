"use client"

import { useMemo } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Swords, Globe, Dumbbell, BookOpen, BarChart2, Zap, Sparkles, ChevronRight, Target } from "lucide-react"
import { PlayerQuickWidget } from "@/components/dashboard/PlayerQuickWidget"
import { DashboardNavCard, DashboardNavItem } from "@/components/dashboard/DashboardNavCard"
import { usePlayer } from "@/hooks/usePlayer"
import { getRecommendedNextStage } from "@/data/worlds"
import { getTopWeakKeys } from "@/lib/worlds/hunterAdaptiveEngine"
import { useI18n } from "@/lib/i18n/i18nContext"

export default function GameDashboardPage() {
  const { t } = useI18n()
  const { player } = usePlayer()

  const nextRecommendation = useMemo(() => getRecommendedNextStage(player), [player])
  const topWeakKeys = useMemo(() => getTopWeakKeys(player.keyErrors ?? {}, 3), [player])

  const navItems: DashboardNavItem[] = [
    {
      href: "/battle",
      icon: <Swords size={22} />,
      label: t("dashboard.cards.battle.title"),
      description: t("dashboard.cards.battle.desc"),
      active: true,
      color: "#f97316",
    },
    {
      href: "/anime-world",
      icon: <Globe size={22} />,
      label: t("dashboard.cards.animeWorld.title"),
      description: t("dashboard.cards.animeWorld.desc"),
      active: true,
      color: "#8b5cf6",
    },
    {
      href: "/multiplayer",
      icon: <Zap size={22} />,
      label: t("dashboard.cards.multiplayer.title"),
      description: t("dashboard.cards.multiplayer.desc"),
      active: true,
      color: "#ef4444",
    },
    {
      href: "/locker",
      icon: <Sparkles size={22} />,
      label: t("dashboard.cards.locker.title"),
      description: t("dashboard.cards.locker.desc"),
      active: true,
      color: "#06b6d4",
    },
    {
      href: "/training",
      icon: <Dumbbell size={22} />,
      label: t("dashboard.cards.training.title"),
      description: t("dashboard.cards.training.desc"),
      active: true,
      color: "#f97316",
    },
    {
      href: "/academy",
      icon: <BookOpen size={22} />,
      label: t("dashboard.cards.academy.title"),
      description: t("dashboard.cards.academy.desc"),
      active: true,
      color: "#10b981",
    },
    {
      href: "/statistics",
      icon: <BarChart2 size={22} />,
      label: t("dashboard.cards.statistics.title"),
      description: t("dashboard.cards.statistics.desc"),
      active: true,
      color: "#ec4899",
    },
  ]

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-orange-500 blur-[120px]" />
      </div>

      {/* Player Profile Quick Widget */}
      <PlayerQuickWidget />

      {/* Logo / Header */}
      <motion.div
        className="relative z-10 text-center mb-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1
          className="text-7xl sm:text-8xl font-black tracking-tighter bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent"
          animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          KEYFORGE
        </motion.h1>
        <motion.p
          className="mt-3 text-lg font-bold tracking-[0.3em] text-white/30 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {t("landing.footer.tagline")}
        </motion.p>
        <motion.p
          className="mt-2 text-sm text-white/20 max-w-sm mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {t("landing.hero.subtitle")}
        </motion.p>
      </motion.div>

      {/* Recommended Next Campaign Stage */}
      {nextRecommendation && (
        <motion.div
          className="relative z-10 w-full max-w-2xl mb-4 p-4 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent backdrop-blur-md flex items-center justify-between gap-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border shrink-0 shadow-lg"
              style={{
                backgroundColor: `${nextRecommendation.world.theme.primaryColor}25`,
                borderColor: `${nextRecommendation.world.theme.primaryColor}60`,
                color: nextRecommendation.world.theme.primaryColor,
              }}
            >
              {nextRecommendation.stage.stageNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400">
                  {t("animeWorld.continueCampaign")}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/60 font-mono">
                  {nextRecommendation.world.series}
                </span>
              </div>
              <h3 className="text-sm font-black text-white">
                {nextRecommendation.stage.name}
              </h3>
              <p className="text-[11px] text-white/50 font-mono">
                {nextRecommendation.stage.typingFocus} · {nextRecommendation.stage.recommendedWpm}+ WPM · {nextRecommendation.stage.recommendedAccuracy}% ACC
              </p>
            </div>
          </div>

          <Link
            href={`/battle?enemy=${nextRecommendation.stage.enemyId}`}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs uppercase tracking-wider transition-all shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.4)]"
          >
            <span>{t("animeWorld.startBattle")}</span>
            <ChevronRight size={14} />
          </Link>
        </motion.div>
      )}

      {/* Weak-Key Training Recommendation */}
      {topWeakKeys.length > 0 && (
        <motion.div
          className="relative z-10 w-full max-w-2xl mb-6 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5 backdrop-blur-md flex items-center justify-between gap-3 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center gap-2">
            <Target size={14} className="text-violet-400 shrink-0" />
            <span className="text-white/70">
              {t("battleResult.weaknessesHeader")}:{" "}
              <strong className="text-violet-300 font-mono tracking-widest">
                {topWeakKeys.map((k) => k.toUpperCase()).join(", ")}
              </strong>
            </span>
          </div>
          <Link
            href={`/training?mode=weak-keys&keys=${topWeakKeys.join(",")}`}
            className="text-violet-400 hover:text-violet-300 font-bold font-mono inline-flex items-center gap-1 shrink-0"
          >
            <span>{t("battleResult.trainBtn")}</span>
            <ChevronRight size={12} />
          </Link>
        </motion.div>
      )}

      {/* Navigation */}
      <motion.div
        className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {navItems.map((item, i) => (
          <DashboardNavCard key={item.label} item={item} index={i} />
        ))}
      </motion.div>

      {/* Version tag */}
      <motion.p
        className="relative z-10 mt-12 text-white/20 text-xs font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {t("dashboard.quickWidget.version")}
      </motion.p>
    </main>
  )
}
