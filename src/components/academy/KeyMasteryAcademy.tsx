"use client"

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, BookOpen, Crosshair, Flame, Keyboard, Sparkles } from "lucide-react"
import { useAuth } from "@/lib/auth/authContext"
import { useI18n } from "@/lib/i18n/i18nContext"
import { useTypingEngine } from "@/hooks/useTypingEngine"
import { processAcademyLessonRewards } from "@/lib/progression/processActivityRewards"
import { FINGER_PALETTE, type KeyboardLayoutId } from "@/lib/keyboard/fingerMap"
import { generateKeyExercises, getPracticeFinger } from "@/lib/academy/keyExercises"
import {
  emptyKeyMastery, learnableKeys, loadMasteryProgress, localPracticeDate, masteryStorageKey,
  nextPracticeStage, recordMasteryPractice, recommendKey, saveMasteryProgress,
  type KeyMastery, type KeyStatus,
} from "@/lib/academy/keyMastery"
import type { TypingAttempt } from "@/lib/typing/typingAttempt"
import type { CharData, TypingStats } from "@/types/typing"
import { VirtualKeyboard } from "./VirtualKeyboard"
import { FingerGuide } from "./FingerGuide"

const STATUS_STYLE: Record<KeyStatus, string> = {
  untrained: "border-white/10 bg-white/[0.03] text-white/45",
  weak: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  learning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  good: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  mastered: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
}
const STATUS_PT: Record<KeyStatus, string> = { untrained: "Sem treino", weak: "Fraca", learning: "Aprendendo", good: "Boa", mastered: "Dominada" }
const STATUS_EN: Record<KeyStatus, string> = { untrained: "Untrained", weak: "Weak", learning: "Learning", good: "Good", mastered: "Mastered" }
const STAGES_PT = ["Repetição", "Tecla e âncora", "Transições comuns", "Sílabas e padrões", "Palavras", "Frases naturais"]
const STAGES_EN = ["Key repetition", "Key and anchor", "Common transitions", "Syllables and patterns", "Words", "Natural sentences"]
const subscribeHydration = () => () => {}
const clientReady = () => true
const serverReady = () => false
function defer(task: () => void) {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(task, { timeout: 500 })
  else setTimeout(task, 0)
}

export function KeyMasteryAcademy({ onOpenModule }: { onOpenModule: (id: string) => void }) {
  const { locale } = useI18n()
  const { user } = useAuth()
  const [layoutOverride, setLayoutOverride] = useState<KeyboardLayoutId | null>(null)
  const ready = useSyncExternalStore(subscribeHydration, clientReady, serverReady)
  const layout = layoutOverride ?? (locale === "en" ? "ANSI" : "ABNT2")
  const storageKey = masteryStorageKey(user?.id ?? "guest", layout)
  return <main className="min-h-screen max-w-6xl mx-auto px-4 py-8 space-y-7">
    <nav className="flex items-center justify-between gap-4">
      <Link href="/game" className="flex items-center gap-2 text-xs text-white/60 hover:text-white"><ArrowLeft size={16} />{locale === "en" ? "Back to game" : "Voltar ao jogo"}</Link>
      <label className="text-xs text-white/60 flex items-center gap-2">Layout
        <select aria-label="Keyboard layout" value={layout} onChange={(event) => setLayoutOverride(event.target.value as KeyboardLayoutId)} className="rounded-lg border border-white/15 bg-neutral-950 px-3 py-2 text-white">
          <option value="ABNT2">PT-BR · ABNT2</option><option value="ANSI">EN · ANSI</option>
        </select>
      </label>
    </nav>
    {ready ? <MasteryWorkspace key={storageKey} storageKey={storageKey} layout={layout} onOpenModule={onOpenModule} />
      : <p className="text-white/50">{locale === "en" ? "Loading key mastery…" : "Carregando domínio das teclas…"}</p>}
  </main>
}

