import { getSupabaseClient } from '@/lib/supabase/client'
import { CosmeticUnlockResult,KeyboardAccessibilitySettings,PlayerCosmeticsState } from '@/types/cosmetics'
import { getSkinById } from '@/data/keyboardSkins'
import { preserveLegacyLocal } from './progressionTrust'
export async function fetchCloudCosmetics(userId:string):Promise<PlayerCosmeticsState|null> {
 const client=getSupabaseClient()
 if(!client) return null
 const {data:{session}}=await client.auth.getSession()
 if(session?.user.id!==userId) return null
 const {data,error}=await client.rpc('get_verified_cosmetics')
 return !error&&data ? data as PlayerCosmeticsState : null
}
export async function saveEquippedSkinCloud(_userId:string,skinId:string):Promise<boolean> {
 const client=getSupabaseClient()
 if(!client) return false
 const {error}=await client.rpc('equip_verified_skin',{p_skin_id:skinId})
 return !error
}
export async function saveAccessibilitySettingsCloud(userId:string,settings:KeyboardAccessibilitySettings):Promise<boolean> {
 const client=getSupabaseClient()
 if(!client) return false
 const {error}=await client.from('profiles').update({keyboard_settings:settings}).eq('id',userId)
 return !error
}
// Offline compatibility helpers never mint verified inventory.
export async function unlockCosmeticCloud(_userId:string,_cosmeticId:string):Promise<boolean>{
 void [_userId,_cosmeticId];return false
}
export async function updateCrateCloud(_userId:string,_crateId:string,_quantity:number):Promise<boolean>{
 void [_userId,_crateId,_quantity];return false
}
export async function updateShardsCloud(_userId:string,_newShards:number):Promise<boolean>{
 void [_userId,_newShards];return false
}
export async function syncLocalToCloud(userId:string,local:PlayerCosmeticsState):Promise<PlayerCosmeticsState> {
 preserveLegacyLocal('keyforge_cosmetics_v1',JSON.stringify(local))
 const cloud=await fetchCloudCosmetics(userId)
 if(!cloud) throw new Error('Verified inventory unavailable')
 return cloud
}
export async function openCrateCloud(crateId:string):Promise<CosmeticUnlockResult|null> {
 const client=getSupabaseClient()
 if(!client) return null
 const {data:{session}}=await client.auth.getSession()
 if(!session) return null
 const key='keyforge_crate_intent:'+session.user.id
 let intent:{crateId:string;requestId:string}
 try {
  const saved=localStorage.getItem(key)
  intent=saved?JSON.parse(saved):{crateId,requestId:crypto.randomUUID()}
  if(intent.crateId!==crateId) return null
  localStorage.setItem(key,JSON.stringify(intent))
 } catch {return null}
 const {data,error}=await client.rpc('open_verified_crate',{p_crate_id:crateId,p_request_id:intent.requestId})
 if(error||!data?.success) {
  // Definite SQL exceptions roll back; ambiguous transport failures retain their transaction ID.
  if(error?.code&&/^[0-9A-Z]{5}$/.test(error.code)) localStorage.removeItem(key)
  return null
 }
 localStorage.removeItem(key)
 return {skin:getSkinById(data.skin_id),isDuplicate:data.is_duplicate,shardsAwarded:data.shards_awarded}
}
export async function purchaseCrateCloud(crateId:string):Promise<boolean> {
 const client=getSupabaseClient()
 if(!client) return false
 const {data:{session}}=await client.auth.getSession()
 if(!session) return false
 const key='keyforge_purchase_intent:'+session.user.id
 let intent:{crateId:string;requestId:string}
 try {
  const saved=localStorage.getItem(key)
  intent=saved?JSON.parse(saved):{crateId,requestId:crypto.randomUUID()}
  if(intent.crateId!==crateId) return false
  localStorage.setItem(key,JSON.stringify(intent))
 } catch {return false}
 const {data,error}=await client.rpc('purchase_verified_crate',{p_crate_id:crateId,p_request_id:intent.requestId})
 if(error||!data?.success) {
  if(error?.code&&/^[0-9A-Z]{5}$/.test(error.code)) localStorage.removeItem(key)
  return false
 }
 localStorage.removeItem(key)
 return true
}
