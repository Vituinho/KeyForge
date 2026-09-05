"use client"

import { motion } from "framer-motion"
import { Swords, Globe, Dumbbell, BookOpen, BarChart2 } from "lucide-react"
import { PlayerQuickWidget } from "@/components/dashboard/PlayerQuickWidget"
import { DashboardNavCard, DashboardNavItem } from "@/components/dashboard/DashboardNavCard"

const NAV_ITEMS: DashboardNavItem[] = [
  {
    href: "/battle",
    icon: <Swords size={22} />,
    label: "Battle",
    description: "Fight anime characters",
    active: true,
    color: "#f97316",
  },
  {
    href: "/anime-world",
    icon: <Globe size={22} />,
    label: "Anime World",
    description: "Campaign mode & bosses",
    active: true,
    color: "#8b5cf6",
  },
  {
    href: "/training",
    icon: <Dumbbell size={22} />,
    label: "Training",
    description: "Practice your weaknesses",
    active: true,
    color: "#f97316",
  },
  {
    href: "/academy",
    icon: <BookOpen size={22} />,
    label: "Academy",
    description: "Learn touch typing",
    active: true,
    color: "#10b981",
  },
  {
    href: "/statistics",
    icon: <BarChart2 size={22} />,
    label: "Statistics",
    description: "Track your progress",
    active: true,
    color: "#ec4899",
  },
]

export default function GameDashboardPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-orange-500 blur-[120px]" />
      </div>

      {/* Player Profile Quick Widget */}
      <PlayerQuickWidget />

      {/* Logo / Header */}
      <motion.div
        className="relative z-10 text-center mb-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1
          className="text-7xl sm:text-8xl font-black tracking-tighter bg-gradient-to-r from-orange-400 via-orange-300 to-yellow-300 bg-clip-text text-transparent"
          animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
          transition={{ duration: 6, repeat: Infinity }}
        >
          KEYFORGE
        </motion.h1>
        <motion.p
          className="mt-3 text-lg font-bold tracking-[0.3em] text-white/30 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Type · Fight · Evolve
        </motion.p>
        <motion.p
          className="mt-2 text-sm text-white/20 max-w-sm mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Master your keyboard. Defeat the strongest anime characters.
        </motion.p>
      </motion.div>

      {/* Navigation */}
      <motion.div
        className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {NAV_ITEMS.map((item, i) => (
          <DashboardNavCard key={item.label} item={item} index={i} />
        ))}
      </motion.div>

      {/* Version tag */}
      <motion.p
        className="relative z-10 mt-12 text-white/20 text-xs font-mono"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        KeyForge v2.1 — Naruto World
      </motion.p>
    </main>
  )
}
