import { backend,BackendError } from '@/lib/backend/client'
import { getStoredUser } from '@/lib/auth/authService'
import { CosmeticUnlockResult,KeyboardAccessibilitySettings,PlayerCosmeticsState } from '@/types/cosmetics'
import { getSkinById } from '@/data/keyboardSkins'
import { preserveLegacyLocal } from './progressionTrust'
export async function fetchCloudCosmetics(userId:string):Promise<PlayerCosmeticsState|null> {
 if(getStoredUser().id!==userId) return null
 try {const {ownerId,...inventory}=await backend<PlayerCosmeticsState&{ownerId:string}>('inventory');return ownerId===userId?inventory:null} catch {return null}
}
export async function saveEquippedSkinCloud(_userId:string,skinId:string):Promise<boolean> {
 void _userId;try {await backend('inventory',{action:'equip',skinId});return true} catch {return false}
}
export async function saveAccessibilitySettingsCloud(userId:string,settings:KeyboardAccessibilitySettings):Promise<boolean> {
 void userId;try {await backend('preferences',{keyboardSettings:settings},'PATCH');return true} catch {return false}
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
 const user=getStoredUser();if(user.isGuest) return null
 const key='keyforge_crate_intent:'+user.id
 let intent:{crateId:string;requestId:string}
 try {
  const saved=localStorage.getItem(key)
  intent=saved?JSON.parse(saved):{crateId,requestId:crypto.randomUUID()}
  if(intent.crateId!==crateId) return null
  localStorage.setItem(key,JSON.stringify(intent))
 } catch {return null}
 let data:{skin_id:string;is_duplicate:boolean;shards_awarded:number}
 try {data=await backend('inventory',{action:'open',crateId,requestId:intent.requestId})}
 catch(error) {if(error instanceof BackendError&&error.status<500) localStorage.removeItem(key);return null}
 localStorage.removeItem(key)
 return {skin:getSkinById(data.skin_id),isDuplicate:data.is_duplicate,shardsAwarded:data.shards_awarded}
}
export async function purchaseCrateCloud(crateId:string):Promise<boolean> {
 const user=getStoredUser();if(user.isGuest) return false
 const key='keyforge_purchase_intent:'+user.id
 let intent:{crateId:string;requestId:string}
 try {
  const saved=localStorage.getItem(key)
  intent=saved?JSON.parse(saved):{crateId,requestId:crypto.randomUUID()}
  if(intent.crateId!==crateId) return false
  localStorage.setItem(key,JSON.stringify(intent))
 } catch {return false}
 try {await backend('inventory',{action:'purchase',crateId,requestId:intent.requestId})}
 catch(error) {if(error instanceof BackendError&&error.status<500) localStorage.removeItem(key);return false}
 localStorage.removeItem(key)
 return true
}
