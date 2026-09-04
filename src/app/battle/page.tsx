"use client"

import { useState } from "react"
import { PreBattle } from "@/components/battle/PreBattle"
import { BattleArena } from "@/components/battle/BattleArena"
import { getCharacterById } from "@/data/characters"
import { getTextsForCharacter } from "@/data/texts"

export default function BattlePage() {
  const enemy = getCharacterById("naruto")!
  const texts = getTextsForCharacter("naruto")
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
