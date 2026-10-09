"use client"

import { memo } from "react"
import { ArrowRight, Crosshair } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"
import { FINGER_PALETTE } from "@/lib/keyboard/fingerMap"
import type { LearningTarget, SessionRecap } from "@/lib/academy/adaptiveLearning"
import { trainingScore } from "@/lib/academy/trainingPresentation"

export const RecommendedSession = memo(function RecommendedSession({ targets, estimatedSeconds, onStart }: {
  targets: LearningTarget[]; estimatedSeconds: number; onStart: () => void
}) {
  const { t, locale } = useI18n()
  const label = (target: LearningTarget) => target.kind === "mixed" ? t("academyPath.mixed")
    : target.kind === "finger" && target.finger ? FINGER_PALETTE[target.finger].name[locale]
    : target.keys.map((key) => key.toUpperCase()).join("→")
  return <section aria-label={t("academyPath.recommendedSession")} className="rounded-xl border border-emerald-400/20 bg-emerald-950/10 p-3 space-y-2">
    <h2 className="font-bold text-xs flex items-center gap-2"><Crosshair size={14} className="text-emerald-300" />{t("academyPath.recommendedSession")}</h2>
    <ol className="space-y-1.5 text-xs">{targets.map((target, index) => <li key={target.id} className="flex gap-2" title={t("academyPath.evidence", { attempts: target.evidence.attempts, accuracy: target.evidence.accuracy?.toFixed(1) ?? "—", response: Math.round(target.evidence.responseTime ?? 0) })}>
      <span className="text-white/35 font-mono">{index + 1}.</span><span className="min-w-0"><strong className="font-mono text-emerald-200">{label(target)}</strong><span className="text-white/50"> — {t(`academyPath.${target.reason}`)}</span></span>
    </li>)}</ol>
    <div className="flex items-center justify-between gap-2 pt-1"><span className="text-[10px] text-white/45">{t("academyPath.duration", { minutes: Math.max(1, Math.ceil(estimatedSeconds / 60)) })}</span>
      <button onClick={onStart} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-black hover:bg-emerald-300 flex items-center gap-1">{t("academyPath.start")}<ArrowRight size={12} /></button></div>
  </section>
})

export const LearningSessionRecap = memo(function LearningSessionRecap({ recap }: { recap: SessionRecap }) {
  const { t } = useI18n()
  const attempts = recap.samples.reduce((sum, sample) => sum + sample.attempts, 0)
  const correct = recap.samples.reduce((sum, sample) => sum + sample.correct, 0)
  const seconds = recap.samples.reduce((sum, sample) => sum + sample.seconds, 0)
  const speed = seconds ? recap.samples.reduce((sum, sample) => sum + sample.speed * sample.seconds, 0) / seconds : 0
  const gains = Object.entries(recap.masteryGains).sort(([, a], [, b]) => b - a).slice(0, 6)
  return <section role="status" aria-label={t("academyPath.recap")} className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 space-y-2">
    <h2 className="font-bold text-sm text-emerald-300">{t("academyPath.recap")}</h2>
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono text-white/70"><span>{t("academyPath.completed", { count: recap.targetsCompleted })}</span><span>{attempts} {t("academyMastery.attempts")}</span><span>{attempts - correct} {t("common.errors")}</span><span>{t("academyMastery.accuracy")}: {(attempts ? correct / attempts * 100 : 100).toFixed(1)}%</span><span>{t("academyMastery.speed")}: {speed.toFixed(1)} WPM</span><span>{t("academyMastery.score")}: {trainingScore(recap.samples)}</span></div>
    <p className="text-[10px] text-white/45">{t("academyPath.activeTime", { minutes: (seconds / 60).toFixed(1) })}{gains.length > 0 && ` · ${t("academyMastery.mastery")}: ${gains.map(([key, gain]) => `${key.toUpperCase()} +${gain}`).join(" · ")}`}</p>
  </section>
})
