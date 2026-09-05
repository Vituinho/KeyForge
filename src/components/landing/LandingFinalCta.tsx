"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Swords, ArrowRight, Sparkles } from "lucide-react"

export function LandingFinalCta() {
  return (
    <section className="py-28 px-4 relative overflow-hidden text-center">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-red-500/20 blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold uppercase tracking-widest"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Sparkles size={14} />
          <span>The Ultimate Shinobi Typing Challenge</span>
        </motion.div>

        <motion.h2
          className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight uppercase"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          ARE YOU FAST ENOUGH TO DEFEAT THE STRONGEST?
        </motion.h2>

        <motion.p
          className="text-base sm:text-lg text-white/60 max-w-xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Put your finger speed, accuracy, and endurance to the test. Step into the arena and claim
          your shinobi rank.
        </motion.p>

        <motion.div
          className="pt-4 flex items-center justify-center gap-4 flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link
            href="/game"
            className="flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_35px_rgba(249,115,22,0.45)] group"
          >
            <Swords size={20} />
            <span>START NOW</span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1.5 transition-transform"
            />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
