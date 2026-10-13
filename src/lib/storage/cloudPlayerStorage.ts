import { backend } from '@/lib/backend/client'
import { getStoredUser } from '@/lib/auth/authService'
import { PlayerProfile } from '@/types/player'
import { BattleHistoryEntry } from '@/types/battle'
/** Verified progression is read-only to clients. */
export async function fetchCloudPlayerProfile(userId:string):Promise<PlayerProfile|null> {
 try {const profile=await backend<PlayerProfile>('player');return profile.id===userId?profile:null} catch {return null}
}
/** Preferences only; never send local XP, ranks, stats or completion to the cloud. */
export async function saveCloudPlayerProfile(userId:string,profile:PlayerProfile):Promise<boolean> {
 if(getStoredUser().id!==userId||profile.id!==userId) return false
 try {await backend('preferences',{username:profile.username},'PATCH');return true} catch {return false}
}
export async function saveCloudBattleHistory(_userId:string,_entry:BattleHistoryEntry,_weakKeys:string[]=[]):Promise<boolean>{
 void [_userId,_entry,_weakKeys];return false
}
