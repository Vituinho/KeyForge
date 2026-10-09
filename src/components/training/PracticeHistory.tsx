"use client"

import { useCallback, useSyncExternalStore } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/authContext"
import { useI18n } from "@/lib/i18n/i18nContext"
import { loadPracticeHistory, practiceHistoryKey, type PracticeRun } from "@/lib/storage/practiceHistoryStorage"

const empty: PracticeRun[] = []
const cached = new Map<string, { raw: string | null; runs: PracticeRun[] }>()
const serverSnapshot = () => empty
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}
export function PracticeHistory() {
  const { user } = useAuth(), { t, locale } = useI18n()
  const layout = locale === "en" ? "ANSI" : "ABNT2"
  const snapshot = useCallback(() => {
    const key = practiceHistoryKey(user.id, layout)
    try {
      const raw = localStorage.getItem(key), previous = cached.get(key)
      if (previous?.raw === raw) return previous.runs
      const runs = loadPracticeHistory(user.id, layout)
      cached.set(key, { raw, runs }); return runs
    } catch { return empty }
  }, [user.id, layout])
  const runs = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  return <section className="kf-panel p-5 space-y-3">
    <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold">{t("release.practiceHistory")}</h2><Link href="/training" className="text-xs text-orange-300 hover:text-orange-200">{t("nav.training")} →</Link></div>
    {!runs.length ? <p className="text-sm text-white/55">{t("release.practiceEmpty")}</p> : <div className="overflow-x-auto"><table className="w-full text-xs text-left font-mono"><thead className="text-white/45"><tr><th className="pb-2">{t("release.practiceDate")}</th><th>WPM</th><th>{t("common.accuracy")}</th><th>{t("common.errors")}</th><th>{t("common.seconds")}</th></tr></thead><tbody>{runs.slice(-8).reverse().map((run, index) => <tr key={`${run.date}-${index}`} className="border-t border-white/5 text-white/70"><td className="py-2 pr-3">{new Date(run.date).toLocaleDateString(locale)}</td><td>{run.speed}</td><td>{run.accuracy}%</td><td>{run.errors}</td><td>{run.seconds.toFixed(1)}</td></tr>)}</tbody></table></div>}
  </section>
}
