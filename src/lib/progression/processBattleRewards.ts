import { Enemy } from '@/types/character'
import { BattleResult } from '@/types/battle'
import { loadPlayerProfile, savePlayerProfile } from '@/lib/storage/playerStorage'
import { addBattleHistoryEntry } from '@/lib/storage/battleHistoryStorage'
import { addCratesDirectly } from '@/lib/storage/cosmeticsStorage'
import { calculateBattleRewards } from './calculateBattleRewards'
export { hasClearedEveryStage } from './calculateBattleRewards'
export type { BattleRewardSummary, AwardedCrateReward } from './calculateBattleRewards'
/** Personal/offline rewards only. Online rewards require a server-issued challenge. */
export function processBattleRewards(result: BattleResult, enemy: Enemy) {
 const summary=calculateBattleRewards(result,enemy,loadPlayerProfile())
 savePlayerProfile(summary.updatedProfile)
 addBattleHistoryEntry({enemyId:enemy.id,enemyName:enemy.name,enemyAnime:enemy.anime,enemyLevel:enemy.level,themeColor:enemy.themeColor,
  victory:result.victory,battleWpm:result.finalStats.battleWpm,battleAccuracy:result.finalStats.battleAccuracy,bestCombo:result.finalStats.bestCombo,
  totalErrors:result.finalStats.totalErrors,damageDealt:result.totalDamageDealt,damageTaken:result.totalDamageTaken,xpEarned:summary.xpResult.totalXp,durationSeconds:Math.round(result.elapsedTime)})
 for(const reward of summary.awardedCrates??[]) addCratesDirectly(reward.crateId,reward.count)
 return summary
}
