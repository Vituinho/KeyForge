"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { MultiplayerAuthGuard } from "@/components/multiplayer/MultiplayerAuthGuard"
import { MultiplayerArena } from "@/components/multiplayer/MultiplayerArena"
import { MultiplayerMatchRow } from "@/types/database"
import {
  getMatchById,
  getMatchByCode,
  createMatch,
} from "@/lib/multiplayer/matchService"
import { useAuth } from "@/lib/auth/authContext"
import { useCosmetics } from "@/hooks/useCosmetics"
import { useI18n } from "@/lib/i18n/i18nContext"

function ArenaPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { equippedSkin } = useCosmetics()
  const { locale } = useI18n()

  const matchIdParam = searchParams.get("matchId")
  const roomParam = searchParams.get("room")

  const [match, setMatch] = useState<MultiplayerMatchRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function initializeArena() {
      try {
        setLoading(true)
        let foundMatch: MultiplayerMatchRow | null = null

        if (matchIdParam) {
          foundMatch = await getMatchById(matchIdParam)
        } else if (roomParam) {
          foundMatch = await getMatchByCode(roomParam)
        }

        // If no match was found, instantiate a match for this session/room
        if (!foundMatch) {
          foundMatch = await createMatch({
            mode: roomParam ? "private" : "quick",
            roomCode: roomParam || undefined,
            language: locale === "en" ? "en" : "pt-BR",
            skinId: equippedSkin.id,
            guestPlayerId: user?.id || "guest_player_1",
          })
          // Set to playing state
          foundMatch = {
            ...foundMatch,
            status: "playing",
            started_at: new Date().toISOString(),
          }
        } else if (foundMatch.status === "countdown" || foundMatch.status === "ready" || foundMatch.status === "waiting") {
          // Transition to playing for the arena view
          foundMatch = {
            ...foundMatch,
            status: "playing",
            started_at: foundMatch.started_at || new Date().toISOString(),
          }
        }

        if (isMounted) {
          setMatch(foundMatch)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load match")
          setLoading(false)
        }
      }
    }

    initializeArena()

    return () => {
      isMounted = false
    }
  }, [matchIdParam, roomParam, locale, equippedSkin.id, user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-white/50">
          INITIALIZING MULTIPLAYER ARENA...
        </p>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4 p-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-black">ARENA INITIALIZATION ERROR</h2>
        <p className="text-xs text-white/50 max-w-sm">{error || "Match could not be found."}</p>
        <Link
          href="/multiplayer"
          className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold font-mono text-white transition-colors"
        >
          Return to Hub
        </Link>
      </div>
    )
  }

  return (
    <MultiplayerArena
      match={match}
      onExit={() => router.push("/multiplayer")}
      onRematch={() => router.push(`/multiplayer/arena?room=${match.room_code || "REMATCH"}&t=${Date.now()}`)}
    />
  )
}

export default function MultiplayerArenaPage() {
  return (
    <MultiplayerAuthGuard>
      <Suspense
        fallback={
          <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-xs font-mono uppercase tracking-widest text-white/50">
              PREPARING BATTLEGROUND...
            </p>
          </div>
        }
      >
        <ArenaPageContent />
      </Suspense>
    </MultiplayerAuthGuard>
  )
}
