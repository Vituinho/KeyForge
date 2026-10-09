import { ANIME_WORLD_ORDER } from "@/data/worlds"
import { createDefaultNarutoWorldProgress, type PlayerProfile } from "@/types/player"
import type { CampaignProgressRow } from "@/types/database"

export function campaignFromCloud(base: PlayerProfile["campaignProgress"], rows: CampaignProgressRow[]): PlayerProfile["campaignProgress"] {
  const progress = { ...base }
  for (const world of ANIME_WORLD_ORDER) {
    const row = rows.find(entry => entry.world_id === world)
    if (!row) continue
    const stages = Array.isArray(row.completed_stages) ? [...new Set(row.completed_stages.filter(stage => Number.isInteger(stage) && stage >= 1 && stage <= 8))].sort((a, b) => a - b) : []
    const previous = ANIME_WORLD_ORDER[ANIME_WORLD_ORDER.indexOf(world) - 1]
    progress[world] = { ...(base[world] ?? createDefaultNarutoWorldProgress()),
      unlocked: world === "naruto" || !!progress[previous]?.completed || stages.length > 0,
      currentStage: Number.isInteger(row.current_stage) ? Math.max(1, Math.min(8, row.current_stage)) : 1,
      completedStages: stages, completed: row.completed === true,
    }
  }
  return progress
}
export function campaignToCloud(userId: string, progress: PlayerProfile["campaignProgress"], updatedAt: string) {
  return ANIME_WORLD_ORDER.filter(id => progress[id]).map(id => ({ user_id: userId, world_id: id,
    current_stage: progress[id].currentStage, completed_stages: progress[id].completedStages,
    completed: progress[id].completed, updated_at: updatedAt }))
}
