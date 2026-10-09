import { getStageByEnemyId } from "@/data/worlds"

/** Prefer the narrative, then the existing localized stage explanation. */
export function localizedCharacterDescription(enemyId: string, translate: (key: string) => string): string {
  const narrativeKey = `battle.characterDescriptions.${enemyId.replace("-", "_")}`
  const narrative = translate(narrativeKey)
  if (narrative !== narrativeKey) return narrative
  const stage = getStageByEnemyId(enemyId)?.stage
  if (!stage) return ""
  const explanation = translate(stage.mechanicSummaryKey)
  return explanation === stage.mechanicSummaryKey ? "" : explanation
}
