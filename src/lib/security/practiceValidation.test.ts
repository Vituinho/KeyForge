import test from "node:test"
import assert from "node:assert/strict"
import { allowedAcademyText, replayPractice, PracticeRound } from "./practiceValidation"
import { getHomeRowExercises } from "@/data/academyLessons"
import { generateKeyExercises } from "@/lib/academy/keyExercises"
import { learnableKeys, emptyMasteryProgress } from "@/lib/academy/keyMastery"
import { generateLearningSession, LearningTarget } from "@/lib/academy/adaptiveLearning"
import { generateWeakKeysSession } from "@/lib/typing/generateTraining"
import { calculateAcademyLessonRewards } from "@/lib/progression/calculateActivityRewards"
import { createDefaultPlayerProfile } from "@/types/player"

function evidence(texts:string[]) {
 let at=0
 const rounds:PracticeRound[]=texts.map(text=>({text,events:Array.from(text).map(key=>({key,at:at+=200}))}))
 return {rounds,elapsed:at+500}
}
test('every current ABNT2/ANSI Academy drill is accepted without changing its generation',()=>{
 for(const layout of ['ABNT2','ANSI'] as const) for(const key of learnableKeys(layout)) {
  const drills=generateKeyExercises(key,layout)
  for(const drill of drills) assert.ok(allowedAcademyText(drill.text,layout))
  const {rounds,elapsed}=evidence(drills.map(d=>d.text))
  const replay=replayPractice({kind:'academy',layout,language:layout==='ANSI'?'en':'pt-BR'},rounds,elapsed,key)
  assert.equal(replay.lessonId,`key-mastery-${layout}-${key}`)
  assert.equal(replay.stats.battleAccuracy,100)
 }
})
test('existing adaptive transition, finger and mixed-review patterns remain valid',()=>{
 const targets:LearningTarget[]=[
  {id:'transition:r:t',kind:'transition',keys:['r','t'],reason:'slowTransition',priority:1,evidence:{attempts:20}},
  {id:'finger:leftIndex',kind:'finger',finger:'leftIndex',keys:['r','t','f','g','v','b'],reason:'fingerWeakness',priority:1,evidence:{attempts:20}},
  {id:'mixed',kind:'mixed',keys:['a','s','e'],reason:'balancedReview',priority:1,evidence:{attempts:20}},
 ]
 const session=generateLearningSession(targets,emptyMasteryProgress(),'ABNT2')
 assert.equal(session.drills.length,6)
 const {rounds,elapsed}=evidence(session.drills.map(d=>d.text))
 assert.equal(replayPractice({kind:'academy',layout:'ABNT2',language:'pt-BR'},rounds,elapsed,'a').stats.battleAccuracy,100)
})
test('home-row and weak-key rewards require all server-issued exercise boundaries',()=>{
 for(const language of ['en','pt-BR'] as const) {
  const {rounds,elapsed}=evidence(getHomeRowExercises(language))
  assert.equal(replayPractice({kind:'home-row',layout:language==='en'?'ANSI':'ABNT2',language},rounds,elapsed).lessonId,'home-row')
  assert.throws(()=>replayPractice({kind:'home-row',layout:'ABNT2',language},rounds.slice(1),elapsed))
 }
 const targetKeys=['r','ç','?'],{rounds,elapsed}=evidence(generateWeakKeysSession(targetKeys))
 assert.equal(replayPractice({kind:'training',layout:'ABNT2',language:'pt-BR',targetKeys},rounds,elapsed).stats.totalErrors,0)
 assert.throws(()=>replayPractice({kind:'training',layout:'ABNT2',language:'pt-BR',targetKeys:['a']},rounds,elapsed))
})
test('practice rejects arbitrary lesson IDs, unfinished positions, forged data and impossible pacing',()=>{
 const challenge={kind:'academy' as const,layout:'ANSI' as const,language:'en' as const}
 const {rounds,elapsed}=evidence(generateKeyExercises('r','ANSI').map(d=>d.text))
 assert.throws(()=>replayPractice(challenge,rounds.slice(0,5),elapsed,'r'))
 assert.throws(()=>replayPractice(challenge,rounds,elapsed,'fabricated-lesson'))
 assert.throws(()=>replayPractice(challenge,[...rounds.slice(0,5),{text:'rrrr',events:[]}],elapsed,'r'))
 assert.throws(()=>replayPractice(challenge,rounds.map(r=>({...r,events:r.events.map(e=>({...e,at:0}))})),elapsed,'r'))
 const missing=structuredClone(rounds);missing[0].events.pop()
 assert.throws(()=>replayPractice(challenge,missing,elapsed,'r'))
 const forged=structuredClone(rounds);Object.assign(forged[0].events[0],{xp:99999})
 assert.throws(()=>replayPractice(challenge,forged,elapsed,'r'))
 // A bounded nonce/network allowance keeps normal instant input usable, not arbitrary timers.
 assert.doesNotThrow(()=>replayPractice(challenge,rounds,elapsed-1250,'r'))
 assert.throws(()=>replayPractice(challenge,rounds,elapsed-3000,'r'))
})
test('verified practice retains historical errors, following correct keys and shipped Academy reward balance',()=>{
 const {rounds,elapsed}=evidence(generateKeyExercises('r','ANSI').map(d=>d.text))
 const first=rounds[0].events[0]
 rounds[0].events.splice(0,1,{key:'x',at:first.at-100},{key:'Backspace',at:first.at-50},first)
 const replay=replayPractice({kind:'academy',layout:'ANSI',language:'en'},rounds,elapsed,'r')
 assert.equal(replay.stats.totalErrors,1)
 assert.equal(replay.stats.keyStats.r.errors,1)
 assert.equal(replay.stats.errorLog[0].typed,'x')
 assert.equal(replay.stats.totalCorrectCharacters,rounds.reduce((n,r)=>n+r.text.length,0))
 const initial=createDefaultPlayerProfile()
 const firstReward=calculateAcademyLessonRewards(replay.lessonId!,replay.stats,initial)
 const repeat=calculateAcademyLessonRewards(replay.lessonId!,replay.stats,firstReward.updatedProfile)
 assert.ok(firstReward.xpGained>repeat.xpGained)
 assert.equal(firstReward.updatedProfile.stats.academyLessonsCompleted,1)
 assert.equal(repeat.updatedProfile.stats.academyLessonsCompleted,1)
 assert.equal(initial.stats.academyLessonsCompleted,0)
})
