"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import {
  Check,
  RotateCcw,
  X,
} from "lucide-react"
import { useCosmetics } from "@/hooks/useCosmetics"
import { useI18n } from "@/lib/i18n/i18nContext"
import { getCrateById } from "@/data/crates"
import { RARITY_DETAILS } from "@/data/keyboardSkins"
import { CosmeticUnlockResult } from "@/types/cosmetics"

interface CrateOpeningModalProps {
  crateId: string
  isOpen: boolean
  onClose: () => void
}

type OpeningPhase = "ready" | "charging" | "revealed"

export function CrateOpeningModal({
  crateId,
  isOpen,
  onClose,
}: CrateOpeningModalProps) {
  const { locale, t } = useI18n()
  const {
    crates,
    openCrate,
    equipSkin,
    equippedSkinId,
    isGuest,
  } = useCosmetics()

  const crate = getCrateById(crateId)
  const remainingCount = crates[crateId] ?? 0

  const [phase, setPhase] = useState<OpeningPhase>("ready")
  const [result, setResult] = useState<CosmeticUnlockResult | null>(null)
  const [isOpening, setIsOpening] = useState(false)

  const handleStartOpen = async () => {
    if (remainingCount <= 0 || isOpening) return

    setIsOpening(true)
    setPhase("charging")

    // Dramatic vibration and chakra charge duration
    setTimeout(async () => {
      const drop = await openCrate(crateId)
      setResult(drop)
      setPhase("revealed")
      setIsOpening(false)
    }, 1800)
  }

  const handleResetForAnother = () => {
    setPhase("ready")
    setResult(null)
  }

  const handleEquipNow = () => {
    if (result && !result.isDuplicate) {
      equipSkin(result.skin.id)
    }
  }

  if (!isOpen) return null

  const isEquipped = result ? equippedSkinId === result.skin.id : false

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg p-6 rounded-3xl bg-neutral-950 border border-white/15 shadow-2xl relative overflow-hidden flex flex-col items-center text-center space-y-6"
      >
        {/* Ambient Glow Aura */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 blur-[130px] pointer-events-none opacity-30"
          style={{ backgroundColor: crate.color }}
        />

        {/* Close Button */}
        {phase !== "charging" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors z-20"
          >
            <X size={18} />
          </button>
        )}

        {/* Guest Mode Indicator */}
        {isGuest && (
          <div className="w-full px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
            {t("lockerModule.openingModal.guestNotice")}
          </div>
        )}

        {/* PHASE 1: READY TO OPEN */}
        {phase === "ready" && (
          <div className="space-y-6 w-full py-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">
                {t("lockerModule.openingModal.typingCrateCategory")}
              </span>
              <h2 className="text-2xl font-black text-white">
                {t(`lockerModule.crates.${crate.id}.name`)}
              </h2>
              <p className="text-xs text-white/60 max-w-sm mx-auto">
                {t(`lockerModule.crates.${crate.id}.description`)}
              </p>
            </div>

            {/* 3D Crate Box Representation */}
            <motion.div
              className="relative w-40 h-40 mx-auto rounded-3xl border-2 flex items-center justify-center text-6xl shadow-2xl"
              style={{
                backgroundColor: `${crate.color}15`,
                borderColor: crate.color,
                boxShadow: `0 0 40px ${crate.bgGlow}`,
              }}
              animate={{ y: [0, -8, 0], rotate: [0, 1, -1, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span>{crate.icon}</span>
              <div className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-black border border-white/20 text-[10px] font-mono font-bold text-white">
                {t("lockerModule.openingModal.availableBadge", { count: remainingCount })}
              </div>
            </motion.div>

            {/* Drop Rates Telemetry Preview */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 max-w-sm mx-auto text-left space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/50 border-b border-white/5 pb-1">
                <span>{t("lockerModule.openingModal.probabilities")}</span>
                <span>{(crate.guaranteedMinRarity ?? "common").toUpperCase()} +</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                {crate.dropWeights
                  .filter((w) => w.weight > 0)
                  .map((w) => (
                    <span
                      key={w.rarity}
                      className={`px-2 py-0.5 rounded border ${RARITY_DETAILS[w.rarity].bgBadge}`}
                    >
                      {RARITY_DETAILS[w.rarity].name[locale === "pt-BR" ? "pt-BR" : "en"]}:{" "}
                      {w.weight}%
                    </span>
                  ))}
              </div>
            </div>

            {/* Action button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStartOpen}
                disabled={remainingCount <= 0}
                className="w-full max-w-sm py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-black font-black text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(245,158,11,0.5)] cursor-pointer hover:scale-102 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {remainingCount > 0
                  ? t("lockerModule.openingModal.openNowBtn")
                  : t("lockerModule.openingModal.noCratesLeft")}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: CHARGING / UNLOCKING RATTLE */}
        {phase === "charging" && (
          <div className="py-12 space-y-6 w-full">
            <motion.div
              className="relative w-44 h-44 mx-auto rounded-3xl border-2 flex items-center justify-center text-7xl shadow-2xl"
              style={{
                backgroundColor: `${crate.color}25`,
                borderColor: crate.color,
                boxShadow: `0 0 60px ${crate.bgGlow}`,
              }}
              animate={{
                x: [-4, 4, -6, 6, -3, 3, 0],
                y: [-3, 3, -4, 4, -2, 2, 0],
                rotate: [-3, 3, -5, 5, -2, 2, 0],
                scale: [1, 1.05, 1.08, 1.12],
              }}
              transition={{ duration: 0.2, repeat: 9 }}
            >
              <span>{crate.icon}</span>
            </motion.div>

            <div className="space-y-1">
              <motion.div
                className="text-lg font-black text-orange-400 tracking-widest uppercase font-mono animate-pulse"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                ⚡ {t("lockerModule.openingModal.forgingKeycaps")} ⚡
              </motion.div>
              <p className="text-xs text-white/40 font-mono">
                {t("lockerModule.openingModal.channelingEnergy")}
              </p>
            </div>
          </div>
        )}

        {/* PHASE 3: REVEALED LOOT CARD */}
        {phase === "revealed" && result && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-full space-y-6 py-2"
          >
            {/* Header Result Badge */}
            <div>
              {result.isDuplicate ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black uppercase tracking-wider">
                  {t("lockerModule.openingModal.duplicateSalvaged")}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono text-xs font-black uppercase tracking-wider animate-pulse">
                  {t("lockerModule.openingModal.newSkinUnlocked")}
                </span>
              )}
            </div>

            {/* Dropped Skin Card */}
            <div
              className="p-5 rounded-3xl border-2 text-center space-y-3 relative overflow-hidden"
              style={{
                borderColor: result.skin.visual.accentColor,
                backgroundColor: `${result.skin.visual.accentColor}10`,
                boxShadow: `0 0 35px ${result.skin.visual.accentColor}30`,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase ${
                    RARITY_DETAILS[result.skin.rarity].bgBadge
                  }`}
                >
                  {RARITY_DETAILS[result.skin.rarity].name[locale === "pt-BR" ? "pt-BR" : "en"]}
                </span>
                <span className="text-[10px] font-mono text-white/40 uppercase">
                  {t(`lockerModule.collections.${result.skin.collection}`)}
                </span>
              </div>

              {/* 3D Keycap Trio Swatch */}
              <div
                className={`h-16 rounded-2xl p-2 border border-white/10 flex items-center justify-center gap-2 shadow-inner ${result.skin.visual.frameBg}`}
              >
                <div
                  className={`w-9 h-10 rounded-xl border text-xs font-mono font-black flex items-center justify-center shadow-md ${result.skin.visual.keyBg} ${result.skin.visual.keyText} ${result.skin.visual.keyBorder}`}
                >
                  K
                </div>
                <div
                  className={`w-9 h-10 rounded-xl border text-xs font-mono font-black flex items-center justify-center shadow-md ${result.skin.visual.keyExpectedBg}`}
                >
                  F
                </div>
                <div
                  className={`w-9 h-10 rounded-xl border text-xs font-mono font-black flex items-center justify-center shadow-md ${result.skin.visual.keyBg} ${result.skin.visual.keyText} ${result.skin.visual.keyBorder}`}
                >
                  G
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">{result.skin.name}</h3>
                <p className="text-xs text-white/50">{result.skin.description}</p>
              </div>

              {/* Duplicate Shards Notice */}
              {result.isDuplicate && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
                  {t("lockerModule.openingModal.duplicateNotice", { amount: result.shardsAwarded })}
                </div>
              )}
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              {!result.isDuplicate && (
                <button
                  type="button"
                  onClick={handleEquipNow}
                  className={`w-full py-3 rounded-2xl font-mono text-xs font-black uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isEquipped
                      ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300"
                      : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  }`}
                >
                  <Check size={16} />
                  <span>
                    {isEquipped
                      ? t("lockerModule.openingModal.equippedBadge")
                      : t("lockerModule.openingModal.equipNowBtn")}
                  </span>
                </button>
              )}

              {remainingCount > 0 ? (
                <button
                  type="button"
                  onClick={handleResetForAnother}
                  className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  <span>
                    {t("lockerModule.openingModal.openAnotherBtn", { count: remainingCount })}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-mono text-xs font-bold transition-all cursor-pointer"
                >
                  {t("lockerModule.openingModal.doneBtn")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
