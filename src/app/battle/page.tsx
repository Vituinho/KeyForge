"use client"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { PreBattle } from "@/components/battle/PreBattle"
import { BattleArena } from "@/components/battle/BattleArena"
import { getCharacterById, CHARACTERS } from "@/data/characters"
import { getTextsForCharacter } from "@/data/texts"
import { useI18n } from "@/lib/i18n/i18nContext"
import { usePlayer } from "@/hooks/usePlayer"
import { scaleEnemyForBattle } from "@/lib/battle/difficultyScaler"
import { prioritizeSentencesByWeakKeys, getTopWeakKeys } from "@/lib/worlds/hunterAdaptiveEngine"

function BattleContent() {
  const { locale } = useI18n()
  const { player } = usePlayer()
  const searchParams = useSearchParams()
  const enemyId = searchParams.get("enemy") ?? "naruto"

  // Safe fallback if enemyId is invalid or not found
  const baseEnemy =
    getCharacterById(enemyId) ??
    getCharacterById("naruto") ??
    CHARACTERS[0]

  // Dynamic scaling (balanced, including Nexus Mirror reflection)
  const enemy = useMemo(() => scaleEnemyForBattle(baseEnemy, player), [baseEnemy, player])

  // Hunter World adaptive weak-key engine prioritization
  const texts = useMemo(() => {
    const raw = getTextsForCharacter(enemy.id, locale)
    if (enemy.world === "hunter" && player?.keyErrors) {
      const weakKeys = getTopWeakKeys(player.keyErrors, 5)
      if (weakKeys.length > 0) {
        return prioritizeSentencesByWeakKeys(raw, weakKeys)
      }
    }
    return raw
  }, [enemy.id, enemy.world, locale, player])

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

function BattleFallback() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white/40 font-mono text-sm">
      {t("common.summoningBattlefield")}
    </div>
  )
}

export default function BattlePage() {
  return (
    <Suspense fallback={<BattleFallback />}>
      <BattleContent />
    </Suspense>
  )
}