function MasteryWorkspace({ storageKey, layout, onOpenModule }: { storageKey: string; layout: KeyboardLayoutId; onOpenModule: (id: string) => void }) {
  const { locale } = useI18n()
  const pt = locale !== "en"
  const labels = pt ? STATUS_PT : STATUS_EN
  const [progress, setProgress] = useState(() => loadMasteryProgress(storageKey))
  const progressRef = useRef(progress)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const keys = learnableKeys(layout)
  const commit = useCallback((attempts: TypingAttempt[], targetKey: string, stage: number, lessonCompleted: boolean) => {
    const next = recordMasteryPractice(progressRef.current, attempts, layout, { targetKey, stage, lessonCompleted })
    progressRef.current = next
    setProgress(next)
    // Writing storage is outside the immediate character/next-drill path.
    defer(() => saveMasteryProgress(storageKey, next))
    return next.keys[targetKey] ?? emptyKeyMastery()
  }, [layout, storageKey])

  if (activeKey) return <KeyPractice key={activeKey} targetKey={activeKey} layout={layout}
    initialRecord={progress.keys[activeKey] ?? emptyKeyMastery()} onRecord={commit} onBack={() => setActiveKey(null)} />

  const records = keys.map((key) => progress.keys[key] ?? emptyKeyMastery())
  const attempts = records.reduce((sum, record) => sum + record.attempts, 0)
  const correct = records.reduce((sum, record) => sum + record.correctAttempts, 0)
  const timedCorrect = records.reduce((sum, record) => sum + record.timedCorrect, 0)
  const responseTime = records.reduce((sum, record) => sum + record.responseTimeTotal, 0)
  const mastery = (records.reduce((sum, record) => sum + record.mastery, 0) / keys.length).toFixed(1)
  const lessons = records.reduce((sum, record) => sum + record.lessonsCompleted, 0)
  const today = progress.days[localPracticeDate()] ?? { attempts: 0, lessons: 0 }
  const recommended = recommendKey(progress, layout)
  const recommendation = progress.keys[recommended] ?? emptyKeyMastery()
  const rows = ["qwertyuiop", `asdfghjkl${layout === "ABNT2" ? "ç" : ""}`, "zxcvbnm", "0123456789"]
  const symbols = keys.filter((key) => !/^[a-zç0-9]$/.test(key))

  const keyButton = (key: string) => {
    const record = progress.keys[key] ?? emptyKeyMastery()
    const finger = getPracticeFinger(key, layout)
    return <button key={key} type="button" onClick={() => setActiveKey(key)}
      aria-label={`${key.toUpperCase()}: ${labels[record.status]}, ${record.mastery}%. ${pt ? "Treinar" : "Train"}`}
      title={`${labels[record.status]} · ${record.attempts} ${pt ? "tentativas" : "attempts"}`}
      className={`relative min-w-0 rounded-xl border px-1 py-3 font-mono hover:-translate-y-0.5 hover:border-white/50 focus-visible:outline-2 focus-visible:outline-emerald-400 transition-[transform,border-color] ${STATUS_STYLE[record.status]}`}>
      <span className="block font-black text-lg">{key.toUpperCase()}</span>
      <span className="block text-[10px] mt-1">{record.mastery}%</span>
      {finger && <span className="absolute left-3 right-3 bottom-1 h-0.5 rounded-full" style={{ background: FINGER_PALETTE[finger.finger].hex }} />}
    </button>
  }
  return <>
    <header className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-neutral-950 p-6 sm:p-8 overflow-hidden">
      <Keyboard size={100} className="absolute right-6 top-8 text-emerald-500/10 pointer-events-none" />
      <p className="text-xs font-mono tracking-[.25em] uppercase text-emerald-400">KeyForge Academy</p>
      <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-3">KEY <span className="text-emerald-400">MASTERY</span></h1>
      <p className="text-white/55 text-sm mt-3 max-w-lg">{pt ? "Cada tecla tem seu ritmo. Treine com precisão, encontre seus pontos fracos e forje seu domínio." : "Every key has a rhythm. Practice with precision, find your weak spots, and forge your mastery."}</p>
    </header>
    <section aria-label={pt ? "Seu progresso" : "Your progress"} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Metric label={pt ? "Velocidade" : "Overall speed"} value={`${Math.round(responseTime ? timedCorrect * 12000 / responseTime : 0)} WPM`} />
      <Metric label={pt ? "Precisão" : "Accuracy"} value={`${Math.round(attempts ? correct / attempts * 100 : 100)}%`} />
      <Metric label={pt ? "Domínio geral" : "Overall mastery"} value={`${mastery}%`} />
      <Metric label={pt ? "Lições concluídas" : "Lessons completed"} value={String(lessons)} />
      <Metric label={pt ? "Prática de hoje" : "Daily practice"} value={`${today.lessons} ${pt ? "lições" : "lessons"}`} detail={`${today.attempts} ${pt ? "tentativas" : "attempts"}`} />
    </section>
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
      <div className="flex items-center gap-4"><Crosshair className="text-emerald-400" /><div>
        <p className="text-xs text-emerald-300 uppercase font-mono">{pt ? "Próxima tecla recomendada" : "Recommended next key"}</p>
        <p className="text-white font-bold mt-1"><span className="text-2xl font-mono mr-2">{recommended.toUpperCase()}</span>{labels[recommendation.status]} · {recommendation.mastery}%</p>
      </div></div>
      <button onClick={() => setActiveKey(recommended)} className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-black font-bold text-sm hover:bg-emerald-300">{pt ? "Começar treino" : "Start practice"}<ArrowRight size={16} /></button>
    </section>
    <section className="rounded-3xl border border-white/10 bg-neutral-950/80 p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold">{pt ? "Seu mapa de teclas" : "Your key map"}</h2>
        <p className="text-xs text-white/45 mt-1">{pt ? "Escolha qualquer tecla. A faixa inferior indica o dedo." : "Choose any key. The lower stripe shows its finger."}</p></div><span className="text-xs font-mono text-white/40">{layout}</span></div>
      <div className="flex flex-wrap gap-2">{(Object.keys(STATUS_STYLE) as KeyStatus[]).map((status) => <span key={status} className={`text-[10px] px-2 py-1 border rounded-full ${STATUS_STYLE[status]}`}>{labels[status]}</span>)}</div>
      <div className="max-w-3xl mx-auto space-y-2">{rows.map((row, index) => <div key={row} className={`grid gap-1.5 sm:gap-2 ${index === 1 ? "mx-3" : index === 2 ? "mx-8" : ""}`} style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>{Array.from(row).map(keyButton)}</div>)}</div>
      <h3 className="text-xs font-mono uppercase text-white/45 pt-3">{pt ? "Símbolos e pontuação" : "Symbols and punctuation"}</h3>
      <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">{symbols.map(keyButton)}</div>
    </section>
    <div className="flex flex-wrap gap-3 text-xs">
      <button onClick={() => onOpenModule("intro")} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"><BookOpen size={16} />{pt ? "Guia de digitação" : "Typing guide"}</button>
      <button onClick={() => onOpenModule("home-row")} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"><Keyboard size={16} />{pt ? "Treino da linha central" : "Home-row practice"}</button>
      <p className="text-white/40 self-center">{pt ? "Progresso salvo neste navegador, por jogador e layout." : "Progress saved in this browser, per player and layout."}</p>
    </div>
  </>
}

