import { MultiplayerMatchRow } from '@/types/database'
import { loadPlayerProfile, savePlayerProfile } from '@/lib/storage/playerStorage'
import { addCratesDirectly, addShardsDirectly } from '@/lib/storage/cosmeticsStorage'
import { calculateMultiplayerRewards, MultiplayerRewardSummary } from './calculateMultiplayerRewards'
export type { MultiplayerRewardSummary } from './calculateMultiplayerRewards'
const processed=new Map<string,MultiplayerRewardSummary>()
/** Demo/local matches never write competitive progression. */
export function processMultiplayerRewards(match:MultiplayerMatchRow,userId:string,wpm:number,accuracy:number,combo:number) {
 if(!match.id.startsWith('match_')) return null
 const key=match.id+':'+userId
 const storageKey='keyforge_mp_reward_'+match.id+'_'+userId
 if(processed.has(key)) return processed.get(key)!
 if(typeof window!=='undefined'&&localStorage.getItem(storageKey)) return null
 const summary=calculateMultiplayerRewards(match,userId,wpm,accuracy,combo,loadPlayerProfile())
 if(!summary) return null
 processed.set(key,summary)
 if(typeof window!=='undefined') localStorage.setItem(storageKey,'1')
 savePlayerProfile(summary.updatedProfile)
 if(summary.awardedCrate) addCratesDirectly(summary.awardedCrate.crateId,1)
 if(summary.shardsAwarded) addShardsDirectly(summary.shardsAwarded)
 return summary
}
