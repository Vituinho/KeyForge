"use client"

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen, Crosshair, Keyboard, Sparkles } from "lucide-react"
import { useAuth } from "@/lib/auth/authContext"
import { getStoredUser } from "@/lib/auth/authService"
import { useI18n } from "@/lib/i18n/i18nContext"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { processAcademyLessonRewards } from "@/lib/progression/processActivityRewards"
import { FINGER_PALETTE, type KeyboardLayoutId } from "@/lib/keyboard/fingerMap"
import { generateKeyExercises, getPracticeFinger } from "@/lib/academy/keyExercises"
import {
  emptyKeyMastery, learnableKeys, loadMasteryProgress, localPracticeDate, masteryStorageKey,
  nextPracticeStage, recordMasteryPractice, recommendKey, saveMasteryProgress,
  type KeyMastery, type KeyStatus, type MasteryProgress, LEARNING_STAGES,
} from "@/lib/academy/keyMastery"
import {
  academyNavigation, dailyGoal, loadAcademyPractice, performanceTrend, practiceSample,
  recordAcademyPractice, saveAcademyPractice, trainingScore, type PracticeSample,
} from "@/lib/academy/trainingPresentation"
import type { TypingAttempt } from "@/lib/typing/typingAttempt"
import type { CharData, TypingStats } from "@/types/typing"
import { VirtualKeyboard } from "./VirtualKeyboard"
import { FingerGuide } from "./FingerGuide"
import { RecommendedSession, LearningSessionRecap } from "./RecommendedSession"
import {
  advanceLearningSession, generateLearningSession, keyReviewState, loadLearningTelemetry,
  recordLearningTelemetry, refreshLearningPath, saveLearningTelemetry, sessionSample, summarizeLearningSession,
  type LearningSession, type PathAttempt, type ReviewState, type SessionRecap,
} from "@/lib/academy/adaptiveLearning"

const STATUS_STYLE: Record<KeyStatus, string> = {
  untrained: "border-white/10 bg-white/[0.03] text-white/45",
  weak: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  learning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  good: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  mastered: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
}
const subscribeHydration = () => () => {}
const clientReady = () => true
const serverReady = () => false
const copy = (key: string) => `academyMastery.${key}`
function defer(task: () => void) {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(task, { timeout: 500 })
  else setTimeout(task, 0)
}
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target instanceof HTMLInputElement && target.readOnly && target.dataset.academyCapture === "true") return false
  return !!target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])")
}
function signed(value: number | null, unit = "") {
  return value === null ? undefined : `${value >= 0 ? "+" : ""}${value.toFixed(1)}${unit}`
}

export function KeyMasteryAcademy({ onOpenModule }: { onOpenModule: (id: string) => void }) {
  const { locale, t } = useI18n()
  const { user } = useAuth()
  const playerSnapshot = useMemo(() => {
    // Resolve the placeholder guest before training, so the first reward cannot change storage ownership.
    // Cache the fallback too: unavailable browser storage must still yield a stable snapshot.
    let guestId: string | undefined
    return () => user?.id === "guest_initial" ? (guestId ??= getStoredUser().id) : user?.id ?? "guest"
  }, [user?.id])
  const playerId = useSyncExternalStore(subscribeHydration, playerSnapshot, () => "guest_initial")
  const [layoutOverride, setLayoutOverride] = useState<KeyboardLayoutId | null>(null)
  const ready = useSyncExternalStore(subscribeHydration, clientReady, serverReady)
  const layout = layoutOverride ?? (locale === "en" ? "ANSI" : "ABNT2")
  const storageKey = masteryStorageKey(playerId, layout)
  return <main className="min-h-screen max-w-7xl mx-auto px-3 sm:px-5 py-3 space-y-3">
    <nav className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/game" className="flex items-center gap-2 text-xs text-white/55 hover:text-white"><ArrowLeft size={14} />{t(copy("back"))}</Link>
      <span className="hidden sm:block text-xs font-mono tracking-[.2em] uppercase text-emerald-400">{t(copy("brand"))}</span>
      <label className="text-xs text-white/60 flex items-center gap-2">{t(copy("layout"))}
        <select aria-label={t(copy("layout"))} value={layout} onChange={(event) => setLayoutOverride(event.target.value as KeyboardLayoutId)} className="rounded-lg border border-white/15 bg-neutral-950 px-2 py-1.5 text-white">
          <option value="ABNT2">PT-BR · ABNT2</option><option value="ANSI">EN · ANSI</option>
        </select>
      </label>
    </nav>
    {ready ? <MasteryWorkspace key={storageKey} storageKey={storageKey} layout={layout} onOpenModule={onOpenModule} /> : <p className="text-white/50">{t(copy("loading"))}</p>}
  </main>
}