const Metric = memo(function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p className="text-[10px] font-mono uppercase tracking-wider text-white/45">{label}</p><p className="text-xl font-black font-mono mt-2 text-emerald-300">{value}</p>{detail && <p className="text-[10px] text-white/45 mt-1">{detail}</p>}</div>
})

function KeyPractice({ targetKey, layout, initialRecord, onRecord, onBack }: {
  targetKey: string; layout: KeyboardLayoutId; initialRecord: KeyMastery; onBack: () => void
  onRecord: (attempts: TypingAttempt[], key: string, stage: number, completed: boolean) => KeyMastery
}) {
  const { locale } = useI18n()
  const pt = locale !== "en"
  // All six drills are ready before the first keystroke. The engine owns the hot path.
  const exercises = useMemo(() => generateKeyExercises(targetKey, layout), [targetKey, layout])
  const [stage, setStage] = useState(() => initialRecord.status === "mastered" ? 5 : Math.min(5, Math.floor(initialRecord.mastery / 18)))
  const stageRef = useRef(stage)
  const [record, setRecord] = useState(initialRecord)
  const [drills, setDrills] = useState(0)
  const drillsRef = useRef(0)
  const attemptsRef = useRef<TypingAttempt[]>([])
  const [announcement, setAnnouncement] = useState("")
  const collectAttempt = useCallback((attempt: TypingAttempt) => { attemptsRef.current.push(attempt) }, [])
  const complete = useCallback((stats: TypingStats) => {
    drillsRef.current += 1
    const lessonCompleted = drillsRef.current % 6 === 0
    const nextRecord = onRecord(attemptsRef.current, targetKey, stageRef.current, lessonCompleted)
    attemptsRef.current = []
    const nextStage = nextPracticeStage(stageRef.current, nextRecord)
    stageRef.current = nextStage
    // Reset refs synchronously, accepting the next key even before React commits a render.
    setStage(nextStage)
    setRecord(nextRecord)
    setDrills(drillsRef.current)
    if (lessonCompleted) defer(() => {
      const reward = processAcademyLessonRewards(`key-mastery-${layout}-${targetKey}`, stats)
      setAnnouncement(`+${reward.xpGained} XP${reward.didLevelUp ? ` · Level ${reward.newLevel}` : ""}${reward.didRankUp ? ` · ${reward.newRank}` : ""}`)
    })
    return { text: exercises[nextStage].text, id: `academy-key-${targetKey}-${drillsRef.current}`, fresh: lessonCompleted }
  }, [exercises, layout, onRecord, targetKey])
  useEffect(() => () => {
    if (attemptsRef.current.length) {
      onRecord(attemptsRef.current, targetKey, stageRef.current, false)
      attemptsRef.current = []
    }
  }, [onRecord, targetKey])
  const leave = () => {
    if (attemptsRef.current.length) onRecord(attemptsRef.current, targetKey, stageRef.current, false)
    attemptsRef.current = []
    onBack()
  }
  return <div className="space-y-5 max-w-4xl mx-auto">
    <button onClick={leave} className="flex items-center gap-2 text-xs text-white/60 hover:text-white"><ArrowLeft size={16} />{pt ? "Mapa de teclas" : "Key map"}</button>
    <header className="flex items-center justify-between gap-4 rounded-3xl border border-emerald-500/25 bg-emerald-950/20 p-5">
      <div><p className="text-xs font-mono uppercase tracking-widest text-emerald-400">Key Mastery · {layout}</p><h1 className="text-3xl font-black mt-2">{pt ? "Forje a tecla" : "Forge the key"} <span className="text-emerald-400 font-mono">{targetKey.toUpperCase()}</span></h1><p className="text-xs text-white/50 mt-2">{(pt ? STAGES_PT : STAGES_EN)[stage]} · {drills} {pt ? "exercícios" : "drills"}</p></div>
      <div className="text-right"><p className="text-3xl font-black font-mono text-emerald-300">{record.mastery}%</p><span className={`inline-block text-[10px] px-2 py-1 rounded-full border ${STATUS_STYLE[record.status]}`}>{(pt ? STATUS_PT : STATUS_EN)[record.status]}</span></div>
    </header>
    <div className="flex gap-1.5" aria-label={pt ? "Etapas do treino" : "Practice stages"}>{(pt ? STAGES_PT : STAGES_EN).map((label, index) => <div key={label} title={label} className={`h-1.5 flex-1 rounded-full ${index === stage ? "bg-emerald-400" : index < stage ? "bg-emerald-800" : "bg-white/10"}`} />)}</div>
    <DrillRunner text={exercises[stage].text} textId={`academy-key-${targetKey}-${drills}`} layout={layout} onAttempt={collectAttempt} onComplete={complete} />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Metric label={pt ? "Tentativas / acertos" : "Attempts / correct"} value={`${record.attempts} / ${record.correctAttempts}`} detail={`${record.errors} ${pt ? "erros" : "errors"}`} />
      <Metric label={pt ? "Precisão da tecla" : "Key accuracy"} value={`${Math.round(record.accuracy)}%`} />
      <Metric label={pt ? "Resposta média" : "Average response"} value={`${Math.round(record.averageResponseTime)} ms`} />
      <Metric label={pt ? "Velocidade média / melhor" : "Average / best speed"} value={`${Math.round(record.averageSpeed)} / ${Math.round(record.bestSpeed)}`} detail={`${record.lessonsCompleted} ${pt ? "lições" : "lessons"} · WPM`} />
    </div>
    <section className="rounded-2xl border border-white/10 p-4"><h2 className="text-xs font-mono uppercase text-white/50">{pt ? "Desempenho recente da tecla" : "Recent key performance"}</h2>
      <div className="flex gap-2 mt-3">{record.recentPerformance.map((sample, index) => <div key={index} className="flex-1 min-w-0 text-center"><div className="h-12 flex items-end justify-center"><div className={`w-full max-w-10 rounded-t ${sample.accuracy >= 96 ? "bg-emerald-400/60" : "bg-amber-400/60"}`} style={{ height: `${sample.accuracy}%` }} /></div><p className="text-[9px] text-white/50 mt-1">{Math.round(sample.accuracy)}%</p></div>)}</div>
      <p className="text-[11px] text-white/40 mt-3">{pt ? "Domínio exige 100+ tentativas, 96% de precisão e desempenho recente estável, incluindo palavras ou frases." : "Mastery needs 100+ attempts, 96% accuracy and stable recent performance, including words or sentences."}</p>
    </section>
    <RewardNotice message={announcement} />
    <FingerGuide layout={layout} />
    <p className="text-center text-xs text-white/40 flex justify-center items-center gap-2"><Flame size={14} />{pt ? "Treino contínuo: uma lição a cada 6 exercícios. Saia quando quiser." : "Continuous practice: one lesson every 6 drills. Leave whenever you like."}</p>
  </div>
}

