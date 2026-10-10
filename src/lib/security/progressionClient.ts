import { getSupabaseClient } from "@/lib/supabase/client"
import { savePlayerProfile, STORAGE_KEY } from "@/lib/storage/playerStorage"
import { fetchCloudCosmetics } from "@/lib/storage/cloudCosmeticsStorage"
import { fetchCloudPlayerProfile } from "@/lib/storage/cloudPlayerStorage"
import { saveCosmeticsState } from "@/lib/storage/cosmeticsStorage"
import { preserveLegacyLocal,scopedStorageKey } from "@/lib/storage/progressionTrust"
import { PlayerProfile } from "@/types/player"
import type { BattleChallenge, BattleInputEvent } from "./battleValidation"
import { getStoredUser } from "@/lib/auth/authService"
export interface VerifiedBattleSession extends BattleChallenge {id:string}
export async function requestProgression<T>(payload:Record<string,unknown>):Promise<T> {
 const client=getSupabaseClient()
 const session=client?(await client.auth.getSession()).data.session:null
 if(!session) throw new Error("Authentication required")
 const response=await fetch("/api/progression",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(payload)})
 if(!response.ok) throw new Error(`Verification failed (${response.status})`)
 return response.json() as Promise<T>
}
export function beginVerifiedBattle(enemyId:string,language:"pt-BR"|"en") {
 return requestProgression<VerifiedBattleSession>({action:"begin",enemyId,language})
}
export function finishVerifiedBattle<T>(sessionId:string,events:BattleInputEvent[]) {
 return requestProgression<T>({action:"finish",sessionId,events})
}
export async function cacheVerifiedReward(profile:PlayerProfile) {
 if(getStoredUser().id!==profile.id) return
 const current=await fetchCloudPlayerProfile(profile.id)
 if(getStoredUser().id!==profile.id) return
 preserveLegacyLocal(STORAGE_KEY,localStorage.getItem(scopedStorageKey(STORAGE_KEY)))
 savePlayerProfile(current??profile)
 const cosmetics=await fetchCloudCosmetics(profile.id)
 if(cosmetics&&getStoredUser().id===profile.id) saveCosmeticsState(cosmetics)
}
