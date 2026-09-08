"use client"

import { FINGER_COLORS } from "@/data/keyboardLayout"
import { useI18n } from "@/lib/i18n/i18nContext"

export function FingerGuide() {
  const { t, locale } = useI18n()
  const isEn = locale === "en"

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Left Hand */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <span className="text-xs font-black uppercase tracking-wider text-orange-400">
            {t("academy.fingerGuide.leftHand")}
          </span>
          <span className="text-[10px] text-white/40">
            {t("academy.fingerGuide.keysLeft")}
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <FingerRow
            finger="pinky"
            label={t("academy.fingerGuide.pinky")}
            keyLetter="A"
            color={FINGER_COLORS.pinky}
            bumpTooltip={t("academy.fingerGuide.bumpTooltip")}
            bumpLabel={t("academy.fingerGuide.bump")}
          />
          <FingerRow
            finger="ring"
            label={t("academy.fingerGuide.ring")}
            keyLetter="S"
            color={FINGER_COLORS.ring}
            bumpTooltip={t("academy.fingerGuide.bumpTooltip")}
            bumpLabel={t("academy.fingerGuide.bump")}
          />
          <FingerRow
            finger="middle"
            label={t("academy.fingerGuide.middle")}
            keyLetter="D"
            color={FINGER_COLORS.middle}
            bumpTooltip={t("academy.fingerGuide.bumpTooltip")}
            bumpLabel={t("academy.fingerGuide.bump")}
          />
          <FingerRow
            finger="index"
            label={t("academy.fingerGuide.index")}
            keyLetter="F"
            color={FINGER_COLORS.index}
            hasBump
            bumpTooltip={t("academy.fingerGuide.bumpTooltip")}
            bumpLabel={t("academy.fingerGuide.bump")}
          />
        </div>
      </div>

      {/* Right Hand */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
            {t("academy.fingerGuide.rightHand")}
          </span>
          <span className="text-[10px] text-white/40">
            {isEn ? t("academy.fingerGuide.keysRightEn") : t("academy.fingerGuide.keysRightPt")}
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <FingerRow
            finger="index"
            label={t("academy.fingerGuide.index")}
            keyLetter="J"
            color={FINGER_COLORS.index}
            hasBump
            bumpTooltip={t("academy.fingerGuide.bumpTooltip")}
            bumpLabel={t("academy.fingerGuide.bump")}
          />
          <FingerRow
            finger="middle"
            label={t("academy.fingerGuide.middle")}
            keyLetter="K"
            color={FINGER_COLORS.middle}
            bumpTooltip={t("academy.fingerGuide.bumpTooltip")}
            bumpLabel={t("academy.fingerGuide.bump")}
          />
          <FingerRow
            finger="ring"
            label={t("academy.fingerGuide.ring")}
            keyLetter="L"
            color={FINGER_COLORS.ring}
            bumpTooltip={t("academy.fingerGuide.bumpTooltip")}
            bumpLabel={t("academy.fingerGuide.bump")}
          />
          <FingerRow
            finger="pinky"
            label={t("academy.fingerGuide.pinky")}
            keyLetter={isEn ? ";" : "Ç"}
            color={FINGER_COLORS.pinky}
            bumpTooltip={t("academy.fingerGuide.bumpTooltip")}
            bumpLabel={t("academy.fingerGuide.bump")}
          />
        </div>
      </div>
    </div>
  )
}

function FingerRow({
  label,
  keyLetter,
  color,
  hasBump = false,
  bumpLabel = "BUMP",
  bumpTooltip = "Physical guide ridge on keyboard",
}: {
  finger: string
  label: string
  keyLetter: string
  color: { bg: string; text: string; border: string }
  hasBump?: boolean
  bumpLabel?: string
  bumpTooltip?: string
}) {
  return (
    <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-black/30 border border-white/5">
      <span className="text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`w-7 h-7 rounded-md font-mono font-black flex items-center justify-center border text-xs ${color.bg} ${color.text} ${color.border}`}
        >
          {keyLetter}
        </span>
        {hasBump && (
          <span
            className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20"
            title={bumpTooltip}
          >
            {bumpLabel}
          </span>
        )}
      </div>
    </div>
  )
}
