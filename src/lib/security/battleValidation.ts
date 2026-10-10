import { PlayerProfile } from "@/types/player"
import { Enemy } from "@/types/character"
import { TypingStats } from "@/types/typing"
import { BattleResult, RoundResult } from "@/types/battle"
import { MultiPhaseConfig } from "@/types/mechanics"
import { AnimeWorldId } from "@/types/world"
import { getStageByEnemyId, getWorldById, ANIME_WORLD_ORDER } from "@/data/worlds"
import { isTypingCharacterCorrect } from "@/lib/typing/typingAttempt"
import { calculateDamage } from "@/lib/battle/calculateDamage"
import { evaluateEnemyMechanics } from "@/lib/battle/mechanicsEngine"
import { calculateAccuracy } from "@/lib/typing/calculateAccuracy"
import { calculateWpm } from "@/lib/typing/calculateWpm"
import { analyzeWeakKeys } from "@/lib/typing/analyzeErrors"

export interface BattleInputEvent {key:string; at:number}
export interface BattleChallenge {enemy:Enemy; texts:string[]; language:"pt-BR"|"en"}
export function assertCampaignAccess(profile:PlayerProfile,enemy:Enemy):void {
 const lookup=getStageByEnemyId(enemy.id)
 if(!lookup || !enemy.world) throw new Error("Unknown campaign stage")
 const world=profile.campaignProgress[enemy.world]
 if(!world?.unlocked || !enemy.stage || enemy.stage>world.currentStage) throw new Error("Campaign stage locked")
 const required=lookup.world.stages.filter(s=>s.stageNumber<enemy.stage!).map(s=>s.stageNumber)
 if(required.some(n=>!world.completedStages.includes(n))) throw new Error("Required campaign stages missing")
 const worldIndex=ANIME_WORLD_ORDER.indexOf(enemy.world as AnimeWorldId)
 if(worldIndex>0) {
  const previous=ANIME_WORLD_ORDER[worldIndex-1]
  const stages=getWorldById(previous)?.stages.map(s=>s.stageNumber)??[]
  if(!stages.length || stages.some(n=>!profile.campaignProgress[previous]?.completedStages.includes(n))) throw new Error("Previous world incomplete")
 }
}

function emptyStats():TypingStats {
 return {currentWpm:0,currentRawWpm:0,currentAccuracy:100,currentErrors:0,currentStreak:0,battleWpm:0,battleAccuracy:100,bestWpm:0,
 totalTypingAttempts:0,totalErrors:0,combo:0,bestCombo:0,bestStreak:0,typedCharacters:0,correctCharacters:0,incorrectCharacters:0,
 totalCorrectCharacters:0,totalIncorrectCharacters:0,elapsedTime:0,totalElapsedTime:0,keyStats:{},errorLog:[],isCompleted:false,currentIndex:0,
 wpm:0,rawWpm:0,accuracy:100,errors:0}
}

