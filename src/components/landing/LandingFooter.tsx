"use client"

import Link from "next/link"
import { Swords } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"

export function LandingFooter() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-white/10 bg-neutral-950 py-12 px-4 text-xs text-white/40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-black">
            <Swords size={16} />
          </div>
          <span className="font-black text-white text-sm tracking-wider">KEYFORGE</span>
          <span className="text-white/20">|</span>
          <span className="font-mono text-[11px]">{t("landing.footer.tagline")}</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 font-mono">
          <Link href="/game" className="hover:text-white transition-colors">
            {t("nav.gameDashboard")}
          </Link>
          <Link href="/anime-world" className="hover:text-white transition-colors">
            {t("nav.animeWorlds")}
          </Link>
          <Link href="/academy" className="hover:text-white transition-colors">
            {t("nav.academy")}
          </Link>
          <Link href="/training" className="hover:text-white transition-colors">
            {t("nav.training")}
          </Link>
          <Link href="/login" className="hover:text-white transition-colors">
            {t("common.login")}
          </Link>
        </div>

        {/* Copyright */}
        <div className="font-mono text-white/30 text-center sm:text-right">
          © {new Date().getFullYear()} KeyForge. {t("landing.footer.rights")}
        </div>
      </div>
    </footer>
  )
}
