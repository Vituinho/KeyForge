"use client"

import { motion } from "framer-motion"
import {
  Swords,
  Globe,
  Skull,
  Dumbbell,
  BookOpen,
  Shield,
  BarChart2,
  Lightbulb,
} from "lucide-react"

export function LandingFeatures() {
  const features = [
    {
      icon: <Swords size={22} />,
      title: "Typing Battles",
      description:
        "Sentence-by-sentence combat engine where your WPM and accuracy calculate direct damage, strike velocity, and critical hits.",
      color: "#f97316",
    },
    {
      icon: <Globe size={22} />,
      title: "Anime Worlds",
      description:
        "Episodic campaigns inspired by iconic anime sagas, featuring progressive difficulty and unique typing trials.",
      color: "#8b5cf6",
    },
    {
      icon: <Skull size={22} />,
      title: "Multi-Phase Bosses",
      description:
        "Legendary battles like Pain and Madara Uchiha featuring multi-phase shifts, endurance trials, and cinematic visual cues.",
      color: "#ef4444",
    },
    {
      icon: <Dumbbell size={22} />,
      title: "Weak Key Training",
      description:
        "Real-time keystroke telemetry tracks error rates per key and generates customized drill routines to fix struggling fingers.",
      color: "#f59e0b",
    },
    {
      icon: <BookOpen size={22} />,
      title: "Touch Typing Academy",
      description:
        "Structured curriculum teaching proper finger discipline across the home, upper, and lower keyboard rows.",
      color: "#10b981",
    },
    {
      icon: <Shield size={22} />,
      title: "Ranks E → SSS",
      description:
        "Skill-based tier system evaluating speed, accuracy, technique, and combo consistency instead of mere grind.",
      color: "#06b6d4",
    },
    {
      icon: <BarChart2 size={22} />,
      title: "Deep Statistics",
      description:
        "Detailed match logs, historical WPM trends, accuracy charts, and key latency telemetry to track your mastery.",
      color: "#ec4899",
    },
    {
      icon: <Lightbulb size={22} />,
      title: "Personalized Tactical Advice",
      description:
        "Contextual coaching upon defeat analyzing opponent mechanics (speed gates, precision checks, cadence) to guide improvement.",
      color: "#3b82f6",
    },
  ]

  return (
    <section id="features" className="py-24 px-4 relative">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400">
            Engineered For Mastery
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            BUILT FOR SPEED & RPG EVOLUTION
          </h2>
          <p className="text-sm text-white/50">
            Every system in KeyForge is connected to real typing performance and progressive character development.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              className="p-6 rounded-2xl border border-white/10 bg-neutral-950/60 hover:bg-neutral-900/60 hover:border-white/20 transition-all space-y-3 relative group overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${feat.color}18`,
                  borderColor: `${feat.color}40`,
                  color: feat.color,
                }}
              >
                {feat.icon}
              </div>

              <h3 className="text-base font-black text-white tracking-wide">
                {feat.title}
              </h3>

              <p className="text-xs text-white/60 leading-relaxed">
                {feat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
