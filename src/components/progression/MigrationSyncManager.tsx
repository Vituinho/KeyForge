"use client"
import { useEffect,useState } from 'react'
import { useAuth } from '@/lib/auth/authContext'
import { loadPlayerProfile,savePlayerProfile,STORAGE_KEY } from '@/lib/storage/playerStorage'
import { fetchCloudPlayerProfile } from '@/lib/storage/cloudPlayerStorage'
import { preserveLegacyLocal,scopedStorageKey } from '@/lib/storage/progressionTrust'
import { useI18n } from '@/lib/i18n/i18nContext'
/** Personal saves are retained separately; only the server can populate verified progression. */
export function MigrationSyncManager() {
 const {user,isAuthenticated}=useAuth()
 const {t}=useI18n()
 const [notice,setNotice]=useState(false)
 useEffect(()=>{
  if(!isAuthenticated||!user||user.isGuest) return
  let cancelled=false
  let timer:ReturnType<typeof setTimeout>|undefined
  void fetchCloudPlayerProfile(user.id).then(cloud=>{
   if(cancelled||!cloud) return
   const personal=loadPlayerProfile()
   preserveLegacyLocal(STORAGE_KEY,localStorage.getItem(scopedStorageKey(STORAGE_KEY)))
   savePlayerProfile({...cloud,onboardingCompleted:personal.onboardingCompleted,worldIntroSeen:personal.worldIntroSeen})
   setNotice(true)
   timer=setTimeout(()=>setNotice(false),8000)
  }).catch(()=>{})
  return()=>{cancelled=true;if(timer) clearTimeout(timer)}
 },[user,isAuthenticated])
 return notice?<div role='status' className='fixed bottom-6 right-6 z-50 max-w-sm p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-xs shadow-2xl'>{t('security.legacyNotice')}</div>:null
}
