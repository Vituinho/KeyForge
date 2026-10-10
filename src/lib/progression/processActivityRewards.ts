import { TypingStats } from '@/types/typing'
import { loadPlayerProfile,savePlayerProfile } from '@/lib/storage/playerStorage'
import { calculateTrainingRewards,calculateAcademyLessonRewards } from './calculateActivityRewards'
export type { ActivityRewardSummary } from './calculateActivityRewards'
/** Personal/offline practice only; verified rewards are committed by the server. */
export function processTrainingRewards(stats:TypingStats,_targetKeys?:string[]) {
 void _targetKeys
 const summary=calculateTrainingRewards(stats,loadPlayerProfile());savePlayerProfile(summary.updatedProfile);return summary
}
export function processAcademyLessonRewards(lessonId:string,stats:TypingStats) {
 const summary=calculateAcademyLessonRewards(lessonId,stats,loadPlayerProfile());savePlayerProfile(summary.updatedProfile);return summary
}
