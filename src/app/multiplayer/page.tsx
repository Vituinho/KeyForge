"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Flame, Swords, ArrowLeft, ShieldCheck, Zap } from "lucide-react"
import { MultiplayerAuthGuard } from "@/components/multiplayer/MultiplayerAuthGuard"
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher"
import { useAuth } from "@/lib/auth/authContext"
import { useI18n } from "@/lib/i18n/i18nContext"

function MultiplayerContent() {
  const { user } = useAuth()
  const { locale } = useI18n()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between relative overflow-hidden selection:bg-orange-500/30 selection:text-orange-200">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-orange-500/15 via-red-600/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600/10 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/game"
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
            href="/game"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 font-bold"
          >
            <ArrowLeft size={14} />
            <span>{locale === "pt-BR" ? "Voltar ao Dojo" : "Back to Dojo"}</span>
          </Link>
        </div>
      </header>

      {/* Hub Preview */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30 font-mono">
            <ShieldCheck size={15} />
            <span>{locale === "pt-BR" ? "Acesso Shinobi Autenticado" : "Shinobi Authenticated Access"}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            MULTIPLAYER <span className="text-orange-500">ARENA</span>
          </h1>

          <p className="text-sm text-white/60 max-w-md mx-auto">
            {locale === "pt-BR"
              ? `Bem-vindo, shinobi ${user?.username || "Guerreiro"}. A infraestrutura multiplayer em tempo real está sendo configurada.`
              : `Welcome, shinobi ${user?.username || "Warrior"}. Real-time multiplayer infrastructure is being prepared.`}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto pt-4 text-left">
            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md space-y-2">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                <Swords size={18} />
                <span>{locale === "pt-BR" ? "Batalhas 1v1 em Tempo Real" : "1v1 Real-Time Battles"}</span>
              </div>
              <p className="text-xs text-white/40">
                {locale === "pt-BR"
                  ? "Duelos simultâneos com sementes de palavras determinísticas e ataques sincronizados."
                  : "Simultaneous duels with deterministic word seeds and synchronized attacks."}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Zap size={18} />
                <span>{locale === "pt-BR" ? "Salas Privadas & Presença" : "Private Rooms & Presence"}</span>
              </div>
              <p className="text-xs text-white/40">
                {locale === "pt-BR"
                  ? "Crie salas com código para desafiar amigos ou participe de salas públicas."
                  : "Create room codes to challenge friends or join public lobbies."}
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-white/30 font-mono">
        KeyForge v2.3 · Multiplayer Arena Foundation
      </footer>
    </div>
  )
}

export default function MultiplayerPage() {
  return (
    <MultiplayerAuthGuard>
      <MultiplayerContent />
    </MultiplayerAuthGuard>
  )
}