function MasteryWorkspace({ storageKey, layout, onOpenModule }: { storageKey: string; layout: KeyboardLayoutId; onOpenModule: (id: string) => void }) {
  const { t } = useI18n()
  const [progress, setProgress] = useState(() => loadMasteryProgress(storageKey))
  const progressRef = useRef(progress)
  const [telemetry, setTelemetry] = useState(() => recordLearningTelemetry(loadLearningTelemetry(storageKey), [], progress, layout))
  const telemetryRef = useRef(telemetry)
  const [path, setPath] = useState(() => refreshLearningPath(null, progress, telemetry, layout))
  const [automatic, setAutomatic] = useState<LearningSession | null>(null)
  const automaticBeforeRef = useRef(progress)
  const [recap, setRecap] = useState<SessionRecap | null>(null)
  const preparedSession = useMemo(() => generateLearningSession(path.targets, path.progress, layout), [path, layout])
  const [practice, setPractice] = useState(() => loadAcademyPractice(storageKey))
  const practiceRef = useRef(practice)
  const [session, setSession] = useState<PracticeSample[]>([])
  const sessionRef = useRef<PracticeSample[]>([])
  const [selectedKey, setSelectedKey] = useState(() => recommendKey(progress, layout))
  const [focused, setFocused] = useState(false)
  const [masteryGain, setMasteryGain] = useState({ key: "", amount: 0 })
  const keys = useMemo(() => learnableKeys(layout), [layout])
  const commit = useCallback((attempts: PathAttempt[], targetKey: string, stage: number, lessonCompleted: boolean) => {
    const previousMastery = progressRef.current.keys[targetKey]?.mastery ?? 0
    const next = recordMasteryPractice(progressRef.current, attempts, layout, { targetKey, stage, lessonCompleted })
    progressRef.current = next
    setProgress(next)
    const nextTelemetry = recordLearningTelemetry(telemetryRef.current, attempts, next, layout)
    telemetryRef.current = nextTelemetry
    setTelemetry(nextTelemetry)
    setMasteryGain({ key: targetKey, amount: Math.max(0, (next.keys[targetKey]?.mastery ?? 0) - previousMastery) })
    const nextPractice = recordAcademyPractice(practiceRef.current, attempts, targetKey, stage)
    practiceRef.current = nextPractice
    setPractice(nextPractice)
    if (attempts.length) {
      sessionRef.current = [...sessionRef.current, practiceSample(attempts, targetKey, stage)]
      setSession(sessionRef.current)
    }
    // Secondary persistence never sits between the final character and the next drill.
    defer(() => {
      saveMasteryProgress(storageKey, progressRef.current); saveAcademyPractice(storageKey, practiceRef.current)
      saveLearningTelemetry(storageKey, telemetryRef.current)
      setPath((previous) => refreshLearningPath(previous, progressRef.current, telemetryRef.current, layout))
    })
    return next.keys[targetKey] ?? emptyKeyMastery()
  }, [layout, storageKey])
  useEffect(() => {
    const flush = () => { saveMasteryProgress(storageKey, progressRef.current); saveAcademyPractice(storageKey, practiceRef.current); saveLearningTelemetry(storageKey, telemetryRef.current) }
    window.addEventListener("pagehide", flush)
    return () => { window.removeEventListener("pagehide", flush); flush() }
  }, [storageKey])
  const selectKey = useCallback((key: string) => { setAutomatic(null); setRecap(null); setSelectedKey(key); setFocused(true) }, [])
  const overview = useCallback(() => { setAutomatic(null); setFocused(false) }, [])
  const startSession = useCallback(() => {
    automaticBeforeRef.current = progressRef.current
    setRecap(null); setAutomatic(preparedSession); setSelectedKey(preparedSession.drills[0].target.keys[0]); setFocused(true)
  }, [preparedSession])
  const finishSession = useCallback((samples: PracticeSample[], targetsCompleted: number) => {
    setRecap(summarizeLearningSession(samples, targetsCompleted, automaticBeforeRef.current, progressRef.current))
    setAutomatic(null); setFocused(false)
  }, [])
  const moveKey = useCallback((direction: number) => {
    setAutomatic(null)
    setSelectedKey((key) => keys[(keys.indexOf(key) + direction + keys.length) % keys.length])
  }, [keys])
  useEffect(() => {
    if (focused) return
    const navigate = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
      const action = academyNavigation(event.key, isEditableTarget(event.target), false)
      if (action === "previous" || action === "next") { event.preventDefault(); moveKey(action === "next" ? 1 : -1) }
    }
    window.addEventListener("keydown", navigate)
    return () => window.removeEventListener("keydown", navigate)
  }, [focused, moveKey])

  const records = useMemo(() => keys.map((key) => progress.keys[key] ?? emptyKeyMastery()), [keys, progress])
  const attempts = records.reduce((sum, record) => sum + record.attempts, 0)
  const correct = records.reduce((sum, record) => sum + record.correctAttempts, 0)
  const timedCorrect = records.reduce((sum, record) => sum + record.timedCorrect, 0)
  const responseTime = records.reduce((sum, record) => sum + record.responseTimeTotal, 0)
  const mastery = records.reduce((sum, record) => sum + record.mastery, 0) / keys.length
  const today = progress.days[localPracticeDate()] ?? { attempts: 0, lessons: 0 }
  const recommended = path.targets[0]?.keys[0] ?? recommendKey(progress, layout)
  const trend = performanceTrend(practice.history)
  const current = progress.keys[selectedKey] ?? emptyKeyMastery()
  return <>
    <section aria-label={t(copy("liveMetrics"))} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
      <Metric label={t(copy("speed"))} value={`${(responseTime ? timedCorrect * 12000 / responseTime : 0).toFixed(1)} WPM`} delta={signed(trend.speedDelta)} />
      <Metric label={t(copy("accuracy"))} value={`${(attempts ? correct / attempts * 100 : 100).toFixed(1)}%`} delta={signed(trend.accuracyDelta, "%")} />
      <Metric label={t(copy("score"))} value={String(trainingScore(session))} detail={t(copy("scoreHint"))} />
      <Metric label={t(copy("overall"))} value={`${mastery.toFixed(1)}%`} />
      <DailyPractice seconds={practice.days[localPracticeDate()] ?? 0} lessons={today.lessons} />
    </section>
    {focused ? <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
      <KeyPractice key={automatic ? "automatic" : selectedKey} targetKey={selectedKey} layout={layout} initialRecord={current} onRecord={commit} onBack={overview} onMove={moveKey} plan={automatic} onTarget={setSelectedKey} onFinished={finishSession} />
      <aside className="space-y-3 min-w-0">
        <CurrentKeyPanel targetKey={selectedKey} record={current} layout={layout} gain={masteryGain.key === selectedKey ? masteryGain.amount : 0} review={keyReviewState(current, telemetry.strongKeys.includes(selectedKey))} />
        <details className="rounded-xl border border-white/10"><summary className="cursor-pointer px-3 py-2 text-xs text-white/60">{t(copy("keyMap"))} · {selectedKey.toUpperCase()}</summary><KeyMap progress={progress} layout={layout} recommended={recommended} selected={selectedKey} onSelect={selectKey} strongKeys={telemetry.strongKeys} compact /></details>
      </aside>
    </div> : <>
      {recap && <LearningSessionRecap recap={recap} />}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-black uppercase tracking-tight">{t(copy("title"))}</h1><p className="text-xs text-white/45 mt-1">{t(copy("subtitle"))}</p></div>
        <button onClick={() => selectKey(recommended)} className="flex items-center gap-2 text-xs font-mono rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-emerald-300 hover:bg-emerald-400/20"><Crosshair size={14} />{t(copy("recommended"))}: <strong>{recommended.toUpperCase()}</strong><ArrowRight size={14} /></button>
      </header>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <KeyMap progress={progress} layout={layout} recommended={recommended} selected={selectedKey} onSelect={selectKey} strongKeys={telemetry.strongKeys} />
        <aside className="space-y-3 min-w-0">
          <RecommendedSession targets={path.targets} estimatedSeconds={preparedSession.estimatedSeconds} onStart={startSession} />
          <CurrentKeyPanel targetKey={selectedKey} record={current} layout={layout} gain={0} onTrain={() => selectKey(selectedKey)} review={keyReviewState(current, telemetry.strongKeys.includes(selectedKey))} />
        </aside>
      </div>
      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
        <button onClick={() => onOpenModule("intro")} className="flex gap-2 items-center hover:text-white"><BookOpen size={14} />{t(copy("guide"))}</button>
        <button onClick={() => onOpenModule("home-row")} className="flex gap-2 items-center hover:text-white"><Keyboard size={14} />{t(copy("homeRow"))}</button>
        <span>{t(copy("shortcuts"))}</span><span className="ml-auto text-[10px]">{t(copy("saved"))}</span>
      </footer>
    </>}
  </>
}

