"use client"

import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks"
import { LandingFeatures } from "@/components/landing/LandingFeatures"
import { LandingTrainingSection } from "@/components/landing/LandingTrainingSection"
import { LandingAcademySection } from "@/components/landing/LandingAcademySection"
import { LandingAnimeWorldSection } from "@/components/landing/LandingAnimeWorldSection"
import { LandingFinalCta } from "@/components/landing/LandingFinalCta"
import { LandingFooter } from "@/components/landing/LandingFooter"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white relative selection:bg-orange-500 selection:text-black overflow-x-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <LandingHeader />
      <LandingHero />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingTrainingSection />
      <LandingAcademySection />
      <LandingAnimeWorldSection />
      <LandingFinalCta />
      <LandingFooter />
    </main>
  )
}
