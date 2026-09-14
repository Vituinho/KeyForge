"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useI18n } from "@/lib/i18n/i18nContext"
import { Swords, Target, Globe, ChevronRight, X, Sparkles } from "lucide-react"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { t } = useI18n()
  const [step, setStep] = useState(0)

  const steps = [
    {
      icon: <Swords size={36} className="text-orange-400" />,
      tag: "CORE COMBAT",
      title: t("onboarding.step1Title"),
      desc: t("onboarding.step1Desc"),
      color: "#f97316",
    },
    {
      icon: <Target size={36} className="text-emerald-400" />,
      tag: "KEY PRINCIPLE",
      title: t("onboarding.step2Title"),
      desc: t("onboarding.step2Desc"),
      color: "#10b981",
    },
    {
      icon: <Globe size={36} className="text-violet-400" />,
      tag: "CAMPAIGN",
      title: t("onboarding.step3Title"),
      desc: t("onboarding.step3Desc"),
      color: "#8b5cf6",
    },
  ]

  const handleNext = useCallback(() => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
    } else {
      onClose()
    }
  }, [step, steps.length, onClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault()
        handleNext()
      } else if (e.code === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, handleNext, onClose])

  if (!isOpen) return null

  const current = steps[step]

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.35, ease: "backOut" }}
          className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-neutral-950/95 p-6 sm:p-8 shadow-2xl text-center space-y-6 overflow-hidden"
          style={{
            boxShadow: `0 0 50px ${current.color}44`,
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border shadow-lg"
            style={{
              backgroundColor: `${current.color}15`,
              borderColor: `${current.color}40`,
            }}
          >
            {current.icon}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <span
              className="text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border inline-block"
              style={{
                color: current.color,
                borderColor: `${current.color}40`,
                backgroundColor: `${current.color}10`,
              }}
            >
              {current.tag}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {current.title}
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-w-md mx-auto">
              {current.desc}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === step
                    ? "w-8 bg-white"
                    : "w-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider text-black flex items-center justify-center gap-2 shadow-xl hover:scale-102 active:scale-98 transition-transform"
              style={{
                background: `linear-gradient(135deg, ${current.color}, #ffffff)`,
              }}
            >
              {step === steps.length - 1 ? (
                <>
                  <Sparkles size={16} />
                  <span>{t("onboarding.startJourney")}</span>
                </>
              ) : (
                <>
                  <span>{t("common.continueMap")}</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
            <span className="text-[10px] font-mono text-white/30 block mt-2">
              [Enter / Space]
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
