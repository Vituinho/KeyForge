"use client"

import { Gauge, Target, Flame, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"

interface BattleHudProps {
  wpm: number
  accuracy: number
  combo: number
  errors: number
  themeColor?: string
}

export function BattleHud({ wpm, accuracy, combo, errors, themeColor = "#f97316" }: BattleHudProps) {
  const { t } = useI18n()

  return (
    <div className="grid w-full grid-cols-2 min-[420px]:grid-cols-4 gap-2">
      <StatPill
        icon={<Gauge size={14} />}
        label={t("common.wpm")}
        value={wpm}
        color={themeColor}
        glow
      />
      <StatPill
        icon={<Target size={14} />}
        label={t("battle.hud.acc")}
        value={`${accuracy}%`}
        color={accuracy >= 95 ? "#22c55e" : accuracy >= 80 ? "#eab308" : "#ef4444"}
      />
      <StatPill
        icon={<Flame size={14} />}
        label={t("battle.hud.combo")}
        value={`×${combo}`}
        color={combo >= 20 ? "#f59e0b" : combo >= 10 ? "#a78bfa" : "#94a3b8"}
        glow={combo >= 10}
      />
      <StatPill
        icon={<X size={14} />}
        label={t("battle.hud.errors")}
        value={errors}
        color="#ef4444"
      />
    </div>
  )
}

function StatPill({
  icon,
  label,
  value,
  color,
  glow,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  glow?: boolean
}) {
  return (
    <div
      className="flex min-w-0 flex-col items-center justify-center px-2 py-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
      style={glow ? { boxShadow: `0 0 12px ${color}55` } : undefined}
    >
      <div className="flex items-center gap-1 mb-0.5" style={{ color }}>
        {icon}
        <span className="text-xs font-semibold leading-snug">{label}</span>
      </div>
      <span className="text-lg font-black text-white tabular-nums">{value}</span>
    </div>
  )
}
