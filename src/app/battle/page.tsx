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
import { useAuth } from "@/lib/auth/authContext"
import { beginVerifiedBattle,VerifiedBattleSession } from "@/lib/security/progressionClient"

function BattleContent() {
  const { locale,t } = useI18n()
  const {isGuest}=useAuth()
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
  const [session,setSession]=useState<VerifiedBattleSession|null>(null)
  const [preparing,setPreparing]=useState(false)
  const [failed,setFailed]=useState(false)
  const fight=async()=>{
    if(preparing) return
    setPreparing(true);setFailed(false)
    try {
      if(!isGuest) setSession(await beginVerifiedBattle(enemyId,locale))
      else setSession(null)
      setBattleKey(k=>k+1);setStarted(true)
    } catch {setFailed(true);setStarted(false)}
    finally {setPreparing(false)}
  }

  if(preparing) return <p role="status" className="p-8 text-center text-white/60">{t('security.preparing')}</p>

  if (!started) {
    return (<>
      {failed&&<p role="alert" className="text-center text-red-300 p-3">{t('security.unavailable')}</p>}
      <PreBattle
        enemy={enemy}
        onFight={()=>{void fight()}}
      />
      </>
    )
  }

  return (
    <BattleArena
      key={battleKey}
      enemy={session?.enemy??enemy}
      texts={session?.texts??texts}
      verifiedSessionId={session?.id}
      onRematch={()=>{void fight()}}
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

