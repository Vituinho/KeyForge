"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ACADEMY_MODULES } from "@/data/academyLessons"
import { AcademyLesson } from "@/components/academy/AcademyLesson"
import { BookOpen, ChevronRight, ChevronLeft, Lock, Sparkles } from "lucide-react"
import Link from "next/link"

export default function AcademyPage() {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  if (activeModuleId) {
    return (
      <AcademyLesson
        moduleId={activeModuleId}
        onBack={() => setActiveModuleId(null)}
        onSelectModule={(id) => setActiveModuleId(id)}
      />
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Top navigation */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 z-10">
        <Link
          href="/game"
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Game
        </Link>
        <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Touch Typing Academy
        </span>
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-10 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
          <BookOpen size={28} />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
          KEYFORGE <span className="text-emerald-400">ACADEMY</span>
        </h1>
        <p className="text-white/40 text-sm mt-2 max-w-md mx-auto">
          Aprenda a arte do Touch Typing do zero. Abandone o vício de olhar para o teclado e digite com todos os dez dedos.
        </p>
      </motion.div>

      {/* Modules List */}
      <div className="w-full max-w-2xl space-y-3 z-10">
        {ACADEMY_MODULES.map((module, index) => {
          const isAvailable = module.status === "available"

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                disabled={!isAvailable}
                onClick={() => isAvailable && setActiveModuleId(module.id)}
                className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-center justify-between gap-4 ${
                  isAvailable
                    ? "bg-white/5 border-white/10 hover:border-emerald-500/40 hover:bg-white/10 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                    : "bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 border ${
                      isAvailable
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-white/5 border-white/10 text-white/30"
                    }`}
                  >
                    {isAvailable ? <Sparkles size={18} /> : <Lock size={16} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">
                        {module.title}
                      </h2>
                      {module.badge && (
                        <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded border border-emerald-500/30 font-bold">
                          {module.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 font-mono mt-0.5">
                      {module.subtitle}
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      {module.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isAvailable ? (
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 group-hover:text-emerald-400">
                      <ChevronRight size={18} />
                    </div>
                  ) : (
                    <span className="text-[10px] uppercase font-mono text-white/30 px-2 py-1 rounded bg-white/5 border border-white/5">
                      Soon
                    </span>
                  )}
                </div>
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