/** Only this small subtree reacts to each keystroke. The page and mastery panels stay still. */
const DrillRunner = memo(function DrillRunner({ text, textId, layout, onAttempt, onComplete }: {
  text: string; textId: string; layout: KeyboardLayoutId; onAttempt: (attempt: TypingAttempt) => void
  onComplete: (stats: TypingStats) => { text: string; id: string; fresh: boolean }
}) {
  const { locale } = useI18n()
  const pt = locale !== "en"
  const complete = (stats: TypingStats): void => {
    const next = onComplete(stats)
    if (next.fresh) resetAll(next.text)
    else nextRound(next.text, next.id)
  }
  const { chars, stats, inputRef, nextRound, resetAll, focus, expectedKey, pressedKey, lastErrorKey } = useTypingEngine({
    text, textId, onComplete: complete, onAttempt, statsUpdateIntervalMs: 100,
  })
  useLayoutEffect(() => { focus() }, [focus])
  const activeFinger = getPracticeFinger(expectedKey, layout)
  const palette = activeFinger ? FINGER_PALETTE[activeFinger.finger] : null
  return <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3"><Metric label={pt ? "Precisão ao vivo" : "Live accuracy"} value={`${stats.battleAccuracy}%`} /><Metric label="WPM" value={String(stats.currentWpm)} /><Metric label="Combo" value={`${stats.combo}×`} /></div>
    <PracticeText chars={chars} inputRef={inputRef} onFocus={focus} label={pt ? "Digite o exercício" : "Type the drill"} />
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-4 py-3 rounded-xl border border-white/10 bg-neutral-900">
      <span style={{ color: palette?.hex }}>{palette?.name[pt ? "pt-BR" : "en"] ?? ""} · <strong>{expectedKey === " " ? (pt ? "ESPAÇO" : "SPACE") : expectedKey?.toUpperCase()}</strong></span>
      <span className="text-white/45">{pt ? "Errou? Continue. Cada tentativa conta." : "Made a typo? Keep going. Every attempt counts."}</span>
    </div>
    <VirtualKeyboard activeKey={expectedKey} pressedKey={pressedKey} lastErrorKey={lastErrorKey} layout={layout} fingerColors="full" handGuideMode="full" showHandsGuide showHomeRowAnchors />
  </div>
})

