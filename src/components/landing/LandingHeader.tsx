"use client"

import { useState } from "react"
import Link from "next/link"
import { Swords, Menu, X, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { useI18n } from "@/lib/i18n/i18nContext"

export function LandingHeader() {
  const { t } = useI18n()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: t("nav.howItWorks"), href: "#how-it-works" },
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.training"), href: "#training" },
    { label: t("nav.academy"), href: "#academy" },
    { label: t("nav.animeWorlds"), href: "#anime-worlds" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#101115]/95 backdrop-blur-md border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-orange-400 flex items-center justify-center text-black font-black shadow-sm group-hover:scale-105 transition-transform">
            <Swords size={20} />
          </div>
          <span className="text-xl font-black tracking-wider text-orange-300">
            KEYFORGE
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav aria-label={t("release.navigation")} className="hidden xl:flex items-center gap-4 text-sm font-semibold text-white/70">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-orange-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Action buttons */}
        <div className="hidden xl:flex shrink-0 items-center gap-2">
          <LanguageSwitcher />

          <Link
            href="/login"
            className="px-4 py-2 text-xs font-bold text-white/70 hover:text-white transition-colors"
          >
            {t("common.login").toUpperCase()}
          </Link>

          <Link
            href="/register"
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
          >
            {t("common.createAccount").toUpperCase()}
          </Link>

          <Link
            href="/game"
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-400 hover:bg-orange-300 text-black font-black text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <span>{t("common.playNow").toUpperCase()}</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile menu toggle button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="xl:hidden min-h-11 min-w-11 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
          aria-label={t("nav.toggleMenu")}
          aria-expanded={mobileMenuOpen}
          aria-controls="landing-mobile-nav"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="landing-mobile-nav"
            className="xl:hidden max-h-[80dvh] overflow-y-auto border-b border-white/10 bg-neutral-950/95 px-6 py-6 space-y-4 backdrop-blur-xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <nav className="flex flex-col space-y-3 text-sm font-bold uppercase tracking-wider text-white/70">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1 hover:text-orange-400 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
              <Link
                href="/game"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-400 text-black font-black text-sm uppercase tracking-wider shadow-sm"
              >
                <span>{t("common.playNow").toUpperCase()}</span>
                <ArrowRight size={16} />
              </Link>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-mono text-white/40">{t("common.language")}</span>
                <LanguageSwitcher />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                >
                  {t("common.login").toUpperCase()}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                >
                  {t("common.register").toUpperCase()}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