/** Replay attempts against the issued text. Outcomes and damage never come from client fields. */
export function replayBattle(challenge:BattleChallenge,events:BattleInputEvent[],serverElapsedMs:number,practiceRounds=false):BattleResult {
 if(!Array.isArray(events)||events.length>20000||!Number.isFinite(serverElapsedMs)||serverElapsedMs<0||serverElapsedMs>1800000) throw new Error("Invalid transcript")
 const {enemy,texts}=challenge
 if(!texts.length || texts.some(t=>!t.length)) throw new Error("Invalid challenge")
 const phases=enemy.mechanics?.find(m=>m.type==="multi-phase"||m.type==="multi-phase-boss") as MultiPhaseConfig|undefined
 const totalPhases=phases?.totalPhases??1
 const hpForPhase=(p:number)=>phases?Math.round(enemy.maxHp*(phases.phaseHpRatios[p-1]??1/totalPhases)):enemy.maxHp
 let phase=1, enemyHp=hpForPhase(1), playerHp=100, ticks=0, round=0, cursor=0, roundStart:number|null=null, accumulatedMs=0
 let lastAt=0, terminal=false, victory=false, damageDealt=0
 let roundCorrect=0,roundErrors=0
 const typed:string[]=[]
 const stats=emptyStats(),history:RoundResult[]=[]
 const advanceClock=(at:number)=>{
  const attacks=Math.floor(at/enemy.attackInterval)
  playerHp=Math.max(0,playerHp-(attacks-ticks)*enemy.attack);ticks=attacks
  if(playerHp===0){terminal=true;victory=false}
 }
 const snapshot=(at:number,completed:boolean)=>{
  const duration=roundStart===null?0:Math.max(0,at-roundStart)
  const total=accumulatedMs+duration
  stats.currentWpm=calculateWpm(roundCorrect,duration/1000)
  stats.currentRawWpm=calculateWpm(roundCorrect+roundErrors,duration/1000)
  stats.currentAccuracy=calculateAccuracy(roundCorrect,roundCorrect+roundErrors)
  stats.currentErrors=roundErrors;stats.correctCharacters=roundCorrect;stats.incorrectCharacters=roundErrors
  stats.typedCharacters=roundCorrect+roundErrors;stats.elapsedTime=duration/1000;stats.totalElapsedTime=total/1000
  stats.battleWpm=calculateWpm(stats.totalCorrectCharacters,total/1000)
  stats.battleAccuracy=calculateAccuracy(stats.totalCorrectCharacters,stats.totalTypingAttempts)
  stats.wpm=stats.currentWpm;stats.rawWpm=stats.currentRawWpm;stats.accuracy=stats.currentAccuracy;stats.errors=roundErrors
  stats.currentIndex=cursor;stats.isCompleted=completed
  return duration
 }
 for(const event of events) {
  // Practice starts immediately while its nonce request is in flight. Bound the transport
  // allowance; it never changes scoring, campaign clocks or the server's pace ceilings.
  if(!event || Object.keys(event).some(k=>k!=="key"&&k!=="at") || typeof event.key!=="string" || !Number.isFinite(event.at) || event.at<lastAt || event.at<0 || event.at>serverElapsedMs+(practiceRounds?2000:250) || (event.key!=="Backspace"&&event.key.length!==1)) throw new Error("Invalid input event")
  if(terminal) throw new Error("Input after battle ended")
  advanceClock(event.at)
  if(terminal) throw new Error("Input after player defeated")
  const responseTime=roundStart===null?0:Math.min(2000,event.at-lastAt);lastAt=event.at
  const expected=Array.from(texts[round%texts.length])
  if(event.key==="Backspace") {
   if(cursor>0) {
    cursor--
    if(isTypingCharacterCorrect(expected[cursor],typed[cursor])) {roundCorrect--;stats.totalCorrectCharacters--}
    typed.pop()
   }
   continue
  }
  roundStart??=event.at
  const correct=isTypingCharacterCorrect(expected[cursor],event.key)
  const key=expected[cursor].toLowerCase()
  const prior=stats.keyStats[key]??{attempts:0,correct:0,errors:0,totalResponseTime:0}
  stats.keyStats[key]={attempts:prior.attempts+1,correct:prior.correct+Number(correct),errors:prior.errors+Number(!correct),totalResponseTime:prior.totalResponseTime+responseTime}
  stats.totalTypingAttempts++
  if(correct) {
   roundCorrect++;stats.totalCorrectCharacters++;stats.combo++;stats.currentStreak++
   stats.bestCombo=Math.max(stats.bestCombo,stats.combo);stats.bestStreak=Math.max(stats.bestStreak,stats.currentStreak)
  } else {
   roundErrors++;stats.totalErrors++;stats.totalIncorrectCharacters++
   stats.errorLog.push({expected:expected[cursor],typed:event.key,position:cursor,timestamp:event.at,responseTime,comboBeforeError:stats.combo,textId:String(round)})
   stats.combo=0;stats.currentStreak=0
  }
  typed.push(event.key);cursor++
  // Check raw attempts too: deliberately wrong transcripts cannot bypass the pace ceiling.
  if(stats.totalTypingAttempts>Math.max(8,event.at/1000*26)) throw new Error("Implausible typing rate")
  if(cursor===expected.length) {
   const duration=snapshot(event.at,true)
   if(duration<=0 || stats.currentRawWpm>260 || stats.currentWpm>260) throw new Error("Implausible round speed")
   stats.bestWpm=Math.max(stats.bestWpm,stats.currentWpm)
   const base=calculateDamage({wpm:stats.currentWpm,accuracy:stats.currentAccuracy,combo:stats.bestCombo,errors:roundErrors,baseDamage:30})
   const mechanics=evaluateEnemyMechanics({roundStats:{...stats},enemy,roundHistory:history,baseCalculatedDamage:base.damage,currentPhase:phase})
   enemyHp=Math.max(0,enemyHp-mechanics.modifiedDamage)
   playerHp=Math.max(0,playerHp-mechanics.extraPlayerDamageTaken)
   damageDealt+=mechanics.modifiedDamage
   history.push({wpm:stats.currentWpm,accuracy:stats.currentAccuracy,combo:stats.bestCombo,errors:roundErrors,damage:mechanics.modifiedDamage,strikeType:base.strikeType,text:texts[round%texts.length],activeEffects:mechanics.activeEffects})
   if(playerHp===0){terminal=true;victory=false}
   else if(enemyHp===0) {
    if(phase<totalPhases){phase++;enemyHp=hpForPhase(phase)} else {terminal=true;victory=true}
   }
   if(practiceRounds&&round+1===texts.length) {terminal=true;victory=true}
   if(!terminal) {accumulatedMs+=duration;round++;roundStart=null;roundCorrect=roundErrors=cursor=0;typed.length=0;stats.currentStreak=0}
  }
 }
 if(victory) {
  if(serverElapsedMs-lastAt>5000) throw new Error("Stale victory transcript")
 } else {
  advanceClock(serverElapsedMs)
  snapshot(serverElapsedMs,false)
  if(!terminal) throw new Error("Battle not complete")
 }
 return {victory,totalDamageDealt:damageDealt,totalDamageTaken:100-playerHp,finalStats:stats,weakKeys:analyzeWeakKeys(stats.keyStats),exercises:[],roundHistory:history,elapsedTime:(victory?lastAt:serverElapsedMs)/1000}
}
