"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { DamageEvent } from "@/types/battle"
import { useI18n } from "@/lib/i18n/i18nContext"

interface DamageIndicatorProps {
  events: DamageEvent[]
  onClear: (id: string) => void
}

const STRIKE_STYLES: Record<string, { color: string; size: string; shadow: string }> = {
  critical: {
    color: "text-yellow-300",
    size: "text-4xl",
    shadow: "drop-shadow-[0_0_12px_rgba(253,224,71,0.9)]",
  },
  perfect: {
    color: "text-cyan-300",
    size: "text-3xl",
    shadow: "drop-shadow-[0_0_10px_rgba(103,232,249,0.8)]",
  },
  normal: {
    color: "text-white",
    size: "text-2xl",
    shadow: "drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]",
  },
  miss: {
    color: "text-red-400",
    size: "text-xl",
    shadow: "",
  },
}

export function DamageIndicator({ events, onClear }: DamageIndicatorProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {events.map((event) => (
          <FloatingDamage key={event.id} event={event} onClear={onClear} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function FloatingDamage({
  event,
  onClear,
}: {
  event: DamageEvent
  onClear: (id: string) => void
}) {
  const { t } = useI18n()
  const style = STRIKE_STYLES[event.strikeType] ?? STRIKE_STYLES.normal
  // Random horizontal position so numbers don't stack
  const [x] = useState(() => 30 + Math.random() * 40)

  useEffect(() => {
    const timer = setTimeout(() => onClear(event.id), 1800)
    return () => clearTimeout(timer)
  }, [event.id, onClear])

  if (event.targetIsEnemy) {
    return (
      <motion.div
        className={`absolute font-black ${style.color} ${style.size} ${style.shadow} select-none`}
        style={{ left: `${x}%`, top: "30%" }}
        initial={{ opacity: 1, y: 0, scale: 0.6 }}
        animate={{ opacity: 0, y: -80, scale: 1.2 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      >
        {event.strikeType !== "miss" ? `-${event.amount}` : t("battle.damage.miss")}
        {event.strikeType === "critical" && (
          <div className="text-base font-bold text-yellow-400 text-center -mt-1">{t("battle.damage.critical")}</div>
        )}
        {event.strikeType === "perfect" && (
          <div className="text-base font-bold text-cyan-400 text-center -mt-1">{t("battle.damage.perfect")}</div>
        )}
      </motion.div>
    )
  }

  // Enemy attacking player
  return (
    <motion.div
      className="absolute font-black text-red-400 text-2xl drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] select-none"
      style={{ right: "15%", bottom: "40%" }}
      initial={{ opacity: 1, y: 0, scale: 0.6 }}
      animate={{ opacity: 0, y: 30, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      -{event.amount}
    </motion.div>
  )
}
