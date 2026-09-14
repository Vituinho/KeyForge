"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useI18n } from "@/lib/i18n/i18nContext"
import { formatPhaseName } from "@/lib/battle/formatMechanics"

interface BossPhaseBannerProps {
  bannerText: string | null
  themeColor?: string
}

export function BossPhaseBanner({
  bannerText,
  themeColor = "#ef4444",
}: BossPhaseBannerProps) {
  const { t } = useI18n()

  if (!bannerText) return null

  const cleanedText = bannerText.replace(/!$/, "")
  const formattedName = formatPhaseName(cleanedText, t)

  return (
    <AnimatePresence>
      <div
        role="alert"
        aria-live="polite"
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4"
      >
        <motion.div
          className="relative px-8 py-5 rounded-3xl bg-black/95 border-2 text-center shadow-[0_0_60px_rgba(239,68,68,0.8)] backdrop-blur-md max-w-md w-full"
          style={{
            borderColor: themeColor,
            boxShadow: `0 0 50px ${themeColor}88`,
          }}
          initial={{ scale: 0.6, opacity: 0, y: -20 }}
          animate={{ scale: 1.05, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.35, ease: "backOut" }}
        >
          {/* Subtle flare streak */}
          <div
            className="absolute inset-x-4 top-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${themeColor}, transparent)`,
            }}
          />

          <span
            className="text-xs font-mono font-bold tracking-widest uppercase block mb-1"
            style={{ color: themeColor }}
          >
            {t("battle.hud.bossShift")}
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider">
            {formattedName.toUpperCase()}!
          </h2>

          <p className="text-[11px] font-mono text-white/50 mt-1">
            {t("battle.bossPhase.warning")}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