const Metric = memo(function Metric({ label, value, delta, detail }: { label: string; value: string; delta?: string; detail?: string }) {
  const { t } = useI18n()
  return <div className="bg-neutral-950 px-3 py-2 min-w-0"><p className="text-[10px] font-mono uppercase tracking-wide text-white/45">{label}</p><p className="text-lg font-bold font-mono text-white tabular-nums mt-0.5">{value} {delta && <span title={t(copy("recentDelta"))} className={`text-[11px] ${delta.startsWith("-") ? "text-rose-300" : "text-emerald-300"}`}>({delta})</span>}</p>{detail && <p className="text-[9px] text-white/35 truncate">{detail}</p>}</div>
})
const DailyPractice = memo(function DailyPractice({ seconds, lessons }: { seconds: number; lessons: number }) {
  const { t } = useI18n()
  const goal = dailyGoal(seconds)
  return <div className="bg-neutral-950 px-3 py-2 col-span-2 sm:col-span-1" title={t(copy("dailyHint"), { lessons })}>
    <p className="text-[10px] font-mono uppercase tracking-wide text-white/45">{t(copy("daily"))}</p>
    <p className="font-mono text-lg tabular-nums text-emerald-300">{t(copy("dailyValue"), { minutes: goal.minutes.toFixed(1) })}</p>
    <div role="progressbar" aria-label={t(copy("daily"))} aria-valuenow={Math.round(goal.percent)} aria-valuemin={0} aria-valuemax={100} className="h-1 rounded-full bg-white/10 mt-1"><div className="h-full rounded-full bg-emerald-400 motion-safe:transition-[width]" style={{ width: `${goal.percent}%` }} /></div>
  </div>
})

