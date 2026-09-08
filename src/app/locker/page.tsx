"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Sparkles,
  Check,
  Lock,
  Search,
  Package,
  Sliders,
  X,
} from "lucide-react"
import { useCosmetics } from "@/hooks/useCosmetics"
import { useI18n } from "@/lib/i18n/i18nContext"
import {
  ALL_KEYBOARD_SKINS,
  RARITY_DETAILS,
  getSkinById,
} from "@/data/keyboardSkins"
import { TypingKeyboard } from "@/components/keyboard/TypingKeyboard"
import {
  SkinRarity,
  SkinCollection,
  KeyboardSkin,
  EffectIntensity,
} from "@/types/cosmetics"

const ALL_RARITIES: SkinRarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
  "secret",
]

const ALL_COLLECTIONS: { id: SkinCollection; label: string }[] = [
  { id: "forge", label: "KeyForge" },
  { id: "shinobi", label: "Shinobi" },
  { id: "cosmic", label: "Cosmic" },
  { id: "cursed", label: "Cursed" },
  { id: "pirate", label: "Pirate" },
  { id: "shadow", label: "Shadow" },
  { id: "cyber", label: "Cyber" },
]

export default function KeyboardLockerPage() {
  const { locale } = useI18n()
  const {
    equippedSkinId,
    unlockedSkinIds,
    forgeShards,
    crates,
    settings,
    equipSkin,
    updateSettings,
  } = useCosmetics()

  // Selected skin for live showcase preview
  const [selectedSkinId, setSelectedSkinId] = useState<string>(equippedSkinId)
  const selectedSkin = useMemo<KeyboardSkin>(() => {
    return getSkinById(selectedSkinId)
  }, [selectedSkinId])

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRarity, setSelectedRarity] = useState<"all" | SkinRarity>("all")
  const [selectedCollection, setSelectedCollection] = useState<"all" | SkinCollection>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "unlocked" | "locked">("all")

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Interactive Live Typing Test on preview keyboard
  const testSample =
    locale === "pt-BR"
      ? "guerreiro shinobi digite com velocidade e precisao"
      : "shinobi typing warrior master velocity and precision"
  const [testInput, setTestInput] = useState("")
  const [testPressedKey, setTestPressedKey] = useState<string | null>(null)
  const [testErrorKey, setLastErrorKey] = useState<string | null>(null)

  const expectedTestChar = testSample[testInput.length] ?? null

  const handleTestKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const lastChar = val.length > 0 ? val[val.length - 1] : null

    if (testSample.startsWith(val)) {
      if (lastChar) {
        setTestPressedKey(lastChar)
        setTimeout(() => setTestPressedKey(null), 150)
      }
      setTestInput(val)
      if (val === testSample) {
        setTimeout(() => setTestInput(""), 800)
      }
    } else {
      if (lastChar) {
        setLastErrorKey(lastChar)
        setTimeout(() => setLastErrorKey(null), 300)
      }
    }
  }

  // Filtered skins list
  const filteredSkins = useMemo(() => {
    return ALL_KEYBOARD_SKINS.filter((skin) => {
      // Hidden secret skins only show if unlocked or searched
      const isUnlocked = unlockedSkinIds.includes(skin.id)
      if (skin.isHidden && !isUnlocked && !searchQuery.trim()) {
        return false
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = skin.name.toLowerCase().includes(q)
        const matchesTheme = skin.theme.toLowerCase().includes(q)
        if (!matchesName && !matchesTheme) return false
      }

      // Rarity
      if (selectedRarity !== "all" && skin.rarity !== selectedRarity) {
        return false
      }

      // Collection
      if (selectedCollection !== "all" && skin.collection !== selectedCollection) {
        return false
      }

      // Status
      if (statusFilter === "unlocked" && !isUnlocked) return false
      if (statusFilter === "locked" && isUnlocked) return false

      return true
    })
  }, [searchQuery, selectedRarity, selectedCollection, statusFilter, unlockedSkinIds])

  const isSelectedEquipped = equippedSkinId === selectedSkin.id
  const isSelectedUnlocked = unlockedSkinIds.includes(selectedSkin.id)
  const totalCratesCount = Object.values(crates).reduce((sum, count) => sum + count, 0)

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 relative overflow-hidden select-none">
      {/* Dynamic Background Auras based on selected skin accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] blur-[180px] pointer-events-none opacity-20 transition-colors duration-700"
        style={{ backgroundColor: selectedSkin.visual.accentColor }}
      />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* TOP BAR */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link
              href="/game"
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all flex items-center gap-2 text-xs font-mono font-bold"
            >
              <ArrowLeft size={16} />
              <span>{locale === "pt-BR" ? "Painel" : "Dashboard"}</span>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                  <Sparkles className="text-amber-400" size={24} />
                  <span>{locale === "pt-BR" ? "ARSENAL DE TECLADOS" : "KEYBOARD LOCKER"}</span>
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[11px] font-bold">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {locale === "pt-BR"
                  ? "Personalize seu chassis, keycaps e efeitos. 100% cosmético."
                  : "Customize chassis, keycaps, and visual auras. 100% cosmetic."}
              </p>
            </div>
          </div>

          {/* TELEMETRY BADGES */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Unlocked Counter */}
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono flex items-center gap-2">
              <span className="text-white/40">{locale === "pt-BR" ? "Skins" : "Skins"}:</span>
              <strong className="text-white">
                {unlockedSkinIds.length} / {ALL_KEYBOARD_SKINS.length}
              </strong>
            </div>

            {/* Forge Shards */}
            <div className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs font-mono flex items-center gap-2 text-orange-400 font-bold">
              <span>💎 {forgeShards}</span>
              <span className="text-white/40 text-[10px]">
                {locale === "pt-BR" ? "Fragmentos" : "Shards"}
              </span>
            </div>

            {/* Crates quick access */}
            <Link
              href="/locker/crates"
              className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-xs font-mono flex items-center gap-1.5 text-purple-300 transition-all font-bold"
            >
              <Package size={14} />
              <span>{locale === "pt-BR" ? "Caixas" : "Crates"}</span>
              {totalCratesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-black text-[10px] font-black">
                  {totalCratesCount}
                </span>
              )}
            </Link>

            {/* Accessibility Settings */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
              title={locale === "pt-BR" ? "Configurações de Teclado" : "Keyboard Settings"}
            >
              <Sliders size={16} />
            </button>
          </div>
        </header>

        {/* LIVE SHOWCASE PREVIEW BANNER */}
        <section className="p-6 rounded-3xl border border-white/15 bg-neutral-950/70 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left: Selected Skin Info */}
            <div className="w-full lg:w-1/3 space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-md border text-xs font-mono font-black uppercase ${
                    RARITY_DETAILS[selectedSkin.rarity].bgBadge
                  }`}
                >
                  {RARITY_DETAILS[selectedSkin.rarity].name[locale === "pt-BR" ? "pt-BR" : "en"]}
                </span>
                <span className="text-xs text-white/40 font-mono capitalize">
                  {selectedSkin.collection} · {selectedSkin.theme}
                </span>
              </div>

              <h2 className="text-3xl font-black text-white tracking-tight">
                {selectedSkin.name}
              </h2>

              <p className="text-sm text-white/60 leading-relaxed">
                {selectedSkin.description}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                {isSelectedEquipped ? (
                  <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-black text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <Check size={18} />
                    <span>{locale === "pt-BR" ? "EQUIPADO" : "EQUIPPED"}</span>
                  </div>
                ) : isSelectedUnlocked ? (
                  <button
                    type="button"
                    onClick={() => equipSkin(selectedSkin.id)}
                    className="px-6 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-black font-black text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(249,115,22,0.6)] cursor-pointer hover:scale-105 active:scale-95"
                  >
                    {locale === "pt-BR" ? "Equipar Skin" : "Equip Skin"}
                  </button>
                ) : (
                  <div className="px-4 py-2 rounded-2xl bg-neutral-900 border border-white/10 text-white/40 font-mono text-xs flex items-center gap-2">
                    <Lock size={14} className="text-red-400" />
                    <span>
                      {selectedSkin.obtainableFrom ??
                        (locale === "pt-BR" ? "Obtenha em Caixas" : "Available in Crates")}
                    </span>
                  </div>
                )}

                {/* Shard salvage value badge */}
                <span className="text-[11px] font-mono text-white/40">
                  {locale === "pt-BR" ? "Valor de Fragmentos:" : "Shards Value:"}{" "}
                  <strong className="text-orange-400">{selectedSkin.shardsValue} 💎</strong>
                </span>
              </div>

              {/* Interactive test typing input */}
              <div className="pt-3">
                <span className="text-[10px] font-mono text-white/40 block mb-1">
                  {locale === "pt-BR"
                    ? "DIGITE AQUI PARA TESTAR A SENSAÇÃO TÁTIL:"
                    : "TYPE HERE TO TEST THE TACTILE SWITCHES:"}
                </span>
                <input
                  type="text"
                  value={testInput}
                  onChange={handleTestKeyInput}
                  placeholder={testSample}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/20 text-xs font-mono text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500"
                  spellCheck="false"
                />
              </div>
            </div>

            {/* Right: Interactive 3D Visual Keyboard with Preview Skin */}
            <div className="w-full lg:w-2/3 flex justify-center overflow-x-auto py-2">
              <TypingKeyboard
                expectedKey={expectedTestChar}
                pressedKey={testPressedKey}
                lastErrorKey={testErrorKey}
                layout={locale === "en" ? "en" : "pt-BR"}
                size="sm"
                skinVisual={selectedSkin.visual}
                className="scale-90 sm:scale-100 shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* FILTER & SEARCH CONTROLS */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === "pt-BR" ? "Buscar por nome ou tema..." : "Search by name or theme..."
                }
                className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Filter (All, Unlocked, Locked) */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono">
              {(["all", "unlocked", "locked"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl transition-all capitalize font-bold ${
                    statusFilter === st
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {st === "all"
                    ? locale === "pt-BR"
                      ? "Todos"
                      : "All"
                    : st === "unlocked"
                    ? locale === "pt-BR"
                      ? "Desbloqueados"
                      : "Unlocked"
                    : locale === "pt-BR"
                    ? "Bloqueados"
                    : "Locked"}
                </button>
              ))}
            </div>
          </div>

          {/* Rarity Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedRarity("all")}
              className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap font-bold ${
                selectedRarity === "all"
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white/50 border-white/10 hover:text-white"
              }`}
            >
              {locale === "pt-BR" ? "Todas Raridades" : "All Rarities"}
            </button>
            {ALL_RARITIES.map((r) => {
              const details = RARITY_DETAILS[r]
              const isSelected = selectedRarity === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRarity(r)}
                  className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap font-bold ${
                    isSelected
                      ? `${details.bgBadge} ${details.borderColor} border-2`
                      : "bg-white/5 text-white/50 border-white/10 hover:text-white"
                  }`}
                >
                  {details.name[locale === "pt-BR" ? "pt-BR" : "en"]}
                </button>
              )
            })}
          </div>

          {/* Collection Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedCollection("all")}
              className={`px-3 py-1 rounded-xl border transition-all whitespace-nowrap ${
                selectedCollection === "all"
                  ? "bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold"
                  : "bg-white/5 text-white/40 border-white/10 hover:text-white"
              }`}
            >
              {locale === "pt-BR" ? "Todas Coleções" : "All Collections"}
            </button>
            {ALL_COLLECTIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCollection(c.id)}
                className={`px-3 py-1 rounded-xl border transition-all whitespace-nowrap ${
                  selectedCollection === c.id
                    ? "bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold"
                    : "bg-white/5 text-white/40 border-white/10 hover:text-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* SKINS CATALOG GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredSkins.map((skin) => {
            const isUnlocked = unlockedSkinIds.includes(skin.id)
            const isEquipped = equippedSkinId === skin.id
            const isSelected = selectedSkinId === skin.id
            const rarity = RARITY_DETAILS[skin.rarity]

            return (
              <motion.div
                key={skin.id}
                onClick={() => setSelectedSkinId(skin.id)}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? "border-orange-500 ring-2 ring-orange-500/40 bg-white/10 shadow-[0_0_30px_rgba(249,115,22,0.2)]"
                    : isUnlocked
                    ? "border-white/10 hover:border-white/25 bg-white/5"
                    : "border-white/5 bg-neutral-950/60 opacity-70 hover:opacity-90"
                }`}
              >
                {/* Rarity Ambient Glow */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 blur-3xl pointer-events-none opacity-20"
                  style={{ backgroundColor: skin.visual.accentColor }}
                />

                <div className="space-y-3">
                  {/* Card Header: Rarity Badge & Collection */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${rarity.bgBadge}`}
                    >
                      {rarity.name[locale === "pt-BR" ? "pt-BR" : "en"]}
                    </span>
                    <span className="text-[10px] font-mono text-white/40 uppercase">
                      {skin.collection}
                    </span>
                  </div>

                  {/* 3D Mini Keycap Preview Swatch */}
                  <div
                    className={`h-16 rounded-2xl p-2 border border-white/10 flex items-center justify-center gap-1.5 shadow-inner ${skin.visual.frameBg}`}
                  >
                    <div
                      className={`w-7 h-8 rounded-lg border text-[10px] font-mono font-black flex items-center justify-center shadow-md ${skin.visual.keyBg} ${skin.visual.keyText} ${skin.visual.keyBorder}`}
                    >
                      K
                    </div>
                    <div
                      className={`w-7 h-8 rounded-lg border text-[10px] font-mono font-black flex items-center justify-center shadow-md ${skin.visual.keyExpectedBg}`}
                    >
                      F
                    </div>
                    <div
                      className={`w-7 h-8 rounded-lg border text-[10px] font-mono font-black flex items-center justify-center shadow-md ${skin.visual.keyBg} ${skin.visual.keyText} ${skin.visual.keyBorder}`}
                    >
                      G
                    </div>
                  </div>

                  {/* Skin Name & Theme */}
                  <div>
                    <h3 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
                      <span>{skin.name}</span>
                      {isEquipped && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
                      )}
                    </h3>
                    <p className="text-[11px] text-white/40 font-mono mt-0.5 truncate">
                      {skin.theme}
                    </p>
                  </div>
                </div>

                {/* Card Footer Status */}
                <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  {isEquipped ? (
                    <span className="text-emerald-400 font-mono font-bold text-[11px] flex items-center gap-1">
                      <Check size={13} />
                      {locale === "pt-BR" ? "Equipado" : "Equipped"}
                    </span>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        equipSkin(skin.id)
                      }}
                      className="px-3 py-1 rounded-xl bg-white/10 hover:bg-orange-500 hover:text-black font-mono text-[11px] font-bold text-white transition-all cursor-pointer"
                    >
                      {locale === "pt-BR" ? "Equipar" : "Equip"}
                    </button>
                  ) : (
                    <span className="text-white/40 font-mono text-[11px] flex items-center gap-1">
                      <Lock size={12} className="text-red-400" />
                      {locale === "pt-BR" ? "Bloqueado" : "Locked"}
                    </span>
                  )}

                  <span className="text-[10px] font-mono text-white/30">
                    {skin.shardsValue} 💎
                  </span>
                </div>
              </motion.div>
            )
          })}
        </section>
      </div>

      {/* KEYBOARD ACCESSIBILITY SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-neutral-900 border border-white/15 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 font-black text-base text-white">
                  <Sliders size={18} className="text-orange-400" />
                  <span>{locale === "pt-BR" ? "Configurações do Teclado" : "Keyboard Settings"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Show / Hide Keyboard */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-white block">
                    {locale === "pt-BR" ? "Exibir Teclado Visual" : "Show Visual Keyboard"}
                  </span>
                  <span className="text-xs text-white/40">
                    {locale === "pt-BR"
                      ? "Mostrar o teclado 3D durante batalhas e treinos"
                      : "Display the 3D keyboard during battle and training"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => updateSettings({ showKeyboard: !settings.showKeyboard })}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    settings.showKeyboard ? "bg-orange-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.showKeyboard ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Effects Intensity */}
              <div className="space-y-2">
                <span className="font-bold text-sm text-white block">
                  {locale === "pt-BR" ? "Intensidade de Efeitos" : "Visual Effects Intensity"}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(["full", "reduced", "off"] as EffectIntensity[]).map((intensity) => (
                    <button
                      key={intensity}
                      type="button"
                      onClick={() => updateSettings({ effectIntensity: intensity })}
                      className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold capitalize transition-all ${
                        settings.effectIntensity === intensity
                          ? "bg-orange-500 text-black border-orange-500"
                          : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                      }`}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Home row anchors */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-white block">
                    {locale === "pt-BR" ? "Guias Táteis (F / J)" : "Tactile Bump Guides (F / J)"}
                  </span>
                  <span className="text-xs text-white/40">
                    {locale === "pt-BR"
                      ? "Exibir pequenos relevos indicadores nos dedos indicadores"
                      : "Display tactile nib bumps on home row index keys"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateSettings({ showHomeRowAnchors: !settings.showHomeRowAnchors })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    settings.showHomeRowAnchors ? "bg-orange-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.showHomeRowAnchors ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-bold transition-all"
                >
                  {locale === "pt-BR" ? "Fechar" : "Done"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
