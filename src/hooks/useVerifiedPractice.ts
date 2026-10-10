"use client"
import { useEffect,useRef,useCallback } from 'react'
import { useAuth } from '@/lib/auth/authContext'
import { requestProgression,cacheVerifiedReward } from '@/lib/security/progressionClient'
import { ActivityRewardSummary } from '@/lib/progression/calculateActivityRewards'
import type { PracticeChallenge,PracticeRound } from '@/lib/security/practiceValidation'
import type { BattleInputEvent } from '@/lib/security/battleValidation'

/** Auditing and rewards run in the background; normal drill transitions never await a request. */
export function useVerifiedPractice(options:PracticeChallenge) {
 const {isGuest,user}=useAuth()
 const serialized=JSON.stringify(options)
 const state=useRef<{promise:Promise<{id:string}|null>|null;startedAt:number;rounds:PracticeRound[];events:BattleInputEvent[]}>({promise:null,startedAt:0,rounds:[],events:[]})
 const prepare=useCallback(()=>{
  const next={startedAt:Date.now(),rounds:[] as PracticeRound[],events:[] as BattleInputEvent[],promise:isGuest?null:requestProgression<{id:string}>({action:'beginPractice',...JSON.parse(serialized)}).catch(()=>null)}
  state.current=next
  return next
 },[serialized,isGuest])
 useEffect(()=>{if(!isGuest) prepare();else state.current.promise=null},[isGuest,user?.id,prepare])
 const onInputEvent=useCallback((key:string,timestamp:number)=>{
  if(isGuest) return
  const current=state.current.promise?state.current:prepare()
  if(current.events.length<20001) current.events.push({key,at:Math.max(0,timestamp-current.startedAt)})
 },[isGuest,prepare])
 const round=useCallback((text:string)=>{
  if(isGuest) return
  state.current.rounds.push({text,events:state.current.events})
  state.current.events=[]
 },[isGuest])
 const finish=useCallback((targetKey?:string):Promise<ActivityRewardSummary>=>{
  const completed=state.current
  if(!isGuest) prepare()
  return (async()=>{
   const session=await completed.promise
   if(!session) throw new Error('Verified practice unavailable')
   const {summary}=await requestProgression<{summary:ActivityRewardSummary}>({action:'practice',sessionId:session.id,rounds:completed.rounds,...(targetKey?{targetKey}:{})})
   await cacheVerifiedReward(summary.updatedProfile)
   return summary
  })()
 },[isGuest,prepare])
 return {isGuest,onInputEvent,round,finish,restart:prepare}
}
