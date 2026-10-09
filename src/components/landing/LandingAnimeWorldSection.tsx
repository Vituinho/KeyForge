"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { WORLD_REGISTRY, ANIME_WORLD_ORDER } from "@/data/worlds"
import { useI18n } from "@/lib/i18n/i18nContext"

export function LandingAnimeWorldSection() {
  const { t } = useI18n()
  return <section id="anime-worlds" className="px-5 border-y border-white/10 bg-white/[0.015]">
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3 max-w-2xl"><p className="kf-eyebrow">{t("landing.animeWorlds.tag")}</p><h2 className="text-3xl sm:text-4xl font-black tracking-tight">{t("release.worldsTitle")}</h2><p className="text-sm text-white/55">{t("release.worldsDescription")}</p></div>
        <Link href="/anime-world" className="kf-button !text-xs">{t("common.openMap")}<ArrowUpRight size={15} /></Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ANIME_WORLD_ORDER.map((id, index) => {
          const world = WORLD_REGISTRY[id]
          return <Link key={id} href="/anime-world" className="kf-panel p-5 space-y-3 hover:border-white/30 transition-colors group">
            <div className="flex justify-between items-center text-xs font-mono text-white/40"><span>0{index + 1}</span><ArrowUpRight size={15} className="group-hover:text-orange-300" /></div>
            <div><p className="text-xs text-white/50">{world.series}</p><h3 className="text-base font-bold mt-1">{t(world.nameKey)}</h3></div>
            <p className="text-xs leading-relaxed text-white/55">{t(world.focusKey)}</p>
            <p className="text-xs text-orange-300 font-mono">{t("release.worldStages", { count: world.stages.length })}</p>
          </Link>
        })}
      </div>
    </div>
  </section>
}
