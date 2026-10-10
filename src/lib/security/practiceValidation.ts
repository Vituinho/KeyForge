import { KeyboardLayoutId } from "@/lib/keyboard/fingerMap"
import { learnableKeys } from "@/lib/academy/keyMastery"
import { generateKeyExercises } from "@/lib/academy/keyExercises"
import { getHomeRowExercises } from "@/data/academyLessons"
import { generateWeakKeysSession } from "@/lib/typing/generateTraining"
import { getCharacterById } from "@/data/characters"
import { BattleInputEvent,replayBattle } from "./battleValidation"

export interface PracticeChallenge {kind:'academy'|'home-row'|'training';layout:KeyboardLayoutId;language:'pt-BR'|'en';targetKeys?:string[]}
export interface PracticeRound {text:string;events:BattleInputEvent[]}
const canonical=new Map<KeyboardLayoutId,Set<string>>()
export function allowedAcademyText(text:string,layout:KeyboardLayoutId):boolean {
 let texts=canonical.get(layout)
 if(!texts){texts=new Set(learnableKeys(layout).flatMap(key=>generateKeyExercises(key,layout).map(e=>e.text)));canonical.set(layout,texts)}
 if(texts.has(text)) return true
 const tokens=text.split(' '),first=tokens[0],keys=Array.from(first),allowed=learnableKeys(layout)
 if(keys.some(k=>!allowed.includes(k))) return false
 // Existing adaptive transition, finger-group and mixed-review patterns.
 if(keys.length===2 && text===Array(12).fill(first).join(' ')) return true
 if(keys.length===4&&keys[0]===keys[2]&&keys[1]===keys[3]&&text===Array(6).fill(first).join(' ')) return true
 if(keys.length>=2&&keys.length<=6&&new Set(keys).size===keys.length&&text===Array(6).fill(first).join(' ')) return true
 if(tokens.length%4===0) {
  const group=tokens.slice(0,tokens.length/4)
  if(group.length>=2&&group.length<=6&&group.every(t=>Array.from(t).length===2&&Array.from(t).every(k=>allowed.includes(k)))&&group.every((t,i)=>t[1]===group[(i+1)%group.length][0])&&text===Array(4).fill(group.join(' ')).join(' ')) return true
 }
 return false
}
export function replayPractice(challenge:PracticeChallenge,rounds:PracticeRound[],elapsed:number,targetKey?:string) {
 if(!Array.isArray(rounds)||rounds.length>30||rounds.some(r=>!r||typeof r.text!=='string'||r.text.length>2000||!Array.isArray(r.events))) throw new Error('Invalid practice rounds')
 let lessonId:string|undefined
 if(challenge.kind==='academy') {
  if(rounds.length!==6||rounds.some(r=>!allowedAcademyText(r.text,challenge.layout))||!targetKey||!learnableKeys(challenge.layout).includes(targetKey)||Array.from(rounds[5].text).filter(k=>k===targetKey).length<4) throw new Error('Invalid Academy lesson')
  lessonId=`key-mastery-${challenge.layout}-${targetKey}`
 } else {
  const expected=challenge.kind==='home-row'?getHomeRowExercises(challenge.language):generateWeakKeysSession(challenge.targetKeys??[])
  if(rounds.length!==expected.length||rounds.some((r,i)=>r.text!==expected[i])) throw new Error('Unissued practice text')
  if(challenge.kind==='home-row') lessonId='home-row'
 }
 const synthetic={...getCharacterById('naruto')!,maxHp:Number.MAX_SAFE_INTEGER,attack:0,attackInterval:1800001,mechanics:[]}
 const result=replayBattle({enemy:synthetic,texts:rounds.map(r=>r.text),language:challenge.language},rounds.flatMap(r=>r.events),elapsed,true)
 // Every supplied round must end at its own issued boundary, rather than borrowing keys from another.
 for(const round of rounds) {
  let cursor=0
  for(const event of round.events) {
   if(cursor>=Array.from(round.text).length) throw new Error('Extra practice input')
   cursor=event.key==='Backspace'?Math.max(0,cursor-1):cursor+1
  }
  if(cursor!==Array.from(round.text).length) throw new Error('Incomplete practice round')
 }
 return {stats:result.finalStats,lessonId}
}
