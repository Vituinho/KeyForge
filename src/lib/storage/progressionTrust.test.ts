import test from "node:test"
import assert from "node:assert/strict"
import { scopedStorageKey,preserveLegacyLocal } from "./progressionTrust"
import { loadPlayerProfile,savePlayerProfile,STORAGE_KEY } from "./playerStorage"
import { createDefaultPlayerProfile } from "@/types/player"

test('tampered guest progress stays personal; account caches and legacy snapshots are isolated',()=>{
 const values=new Map<string,string>()
 const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value)}
 const originalWindow=globalThis.window,originalStorage=globalThis.localStorage
 Object.assign(globalThis,{window:{dispatchEvent:()=>true},localStorage:storage})
 try {
  const tampered={...createDefaultPlayerProfile(),id:'guest_old',xp:999999,level:99,rank:'SSS' as const}
  values.set(STORAGE_KEY,JSON.stringify({version:3,player:tampered}))
  assert.equal(scopedStorageKey(STORAGE_KEY),STORAGE_KEY)
  values.set('keyforge_auth_user',JSON.stringify({id:'alice',username:'Alice',isGuest:false}))
  assert.equal(loadPlayerProfile().xp,0)
  assert.equal(loadPlayerProfile().level,1)
  const aliceKey=scopedStorageKey(STORAGE_KEY)
  preserveLegacyLocal(STORAGE_KEY,JSON.stringify(tampered))
  savePlayerProfile({...createDefaultPlayerProfile(),id:'alice',xp:50})
  assert.equal(JSON.parse(values.get(aliceKey+':legacy-unverified')!).xp,999999)
  preserveLegacyLocal(STORAGE_KEY,'replacement')
  assert.equal(JSON.parse(values.get(aliceKey+':legacy-unverified')!).xp,999999)
  values.set('keyforge_auth_user',JSON.stringify({id:'bob',username:'Bob',isGuest:false}))
  assert.equal(loadPlayerProfile().xp,0)
  assert.equal(values.get(aliceKey+':legacy-unverified')?.includes('999999'),true)
  values.delete('keyforge_auth_user')
  assert.equal(loadPlayerProfile().xp,999999)
  assert.equal(JSON.parse(values.get(STORAGE_KEY)!).player.level,99)
 } finally {Object.assign(globalThis,{window:originalWindow,localStorage:originalStorage})}
})