const KeyMap = memo(function KeyMap({ progress, layout, recommended, selected, onSelect, strongKeys, compact = false }: {
  progress: MasteryProgress; layout: KeyboardLayoutId; recommended: string; selected: string; onSelect: (key: string) => void; strongKeys: string[]; compact?: boolean
}) {
  const { t } = useI18n()
  const keys = useMemo(() => learnableKeys(layout), [layout])
  const rows = ["1234567890", "qwertyuiop", `asdfghjkl${layout === "ABNT2" ? "ç" : ";"}`, "zxcvbnm"]
  const rowKeys = rows.join("")
  const symbols = keys.filter((key) => !rowKeys.includes(key))
  const keyButton = (key: string) => {
    const record = progress.keys[key] ?? emptyKeyMastery()
    const finger = getPracticeFinger(key, layout)
    const review = keyReviewState(record, strongKeys.includes(key))
    const tooltip = `${t(copy("mastery"))}: ${record.mastery}% · ${t(copy("accuracy"))}: ${record.accuracy.toFixed(1)}% · ${t(copy("attempts"))}: ${record.attempts} · ${t(copy("response"))}: ${Math.round(record.averageResponseTime)} ms${review ? ` · ${t(`academyPath.${review}`)}` : ""}`
    return <button key={key} type="button" aria-pressed={selected === key} data-mastery-key={key}
      aria-label={`${key.toUpperCase()}: ${t(copy(record.status))}, ${record.mastery}%. ${key === recommended ? t(copy("recommended")) + ". " : ""}${t(copy("train"))}`}
      onClick={() => onSelect(key)} title={tooltip} aria-describedby={`key-detail-${key.codePointAt(0)}`}
      className={`group relative min-w-0 rounded-md border font-mono focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 hover:border-white/50 ${compact ? "h-9" : "h-11 sm:h-14"} ${STATUS_STYLE[record.status]} ${selected === key ? "ring-1 ring-white/70" : ""}`}>
      {key === recommended && <Crosshair aria-hidden size={compact ? 8 : 10} className="absolute right-0.5 top-0.5 text-emerald-300" />}
      {review && review !== "healthy" && <span aria-hidden className={`absolute top-1 left-1 h-1.5 w-1.5 rounded-full ${review === "reviewSoon" ? "bg-amber-300" : "bg-rose-300"}`} />}
      <span className={`block font-bold ${compact ? "text-xs" : "text-base sm:text-lg"}`}>{key.toUpperCase()}</span>
      <span className="block text-[8px] sm:text-[9px] leading-none tabular-nums">{record.mastery}%</span>
      <span className="absolute bottom-0.5 left-1 right-1 h-0.5 bg-white/10 rounded-full"><span className="block h-full rounded-full" style={{ width: `${record.mastery}%`, background: finger ? FINGER_PALETTE[finger.finger].hex : "#34d399" }} /></span>
      <span id={`key-detail-${key.codePointAt(0)}`} role="tooltip" className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-30 hidden group-hover:block group-focus-visible:block w-52 rounded-lg border border-white/20 bg-neutral-900 p-2 text-[10px] text-white shadow-xl">{tooltip}</span>
    </button>
  }
  return <section aria-label={t(copy("keyMap"))} className="min-w-0 rounded-xl border border-white/10 bg-gradient-to-b from-neutral-900/60 to-neutral-950 p-3 sm:p-4 space-y-3">
    <div className="flex items-center justify-between"><h2 className="font-bold text-sm">{t(copy("keyMap"))}</h2><span className="text-[10px] text-white/40 font-mono">{layout}</span></div>
    {!compact && <p className="text-xs text-white/45">{t(copy("keyMapHint"))}</p>}
    <div className="flex flex-wrap gap-x-2 gap-y-1">{(Object.keys(STATUS_STYLE) as KeyStatus[]).map((status) => <span key={status} className="flex gap-1 items-center text-[9px] text-white/55"><span className={`w-1.5 h-1.5 rounded-sm border ${STATUS_STYLE[status]}`} />{t(copy(status))}</span>)}</div>
    <div className="space-y-1.5">{rows.map((row, index) => <div key={row} className={`grid gap-1 sm:gap-1.5 ${index === 2 ? "mx-2" : index === 3 ? "mx-5" : ""}`} style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>{Array.from(row).map(keyButton)}</div>)}</div>
    <p className="text-[9px] uppercase tracking-wider text-white/35 font-mono">{t(copy("symbols"))}</p>
    <div className={`grid gap-1 ${compact ? "grid-cols-8" : "grid-cols-8 sm:grid-cols-12"}`}>{symbols.map(keyButton)}</div>
    <div className="flex flex-wrap gap-3 text-[9px] text-white/50"><span className="flex items-center gap-1"><Crosshair size={10} className="text-emerald-300" />{t(copy("recommended"))}</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm ring-1 ring-white/70" />{t(copy("selected"))}</span></div>
  </section>
})

