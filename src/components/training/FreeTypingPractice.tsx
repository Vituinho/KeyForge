"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { useI18n } from "@/lib/i18n/i18nContext"
import { TypingArea } from "@/components/battle/TypingArea"
import { TypingKeyboard } from "@/components/keyboard/TypingKeyboard"
import Link from "next/link"
import { useAuth } from "@/lib/auth/authContext"
import { savePracticeRun } from "@/lib/storage/practiceHistoryStorage"
import { practiceSecondsRemaining, finishPractice } from "@/lib/typing/practiceClock"
import type { TypingStats } from "@/types/typing"

export function FreeTypingPractice({ timed }: { timed: boolean }) {
  const { t, locale } = useI18n()
  const [duration, setDuration] = useState(30)
  const [run, setRun] = useState(0)
  return <div className="space-y-3">
    {timed && <div className="flex items-center gap-2 text-xs"><span className="text-white/60">{t("release.practice.duration")}</span>{[15, 30, 60].map(seconds => <button key={seconds} type="button" aria-pressed={duration === seconds} className={`rounded-lg px-3 py-2 border ${duration === seconds ? "text-orange-300 border-orange-400/50" : "text-white/60 border-white/10"}`} onClick={() => setDuration(seconds)}>{seconds}s</button>)}</div>}
    <PracticeRun key={`${timed}-${duration}-${run}-${locale}`} duration={timed ? duration : 0} onRestart={() => setRun(value => value + 1)} />
  </div>
}

function PracticeRun({ duration, onRestart }: { duration: number; onRestart: () => void }) {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const drills = useMemo(() => [t("release.practice.drill1"), t("release.practice.drill2"), t("release.practice.drill3")], [t])
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState<number | null>(duration || null)
  const [result, setResult] = useState<TypingStats | null>(null)
  const start = useRef<number | null>(null)
  const finished = useRef(false)
  const snapshot = useRef<(() => TypingStats) | null>(null)
  const finish = useCallback(() => {
    if (finished.current || start.current === null) return
    finished.current = true
    const completed = finishPractice(snapshot.current!(), Math.max(0.001, (Date.now() - start.current) / 1000))
    savePracticeRun(user.id, locale === "en" ? "ANSI" : "ABNT2", completed)
    setResult(completed)
  }, [user.id, locale])
  const advanceRef = useRef<((text: string) => void) | null>(null)
  const complete = useCallback(() => {
    if (practiceSecondsRemaining(start.current, duration, Date.now()) === 0) { finish(); return }
    const next = (index + 1) % drills.length
    advanceRef.current?.(drills[next]); setIndex(value => value + 1)
  }, [drills, duration, finish, index])
  const { chars, stats, inputRef, focus, expectedKey, pressedKey, lastErrorKey, nextRound, getStats } = useTypingEngine({
    text: drills[index % drills.length], enabled: !result, statsUpdateIntervalMs: 100,
    onAttempt: attempt => { if (start.current === null) start.current = attempt.timestamp },
    onComplete: complete,
  })
  useEffect(() => { snapshot.current = getStats; advanceRef.current = nextRound }, [getStats, nextRound])
  useEffect(() => {
    if (!duration || result) return
    const timer = setInterval(() => {
      const seconds = practiceSecondsRemaining(start.current, duration, Date.now())
      setRemaining(seconds)
      if (seconds === 0) finish()
    }, 100)
    return () => clearInterval(timer)
  }, [duration, finish, result])
  if (result) return <section className="kf-panel p-6 space-y-5" aria-label={t("training.result.complete")}>
    <h2 className="text-xl font-bold">{t("training.result.complete")}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">{[
      ["common.wpm", result.battleWpm], ["common.accuracy", `${result.battleAccuracy}%`],
      ["common.errors", result.totalErrors], ["common.seconds", result.totalElapsedTime.toFixed(1)],
    ].map(([label, value]) => <div key={label}><p className="text-xs text-white/50">{t(String(label))}</p><p className="text-2xl text-orange-300 mt-1">{value}</p></div>)}</div>
    <p className="text-sm text-white/60">{t("release.practiceSaved")}</p>
    <div className="flex flex-wrap gap-2"><button type="button" className="kf-button kf-button-primary" onClick={onRestart}>{t("common.trainAgain")}</button><Link href="/academy" className="kf-button">{t("nav.academy")}</Link><Link href="/statistics" className="kf-button">{t("nav.statistics")}</Link></div>
  </section>
  return <div className="space-y-3">
    <div className="flex flex-wrap justify-between items-center gap-3 text-sm"><p className="text-white/60">{t(duration ? "release.practice.timedHint" : "release.practice.freeHint")}</p>{remaining !== null && <span className="font-mono text-orange-300 tabular-nums">{remaining}s</span>}</div>
    <TypingArea chars={chars} inputRef={inputRef} onFocus={focus} />
    <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-sm text-white/65"><span>{stats.battleWpm} WPM</span><span>{stats.battleAccuracy}% {t("common.accuracy")}</span><span>{stats.totalErrors} {t("common.errors")}</span><span>{stats.combo}× {t("common.combo")}</span></div>
    <TypingKeyboard expectedKey={expectedKey} pressedKey={pressedKey} lastErrorKey={lastErrorKey} layout={locale} size="sm" showHandsGuide />
    <div className="flex gap-2"><button type="button" onClick={finish} disabled={!stats.totalTypingAttempts} className="kf-button !text-xs">{t("release.practice.finish")}</button><button type="button" onClick={onRestart} className="kf-button !text-xs">{t("common.reset")}</button></div>
  </div>
}
