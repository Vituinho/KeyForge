import { getSupabaseClient } from '@/lib/supabase/client'
import { PlayerProfile } from '@/types/player'
import { BattleHistoryEntry } from '@/types/battle'
/** Verified progression is read-only to clients. */
export async function fetchCloudPlayerProfile(userId:string):Promise<PlayerProfile|null> {
 const client=getSupabaseClient()
 if(!client) return null
 const {data,error}=await client.rpc('get_verified_player')
 return !error&&data?.id===userId ? data as PlayerProfile : null
}
/** Preferences only; never send local XP, ranks, stats or completion to the cloud. */
export async function saveCloudPlayerProfile(userId:string,profile:PlayerProfile):Promise<boolean> {
 const client=getSupabaseClient()
 if(!client) return false
 const {error}=await client.from('profiles').update({username:profile.username}).eq('id',userId)
 return !error
}
export async function saveCloudBattleHistory(_userId:string,_entry:BattleHistoryEntry,_weakKeys:string[]=[]):Promise<boolean>{return false}