const CurrentKeyPanel = memo(function CurrentKeyPanel({ targetKey, record, layout, gain, onTrain, review }: {
  targetKey: string; record: KeyMastery; layout: KeyboardLayoutId; gain: number; onTrain?: () => void; review?: ReviewState | null
}) {
  const { t, locale } = useI18n()
  const finger = getPracticeFinger(targetKey, layout)
  const palette = finger ? FINGER_PALETTE[finger.finger] : null
  const trend = performanceTrend(record.recentPerformance)
  const entries = [
    [t(copy("finger")), palette?.name[locale] ?? "—"],
    [t(copy("speed")), `${record.averageSpeed.toFixed(1)} WPM`],
    [t(copy("bestSpeed")), `${record.bestSpeed.toFixed(1)} WPM`],
    [t(copy("accuracy")), `${record.accuracy.toFixed(1)}%`],
    [t(copy("response")), `${Math.round(record.averageResponseTime)} ms`],
    [t(copy("attempts")), String(record.attempts)],
    [t(copy("correct")), `${record.correctAttempts} · ${record.errors} ${t(copy("errors"))}`],
    [t(copy("lessons")), String(record.lessonsCompleted)],
    [t(copy("learningRate")), t(copy(trend.rate))],
  ]
  return <section className="rounded-xl border border-white/10 bg-neutral-950 p-4 space-y-3" aria-label={t(copy("currentKey"))}>
    <div className="flex items-center justify-between"><div><p className="text-[10px] text-white/45 uppercase font-mono">{t(copy("currentKey"))}</p><h2 className="text-3xl font-black font-mono" style={{ color: palette?.hex }}>{targetKey.toUpperCase()}</h2></div><span className={`text-[10px] border rounded px-2 py-1 ${STATUS_STYLE[record.status]}`}>{t(copy(record.status))}</span></div>
    <div><div className="flex items-center justify-between text-xs font-mono mb-1.5"><span className="text-white/55">{t(copy("mastery"))}</span><span className="text-emerald-300 tabular-nums motion-safe:transition-colors">{record.mastery}% <span className="inline-block w-7 text-[10px]">{gain > 0 ? `+${gain}` : ""}</span></span></div>
      <div role="progressbar" aria-label={t(copy("mastery"))} aria-valuenow={record.mastery} aria-valuemin={0} aria-valuemax={100} className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${record.mastery}%` }} /></div></div>
    <dl className="space-y-1.5 text-xs">{entries.map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="text-white/45">{label}</dt><dd className="font-mono text-right text-white/85 tabular-nums">{value}</dd></div>)}</dl>
    {review && <p title={t("academyPath.reviewHint")} className={`text-[10px] ${review === "healthy" ? "text-emerald-300" : review === "reviewSoon" ? "text-amber-300" : "text-rose-300"}`}>{t(`academyPath.${review}`)}</p>}
    {trend.rate === "uncertain" && <p className="text-[10px] text-white/35">{t(copy("insufficient"))}</p>}
    <div className="border-t border-white/10 pt-2"><p className="text-[9px] text-white/40 uppercase font-mono mb-2">{t(copy("recent"))}</p>
      <div className="flex gap-1.5 h-9 items-end">{record.recentPerformance.length ? record.recentPerformance.map((sample, index) => <div key={index} title={`${sample.accuracy.toFixed(1)}% · ${sample.speed.toFixed(1)} WPM`} className="flex-1 bg-emerald-400/50 rounded-t-sm min-h-px" style={{ height: `${sample.accuracy}%` }} />) : <p className="text-[10px] text-white/35">{t(copy("noHistory"))}</p>}</div>
    </div>
    {onTrain && <button onClick={onTrain} className="w-full rounded-lg bg-emerald-400 hover:bg-emerald-300 py-2 text-xs font-bold text-black">{t(copy("train"))} {targetKey.toUpperCase()}</button>}
  </section>
})

function KeyPractice({ targetKey, layout, initialRecord, onRecord, onBack, onMove, plan, onTarget, onFinished }: {
  targetKey: string; layout: KeyboardLayoutId; initialRecord: KeyMastery; onBack: () => void; onMove: (direction: number) => void
  onRecord: (attempts: PathAttempt[], key: string, stage: number, completed: boolean) => KeyMastery
  plan: LearningSession | null; onTarget: (key: string) => void; onFinished: (samples: PracticeSample[], completed: number) => void
}) {
  const { t, locale } = useI18n()
  const [entryKey] = useState(targetKey)
  const exercises = useMemo(() => generateKeyExercises(targetKey, layout), [targetKey, layout])
  const [stage, setStage] = useState(() => initialRecord.status === "mastered" ? 5 : Math.min(5, Math.floor(initialRecord.mastery / 18)))
  const stageRef = useRef(stage)
  const [drills, setDrills] = useState(0)
  const drillsRef = useRef(0)
  const [planIndex, setPlanIndex] = useState(0)
  const planIndexRef = useRef(0)
  const planSamplesRef = useRef<PracticeSample[]>([])
  const attemptsRef = useRef<PathAttempt[]>([])
  const transitionBreakRef = useRef(false)
  const lastAttemptRef = useRef(0)
  const [announcement, setAnnouncement] = useState("")
  useLayoutEffect(() => { window.scrollTo({ top: 0 }) }, [])
  const collectAttempt = useCallback((attempt: TypingAttempt) => {
    attemptsRef.current.push({ ...attempt, transitionBreak: transitionBreakRef.current })
    transitionBreakRef.current = false
    lastAttemptRef.current = attempt.timestamp
  }, [])
  const complete = useCallback((stats: TypingStats) => {
    drillsRef.current += 1
    const lessonCompleted = drillsRef.current % 6 === 0
    const drill = plan?.drills[planIndexRef.current]
    const recordedKey = drill?.target.keys[0] ?? targetKey
    const nextRecord = onRecord(attemptsRef.current, recordedKey, drill?.stage ?? stageRef.current, lessonCompleted)
    if (drill) planSamplesRef.current.push(sessionSample(attemptsRef.current, drill))
    attemptsRef.current = []
    const nextStage = nextPracticeStage(stageRef.current, nextRecord)
    stageRef.current = nextStage
    setStage(nextStage)
    setDrills(drillsRef.current)
    if (lessonCompleted) defer(() => {
      const reward = processAcademyLessonRewards(`key-mastery-${layout}-${recordedKey}`, stats)
      setAnnouncement(`+${reward.xpGained} XP${reward.didLevelUp ? ` · ${t(copy("levelReward"), { level: reward.newLevel })}` : ""}${reward.didRankUp ? ` · ${reward.newRank}` : ""}`)
    })
    if (plan) {
      const advanced = advanceLearningSession(plan, planIndexRef.current)
      planIndexRef.current = advanced.nextIndex
      if (advanced.completed) {
        onFinished(planSamplesRef.current, advanced.targetsCompleted)
        return null
      }
      setPlanIndex(advanced.nextIndex)
      onTarget(advanced.next!.target.keys[0])
      return { text: advanced.next!.text, id: `academy-path-${advanced.nextIndex}`, fresh: lessonCompleted }
    }
    return { text: exercises[nextStage].text, id: `academy-key-${targetKey}-${drillsRef.current}`, fresh: lessonCompleted }
  }, [exercises, layout, onRecord, targetKey, t, plan, onFinished, onTarget])
  useEffect(() => () => {
    if (attemptsRef.current.length) {
      const drill = plan?.drills[planIndexRef.current]
      onRecord(attemptsRef.current, drill?.target.keys[0] ?? entryKey, drill?.stage ?? stageRef.current, false)
      attemptsRef.current = []
    }
  // The automatic plan owns its changing target; only an actual unmount flushes partial attempts.
  }, [onRecord, plan, entryKey])
  const leave = useCallback(() => {
    const drill = plan?.drills[planIndexRef.current]
    if (attemptsRef.current.length) onRecord(attemptsRef.current, drill?.target.keys[0] ?? targetKey, drill?.stage ?? stageRef.current, false)
    attemptsRef.current = []
    onBack()
  }, [onBack, onRecord, targetKey, plan])
  useEffect(() => {
    const navigate = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
      if (event.key === "Backspace" && !isEditableTarget(event.target)) transitionBreakRef.current = true
      const action = academyNavigation(event.key, isEditableTarget(event.target), Date.now() - lastAttemptRef.current < 1500)
      if (!action) return
      event.preventDefault()
      if (action === "overview") leave()
      else onMove(action === "next" ? 1 : -1)
    }
    window.addEventListener("keydown", navigate)
    return () => window.removeEventListener("keydown", navigate)
  }, [leave, onMove])
  const currentDrill = plan?.drills[planIndex]
  const displayedStage = currentDrill?.stage ?? stage
  const targetLabel = currentDrill?.target.kind === "mixed" ? t("academyPath.mixed")
    : currentDrill?.target.kind === "finger" && currentDrill.target.finger ? FINGER_PALETTE[currentDrill.target.finger].name[locale]
    : currentDrill?.target.keys.map((key) => key.toUpperCase()).join("→") ?? targetKey.toUpperCase()
  return <div className="min-w-0 space-y-3">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
      <div className="flex items-center gap-3"><span className={`${currentDrill ? "min-w-12 px-2 text-2xl" : "w-12 text-3xl"} h-12 rounded-lg border border-emerald-400/30 bg-emerald-950/30 font-black font-mono text-emerald-300 grid place-items-center`}>{currentDrill ? currentDrill.target.keys.slice(0, 2).map((key) => key.toUpperCase()).join("→") : targetKey.toUpperCase()}</span><div><h1 className="font-bold text-lg">{currentDrill ? targetLabel : t(copy(LEARNING_STAGES[stage]))}</h1><p className="text-[10px] text-white/45">{plan ? t("academyPath.sessionProgress", { current: planIndex + 1, total: plan.drills.length }) : t(copy("drillCount"), { count: drills })} · {displayedStage >= 0 && currentDrill ? `${t(copy(LEARNING_STAGES[displayedStage]))} · ` : ""}{layout}</p></div></div>
      <div className="flex items-center gap-1"><button onClick={() => onMove(-1)} aria-label={t(copy("previousKey"))} className="p-2 rounded hover:bg-white/10"><ArrowLeft size={16} /></button><button onClick={() => onMove(1)} aria-label={t(copy("nextKey"))} className="p-2 rounded hover:bg-white/10"><ArrowRight size={16} /></button><button onClick={leave} className="px-2 py-1 text-xs text-white/50 hover:text-white">{t(copy("overview"))}</button></div>
    </header>
    {currentDrill && <p className="text-xs text-white/45">{t(`academyPath.${currentDrill.target.reason}`)} · {t("academyPath.continuous")}</p>}
    <DrillRunner text={currentDrill?.text ?? exercises[stage].text} textId={plan ? `academy-path-${planIndex}` : `academy-key-${targetKey}-${drills}`} layout={layout} onAttempt={collectAttempt} onComplete={complete} />
    <footer className="flex flex-wrap gap-x-4 gap-y-2 items-center"><details className="text-xs text-white/50"><summary className="cursor-pointer">{t(copy("fingerGuide"))}</summary><div className="pt-2"><FingerGuide layout={layout} /></div></details><p className="text-[10px] text-white/35">{t(copy("shortcuts"))}</p><RewardNotice message={announcement} /></footer>
  </div>
}

/** Only this subtree reacts to individual keys; dashboard, history and panels do not. */
const DrillRunner = memo(function DrillRunner({ text, textId, layout, onAttempt, onComplete }: {
  text: string; textId: string; layout: KeyboardLayoutId; onAttempt: (attempt: TypingAttempt) => void
  onComplete: (stats: TypingStats) => { text: string; id: string; fresh: boolean } | null
}) {
  const { t } = useI18n()
  const complete = (stats: TypingStats): void => {
    const next = onComplete(stats)
    if (!next) return
    if (next.fresh) resetAll(next.text)
    else nextRound(next.text, next.id)
  }
  const { chars, stats, inputRef, nextRound, resetAll, focus, expectedKey, pressedKey, lastErrorKey } = useTypingEngine({
    text, textId, onComplete: complete, onAttempt, statsUpdateIntervalMs: 100,
  })
  useLayoutEffect(() => { inputRef.current?.focus({ preventScroll: true }) }, [inputRef])
  return <div className="space-y-2">
    <PracticeText chars={chars} inputRef={inputRef} onFocus={focus} label={t(copy("typeDrill"))} />
    <div aria-label={t(copy("liveMetrics"))} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-1 text-xs font-mono tabular-nums text-white/55 min-h-7"><span>{t(copy("speed"))} <strong className="text-white">{stats.currentWpm} WPM</strong></span><span>{t(copy("accuracy"))} <strong className="text-emerald-300">{stats.battleAccuracy}%</strong></span><span>{t(copy("combo"))} <strong className="text-white">{stats.combo}×</strong></span><span className="text-[10px] ml-auto">{t(copy("continue"))}</span></div>
    <VirtualKeyboard activeKey={expectedKey} pressedKey={pressedKey} lastErrorKey={lastErrorKey} layout={layout} size="sm" className="!p-2 sm:!p-3" fingerColors="full" handGuideMode="full" showHandsGuide showHomeRowAnchors showFingerLegend={false} />
  </div>
})
const RewardNotice = memo(function RewardNotice({ message }: { message: string }) {
  return <div role="status" className="h-5 text-xs font-mono text-emerald-300 flex items-center gap-2 pointer-events-none">{message && <><Sparkles size={12} />{message}</>}</div>
})
const PracticeText = memo(function PracticeText({ chars, inputRef, onFocus, label }: {
  chars: CharData[]; inputRef: React.RefObject<HTMLInputElement | null>; onFocus: () => void; label: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const container = containerRef.current
    const cursor = container?.querySelector<HTMLElement>("[data-current='true']")
    if (!container || !cursor) return
    const top = cursor.offsetTop
    if (top < container.scrollTop || top + cursor.offsetHeight > container.scrollTop + container.clientHeight) {
      container.scrollTop = Math.max(0, top - container.clientHeight / 2)
    }
  }, [chars])
  return <div ref={containerRef} onClick={onFocus} data-academy-drill className="relative h-36 overflow-y-auto rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 sm:p-5 cursor-text">
    <input ref={inputRef} readOnly data-academy-capture="true" aria-label={label} className="absolute opacity-0 w-px h-px" />
    <p className="font-mono text-2xl sm:text-[28px] leading-relaxed tracking-wide whitespace-pre-wrap break-words select-none">{chars.map((char, index) => <PracticeCharacter key={index} data={char} />)}</p>
  </div>
})
const PracticeCharacter = memo(function PracticeCharacter({ data }: { data: CharData }) {
  return <span data-current={data.state === "current"} className={data.state === "current" ? "text-white shadow-[inset_2px_0_0_#34d399] bg-emerald-400/10"
    : data.state === "correct" ? "text-emerald-300" : data.state === "incorrect" ? "text-rose-400 bg-rose-500/15" : "text-white/35"}>{data.char === " " && data.state === "incorrect" ? "·" : data.char}</span>
})
