"use client"

import { useState, type FormEvent, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Flame,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Gamepad2,
  ChevronLeft,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/i18nContext"
import { useAuth } from "@/lib/auth/authContext"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, locale } = useI18n()
  const { login } = useAuth()

  const rawReturnUrl = searchParams.get("returnUrl") || searchParams.get("next") || "/game"
  const returnUrl =
    rawReturnUrl.startsWith("/") && !rawReturnUrl.startsWith("//") ? rawReturnUrl : "/game"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusNotice, setStatusNotice] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setStatusNotice(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMsg(t("auth.emailInvalid"))
      return
    }

    if (password.length < 8) {
      setErrorMsg(t("auth.passwordTooShort"))
      return
    }

    setIsSubmitting(true)

    try {
      await login({ email: trimmedEmail, password })
      setStatusNotice(t("auth.loginSuccess"))
      setTimeout(() => {
        router.push(returnUrl)
      }, 800)
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
        setErrorMsg(t("auth.invalidCredentials"))
      } else {
        setErrorMsg(t("auth.loginError"))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-6"
    >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono">
              <ShieldCheck size={13} />
              <span>{locale === "pt-BR" ? "Acesso Shinobi" : "Shinobi Access"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t("auth.loginTitle")}
            </h1>
            <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto">
              {t("auth.loginSub")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            {/* Status Notice */}
            {statusNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center">
                {statusNotice}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/70 block">
                {t("auth.emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shinobi@keyforge.dev"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white/70">
                  {t("auth.passwordLabel")}
                </label>
                <span className="text-[11px] text-orange-400/80 hover:text-orange-300 transition-colors cursor-pointer">
                  {t("auth.forgotPassword")}
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? "..." : t("auth.loginBtn")}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-white/10" />
            <span className="absolute bg-neutral-950 px-3 text-[11px] uppercase font-mono text-white/40">
              {locale === "pt-BR" ? "ou" : "or"}
            </span>
          </div>

          {/* Play as Guest Option */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
            <p className="text-xs text-white/50 text-center">
              {t("auth.guestNotice")}
            </p>
            <Link
              href={returnUrl}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Gamepad2 size={16} className="text-orange-400" />
              <span>{t("auth.playAsGuest")}</span>
            </Link>
          </div>

          {/* Link to Register */}
          <p className="text-center text-xs text-white/50">
            {t("auth.noAccount")}{" "}
            <Link
              href={returnUrl !== "/game" ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/register"}
              className="text-orange-400 hover:text-orange-300 font-bold transition-colors underline underline-offset-4"
            >
              {t("auth.registerBtn")}
            </Link>
          </p>
    </motion.div>
  )
}

export default function LoginPage() {
  const { locale } = useI18n()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden selection:bg-orange-500/30 selection:text-orange-200">
      {/* Anime glowing ambient lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-orange-500/15 via-purple-600/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-600/10 blur-[130px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 group transition-transform active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] transition-all">
            <Flame className="w-5 h-5 text-black" />
          </div>
          <span className="font-black text-xl tracking-wider text-white">
            KEY<span className="text-orange-500">FORGE</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 font-bold"
          >
            <ChevronLeft size={14} />
            <span>{locale === "pt-BR" ? "Início" : "Home"}</span>
          </Link>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="relative z-10 w-full max-w-md mx-auto px-6 py-8">
        <Suspense
          fallback={
            <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] text-center text-white/50 animate-pulse text-sm">
              Loading...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-white/30 font-mono">
        KeyForge v2.3 · {locale === "pt-BR" ? "Todos os direitos reservados" : "All rights reserved"}
      </footer>
    </div>
  )
}
