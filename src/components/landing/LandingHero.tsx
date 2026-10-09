"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Swords, BookOpen, Target, Keyboard, RotateCcw } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"
import { useTypingEngine } from "@/hooks/useTypingEngine"

function TypingPreview() {
  const { t } = useI18n()
  const text = t("release.hero.drill")
  const [active, setActive] = useState(false)
  const { chars, stats, inputRef, resetAll } = useTypingEngine({ text, enabled: active, statsUpdateIntervalMs: 100 })
  useEffect(() => { resetAll(text) }, [text, resetAll])
  const start = () => { resetAll(text); setActive(true); inputRef.current?.focus({ preventScroll: true }) }
  return <div className="kf-panel p-5 sm:p-7 w-full relative shadow-2xl">
    <div className="flex items-center justify-between border-b border-white/10 pb-4">
      <span className="flex items-center gap-2 text-sm font-semibold"><Keyboard size={17} className="text-orange-300" />{t("release.hero.preview")}</span>
      <span className="text-xs text-white/50 font-mono">{t("release.hero.live")}</span>
    </div>
    <div className="flex flex-wrap gap-5 py-5 text-xs font-mono tabular-nums">
      <span className="text-white/50">WPM <strong className="text-white ml-1 text-lg">{stats.battleWpm}</strong></span>
      <span className="text-white/50">{t("common.accuracy")} <strong className="text-white ml-1 text-lg">{stats.totalTypingAttempts ? `${stats.battleAccuracy}%` : "—"}</strong></span>
      <span className="text-white/50">{t("common.combo")} <strong className="text-orange-300 ml-1 text-lg">{stats.combo}×</strong></span>
    </div>
    <div onClick={() => inputRef.current?.focus()} className="min-h-36 p-4 rounded-xl bg-black/25 border border-white/10 cursor-text">
      <input ref={inputRef} readOnly aria-label={t("release.hero.preview")} className="absolute opacity-0 w-px h-px" />
      <p className="font-mono text-xl sm:text-2xl leading-relaxed break-words select-none">
        {chars.map((char, index) => <span key={index} className={char.state === "correct" ? "text-emerald-300" : char.state === "incorrect" ? "text-red-300 bg-red-400/15" : char.state === "current" && active ? "text-white bg-orange-400/20 border-b-2 border-orange-400" : "text-white/40"}>{char.char}</span>)}
      </p>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
      <p className="text-xs text-white/50 max-w-60">{t(stats.isCompleted ? "release.hero.complete" : "release.hero.keyboardHint")}</p>
      <button type="button" onClick={start} className="kf-button !px-4 !py-2 !text-xs"><RotateCcw size={14} />{t(active ? "common.reset" : "release.hero.try")}</button>
    </div>
  </div>
}
export function LandingHero() {
  const { t } = useI18n()
  return <section className="px-5 relative">
    <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_1fr] items-center gap-10 lg:gap-16">
      <div className="space-y-6">
        <p className="kf-eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-orange-400" />{t("release.hero.tag")}</p>
        <h1 className="text-[2.8rem] sm:text-6xl xl:text-7xl font-black tracking-tight leading-[1.04] text-white">{t("release.hero.title")}<span className="block text-orange-300">{t("release.hero.accent")}</span></h1>
        <p className="text-base sm:text-lg leading-relaxed text-white/60 max-w-xl">{t("release.hero.description")}</p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href="/game" className="kf-button kf-button-primary"><Swords size={18} />{t("common.startPlaying")}<ArrowRight size={17} /></Link>
          <Link href="/academy" className="kf-button"><BookOpen size={17} />{t("nav.academy")}</Link>
        </div>
        <p className="text-xs text-white/45">{t("release.hero.guest")}</p>
        <div className="flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-5 text-xs text-white/60">
          <span className="flex items-center gap-2"><Target size={15} className="text-orange-300" />{t("release.hero.adaptive")}</span>
          <span className="flex items-center gap-2"><Swords size={15} className="text-orange-300" />{t("release.hero.battles")}</span>
          <span className="flex items-center gap-2"><Keyboard size={15} className="text-orange-300" />ABNT2 / ANSI</span>
        </div>
      </div>
      <TypingPreview />
    </div>
  </section>
}
