"use client"

import { usePlayer } from "@/hooks/usePlayer"
import { useI18n } from "@/lib/i18n/i18nContext"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Globe,
  ChevronLeft,
  Swords,
  Lock,
  Flame,
  ChevronRight,
  Sparkles,
} from "lucide-react"

interface ComingSoonWorld {
  id: string
  name: string
  series: string
  boss: string
  description: string
  color: string
}

const COMING_SOON_WORLDS: ComingSoonWorld[] = [
  {
    id: "dragon-ball",
    name: "Dragon Ball World",
    series: "Dragon Ball Z",
    boss: "Frieza (Final Form)",
    description: "Train in extreme gravity and unleash relentless Ki blast typing bursts.",
    color: "#f59e0b",
  },
  {
    id: "jujutsu-kaisen",
    name: "Jujutsu World",
    series: "Jujutsu Kaisen",
    boss: "Ryomen Sukuna",
    description: "Exorcise special grade curses with domain expansion precision keystrokes.",
    color: "#8b5cf6",
  },
  {
    id: "one-piece",
    name: "Grand Line World",
    series: "One Piece",
    boss: "Kaido (King of the Beasts)",
    description: "Sail treacherous seas and clash with emperors through high-seas typing stamina.",
    color: "#3b82f6",
  },
  {
    id: "solo-leveling",
    name: "Shadow Monarch World",
    series: "Solo Leveling",
    boss: "Beru (Ant King)",
    description: "Clear S-Rank dungeon gates and awaken shadow soldiers with lethal accuracy.",
    color: "#06b6d4",
  },
]

export default function AnimeWorldHubPage() {
  const { t, locale } = useI18n()
  const { player } = usePlayer()

  const narutoProgress = player.campaignProgress?.naruto
  const completedStages = narutoProgress?.completedStages?.length ?? 0
  const isCompleted = narutoProgress?.completed ?? false

  const statusLabel = isCompleted
    ? t("animeWorld.completedBadge")
    : completedStages > 0
      ? t("animeWorld.inProgressBadge")
      : t("animeWorld.availableBadge")

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 max-w-5xl mx-auto space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Link
          href="/game"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10"
        >
          <ChevronLeft size={16} />
          <span>{t("common.dashboard")}</span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
          <Globe size={14} className="text-purple-400" />
          <span>{t("animeWorld.hubTag")}</span>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
          <Globe className="text-purple-400" size={32} />
          <span>{t("animeWorld.hubTitle")}</span>
        </h1>
        <p className="text-white/40 text-sm mt-1 max-w-xl">
          {t("animeWorld.hubDesc")}
        </p>
      </div>

      {/* Active World: Naruto World */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
            <Flame size={14} className="text-orange-400" />
            {t("animeWorld.activeWorld")}
          </h2>
          <span className="text-xs font-mono text-orange-400 font-bold">
            {t("animeWorld.seasonActive")}
          </span>
        </div>

        <motion.div
          className="relative p-6 sm:p-8 rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-950/40 via-black to-neutral-950 backdrop-blur-md overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background orange glow */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-orange-500/10 blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/40">
                  {locale === "pt-BR" ? "Mundo 01" : "World 01"}
                </span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    isCompleted
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : completedStages > 0
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        : "bg-white/10 text-white/70 border-white/20"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                NARUTO WORLD
              </h2>
              <p className="text-sm text-white/60 leading-relaxed">
                {locale === "pt-BR"
                  ? "Viaje da Aldeia da Folha até a Quarta Grande Guerra Ninja. Enfrente 8 shinobi icônicos em níveis progressivos de dificuldade, culminando no lendário Chefe Final: Madara Uchiha."
                  : "Journey through the Hidden Leaf Village to the Fourth Great Ninja War. Face 8 iconic shinobi across progressive typing difficulty tiers, culminating in the legendary Final Boss: Madara Uchiha."}
              </p>

              <div className="flex items-center gap-6 pt-2 flex-wrap text-xs text-white/50 font-mono">
                <div>
                  <span className="text-white/30 block text-[10px] uppercase">
                    {t("animeWorld.stagesCleared")}
                  </span>
                  <strong className="text-white text-base">{completedStages} / 8</strong>
                </div>
                <div>
                  <span className="text-white/30 block text-[10px] uppercase">
                    {locale === "pt-BR" ? "Chefe Final" : "Final Boss"}
                  </span>
                  <strong className="text-red-400 text-base">Madara Uchiha</strong>
                </div>
                <div>
                  <span className="text-white/30 block text-[10px] uppercase">
                    {locale === "pt-BR" ? "Mecânicas" : "Mechanics"}
                  </span>
                  <strong className="text-amber-400 text-base">
                    {locale === "pt-BR" ? "8 Provas Únicas" : "8 Unique Trials"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <Link
                href="/anime-world/naruto"
                className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm transition-all shadow-[0_0_25px_rgba(249,115,22,0.4)]"
              >
                <Swords size={18} />
                <span>{t("animeWorld.openMap")}</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {/* Progress bar across bottom */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between text-xs text-white/40 mb-1.5 font-mono">
              <span>{locale === "pt-BR" ? "Conclusão Geral" : "Overall Completion"}</span>
              <span>{Math.round((completedStages / 8) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                initial={{ width: 0 }}
                animate={{ width: `${(completedStages / 8) * 100}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Coming Soon Worlds */}
      <div className="space-y-3 pt-4">
        <h2 className="text-xs font-bold tracking-widest text-white/40 uppercase flex items-center gap-1.5">
          <Sparkles size={14} className="text-purple-400" />
          {locale === "pt-BR" ? "Campanhas Futuras" : "Upcoming Campaigns"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMING_SOON_WORLDS.map((w) => (
            <div
              key={w.id}
              className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] relative overflow-hidden flex flex-col justify-between space-y-4 opacity-70"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/40 border border-white/10">
                    {w.series}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/40">
                    <Lock size={10} />
                    {locale === "pt-BR" ? "Em Breve" : "Coming Soon"}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white">{w.name}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{w.description}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-white/30 pt-2 border-t border-white/5 font-mono">
                <span>Boss: {w.boss}</span>
                <span className="text-[11px] text-white/20">
                  {locale === "pt-BR" ? "Em Desenvolvimento" : "Under Construction"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
