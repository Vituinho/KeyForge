"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PreBattle } from "@/components/battle/PreBattle"
import { BattleArena } from "@/components/battle/BattleArena"
import { getCharacterById, CHARACTERS } from "@/data/characters"
import { getTextsForCharacter } from "@/data/texts"
import { useI18n } from "@/lib/i18n/i18nContext"

function BattleContent() {
  const { locale } = useI18n()
  const searchParams = useSearchParams()
  const enemyId = searchParams.get("enemy") ?? "naruto"

  // Safe fallback if enemyId is invalid or not found
  const enemy =
    getCharacterById(enemyId) ??
    getCharacterById("naruto") ??
    CHARACTERS[0]

  const texts = getTextsForCharacter(enemy.id, locale)
  const [started, setStarted] = useState(false)
  // Increment to force BattleArena remount on rematch
  const [battleKey, setBattleKey] = useState(0)

  if (!started) {
    return (
      <PreBattle
        enemy={enemy}
        onFight={() => {
          setBattleKey((k) => k + 1)
          setStarted(true)
        }}
      />
    )
  }

  return (
    <BattleArena
      key={battleKey}
      enemy={enemy}
      texts={texts}
      onRematch={() => setBattleKey((k) => k + 1)}
    />
  )
}

export default function BattlePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white/40 font-mono text-sm">
          Summoning battlefield...
        </div>
      }
    >
      <BattleContent />
    </Suspense>
  )
}