const RewardNotice = memo(function RewardNotice({ message }: { message: string }) {
  return <div role="status" className="h-6 text-xs font-mono text-emerald-300 flex items-center gap-2 pointer-events-none">{message && <><Sparkles size={14} />{message}</>}</div>
})
const PracticeText = memo(function PracticeText({ chars, inputRef, onFocus, label }: {
  chars: CharData[]; inputRef: React.RefObject<HTMLInputElement | null>; onFocus: () => void; label: string
}) {
  return <div onClick={onFocus} className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 sm:p-7 cursor-text">
    <input ref={inputRef} readOnly aria-label={label} className="absolute opacity-0 w-px h-px" />
    <p className="font-mono text-xl leading-loose tracking-wide whitespace-pre-wrap break-words select-none">{chars.map((char, index) => <PracticeCharacter key={index} data={char} />)}</p>
  </div>
})
const PracticeCharacter = memo(function PracticeCharacter({ data }: { data: CharData }) {
  return <span className={data.state === "current" ? "text-white shadow-[inset_2px_0_0_#34d399] bg-emerald-400/10"
    : data.state === "correct" ? "text-emerald-300" : data.state === "incorrect" ? "text-rose-400 bg-rose-500/15" : "text-white/35"}>{data.char === " " && data.state === "incorrect" ? "·" : data.char}</span>
})
