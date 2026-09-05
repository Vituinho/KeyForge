"use client"

import { motion } from "framer-motion"
import { Keyboard, Swords, Trophy } from "lucide-react"

export function LandingHowItWorks() {
  const steps = [
    {
      num: "01",
      icon: <Keyboard size={28} className="text-orange-400" />,
      title: "TYPE",
      subtitle: "Improve Speed & Accuracy",
      description:
        "Input sentences in real time. The engine evaluates every keystroke, raw WPM, accuracy threshold, and error recovery cadence.",
      color: "#f97316",
    },
    {
      num: "02",
      icon: <Swords size={28} className="text-amber-400" />,
      title: "FIGHT",
      subtitle: "Typing Becomes Damage",
      description:
        "Your typing velocity translates directly into attack strikes, critical hits, and defensive counters against anime opponents and multi-phase bosses.",
      color: "#f59e0b",
    },
    {
      num: "03",
      icon: <Trophy size={28} className="text-emerald-400" />,
      title: "EVOLVE",
      subtitle: "Level Up & Conquer",
      description:
        "Earn XP, climb from Rank E to SSS, unlock prestigious shinobi titles, and conquer progressive campaign worlds across the multiverse.",
      color: "#10b981",
    },
  ]

  return (
    <section id="how-it-works" className="py-20 px-4 relative border-t border-white/5 bg-black/40">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Title */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400">
            Core Loop
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            HOW IT WORKS
          </h2>
          <p className="text-sm text-white/50">
            From basic finger discipline to legendary shinobi battles in three connected steps.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step, idx) => (
            <motion.div
              key={step.title}
              className="p-8 rounded-3xl border border-white/10 bg-neutral-950/60 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
            >
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner"
                  style={{
                    backgroundColor: `${step.color}15`,
                    borderColor: `${step.color}35`,
                  }}
                >
                  {step.icon}
                </div>
                <span className="text-4xl font-black font-mono text-white/10 group-hover:text-white/20 transition-colors">
                  {step.num}
                </span>
              </div>

              {/* Text */}
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white tracking-wide">
                  {step.title}
                </h3>
                <h4 className="text-xs font-mono font-bold text-orange-400/90 uppercase tracking-wider">
                  {step.subtitle}
                </h4>
              </div>

              <p className="text-sm text-white/60 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
