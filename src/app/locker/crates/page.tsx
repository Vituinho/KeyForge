"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Package,
  Sparkles,
  Hammer,
  Info,
} from "lucide-react"
import { useCosmetics } from "@/hooks/useCosmetics"
import { useI18n } from "@/lib/i18n/i18nContext"
import { ALL_CRATES, CrateDetails } from "@/data/crates"
import { RARITY_DETAILS } from "@/data/keyboardSkins"
import { CrateOpeningModal } from "@/components/cosmetics/CrateOpeningModal"

export default function CratesWorkshopPage() {
  const { locale, t } = useI18n()
  const {
    crates,
    forgeShards,
    addShards,
    addCrates,
    isGuest,
  } = useCosmetics()

  const [activeCrateId, setActiveCrateId] = useState<string | null>(null)
  const [forgingCrateId, setForgingCrateId] = useState<string | null>(null)

  // Forge a Crate using scrap Forge Shards
  const handleForgeCrate = (crate: CrateDetails) => {
    if (forgeShards < crate.costShards) return

    setForgingCrateId(crate.id)
    addShards(-crate.costShards)
    addCrates(crate.id, 1)

    setTimeout(() => {
      setForgingCrateId(null)
      setActiveCrateId(crate.id)
    }, 400)
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 relative overflow-hidden select-none">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/10 blur-[180px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* TOP HEADER */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link
              href="/locker"
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all flex items-center gap-2 text-xs font-mono font-bold"
            >
              <ArrowLeft size={16} />
              <span>{t("lockerModule.workshop.backToLocker")}</span>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                  <Package className="text-purple-400" size={24} />
                  <span>{t("lockerModule.workshop.title")}</span>
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-[11px] font-bold">
                  {t("lockerModule.workshop.cosmeticLootBadge")}
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {t("lockerModule.workshop.subtitle")}
              </p>
            </div>
          </div>

          {/* Shards Counter */}
          <div className="px-4 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs font-mono flex items-center gap-2 text-orange-400 font-bold">
            <Sparkles size={16} />
            <span>💎 {forgeShards}</span>
            <span className="text-white/40 text-[11px]">
              {t("lockerModule.workshop.forgeShardsBadge")}
            </span>
          </div>
        </header>

        {/* Guest Mode Notice */}
        {isGuest && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Info size={16} />
              <span>
                {t("lockerModule.workshop.guestModeNotice")}
              </span>
            </div>
            <Link
              href="/register"
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-black text-xs hover:bg-amber-400 transition-all shrink-0"
            >
              {t("lockerModule.workshop.createAccountBtn")}
            </Link>
          </div>
        )}

        {/* CRATES GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ALL_CRATES.map((crate) => {
            const availableCount = crates[crate.id] ?? 0
            const canAffordForge = forgeShards >= crate.costShards
            const isForging = forgingCrateId === crate.id

            return (
              <motion.div
                key={crate.id}
                whileHover={{ y: -3 }}
                className="p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-6 relative overflow-hidden"
                style={{
                  borderColor: `${crate.color}40`,
                  backgroundColor: `${crate.color}08`,
                  boxShadow: `0 10px 30px ${crate.bgGlow}`,
                }}
              >
                {/* Ambient Top Flare */}
                <div
                  className="absolute -top-12 -right-12 w-36 h-36 blur-3xl pointer-events-none opacity-25"
                  style={{ backgroundColor: crate.color }}
                />

                <div className="space-y-4">
                  {/* Crate Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-14 h-14 rounded-2xl border flex items-center justify-center text-3xl shadow-lg"
                        style={{
                          borderColor: crate.color,
                          backgroundColor: `${crate.color}20`,
                        }}
                      >
                        {crate.icon}
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-white">
                          {t(`lockerModule.crates.${crate.id}.name`)}
                        </h2>
                        <span className="text-[11px] font-mono text-white/40">
                          {t("lockerModule.workshop.guaranteedMin")}{" "}
                          <strong className="text-white font-bold uppercase">
                            {RARITY_DETAILS[crate.guaranteedMinRarity ?? "common"].name[locale === "pt-BR" ? "pt-BR" : "en"]}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-white">
                        {availableCount}
                      </div>
                      <span className="text-[10px] font-mono text-white/40 uppercase">
                        {t("lockerModule.workshop.available")}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-white/60 leading-relaxed">
                    {t(`lockerModule.crates.${crate.id}.description`)}
                  </p>

                  {/* Drop Table Breakdown */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <span className="text-[10px] font-mono text-white/40 uppercase block">
                      {t("lockerModule.workshop.dropTableTitle")}
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                      {crate.dropWeights
                        .filter((w) => w.weight > 0)
                        .map((w) => (
                          <span
                            key={w.rarity}
                            className={`px-2 py-0.5 rounded border ${
                              RARITY_DETAILS[w.rarity].bgBadge
                            }`}
                          >
                            {RARITY_DETAILS[w.rarity].name[locale === "pt-BR" ? "pt-BR" : "en"]}:{" "}
                            {w.weight}%
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {/* CTAs Footer */}
                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
                  {/* Open Crate button */}
                  <button
                    type="button"
                    onClick={() => setActiveCrateId(crate.id)}
                    disabled={availableCount <= 0}
                    className={`w-full py-3 rounded-2xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      availableCount > 0
                        ? "bg-gradient-to-r from-orange-500 to-amber-400 text-black shadow-[0_0_20px_rgba(249,115,22,0.5)] hover:scale-102 active:scale-98"
                        : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    <Package size={15} />
                    <span>
                      {availableCount > 0
                        ? t("lockerModule.workshop.openCrateCount", { count: availableCount })
                        : t("lockerModule.workshop.noneAvailable")}
                    </span>
                  </button>

                  {/* Forge with Shards button */}
                  <button
                    type="button"
                    onClick={() => handleForgeCrate(crate)}
                    disabled={!canAffordForge || isForging}
                    className={`w-full py-3 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      canAffordForge
                        ? "bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300 cursor-pointer"
                        : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                    }`}
                    title={
                      canAffordForge
                        ? t("lockerModule.workshop.forgeTooltip")
                        : t("lockerModule.workshop.insufficientShards")
                    }
                  >
                    <Hammer size={14} />
                    <span>
                      {t("lockerModule.workshop.forgeBtn", { cost: crate.costShards })}
                    </span>
                  </button>
                </div>
              </motion.div>
            )
          })}
        </section>
      </div>

      {/* Crate Opening Interactive Modal */}
      {activeCrateId && (
        <CrateOpeningModal
          crateId={activeCrateId}
          isOpen={Boolean(activeCrateId)}
          onClose={() => setActiveCrateId(null)}
        />
      )}
    </main>
  )
}
