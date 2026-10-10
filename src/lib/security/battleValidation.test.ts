import test from "node:test"
import assert from "node:assert/strict"
import { assertCampaignAccess, BattleChallenge, BattleInputEvent, replayBattle } from "./battleValidation"
import { getCharacterById,CHARACTERS } from "@/data/characters"
import { createDefaultPlayerProfile } from "@/types/player"
import { calculateBattleRewards } from "@/lib/progression/calculateBattleRewards"
import { ANIME_WORLD_ORDER,getWorldById } from "@/data/worlds"

const enemy={...getCharacterById("naruto")!,maxHp:1,attack:1,attackInterval:60000,mechanics:[]}
const challenge:BattleChallenge={enemy,texts:["computer"],language:"en"}
const transcript=(keys:string[])=>keys.map((key,i)=>({key,at:100+i*200}))
const replay=(keys:string[])=>replayBattle(challenge,transcript(keys),3000)
test("server replay preserves position-based substitutions, accuracy and combo",()=>{
 const result=replay(Array.from("comouter"))
 assert.equal(result.victory,true)
 assert.equal(result.finalStats.totalErrors,1)
 assert.equal(result.finalStats.totalCorrectCharacters,7)
 assert.equal(result.finalStats.battleAccuracy,88)
 assert.equal(result.finalStats.bestCombo,4)
 assert.equal(result.weakKeys[0].key,"p")
})
test("independent errors do not cascade",()=>{
 const result=replay(Array.from("cxmputxr"))
 assert.equal(result.finalStats.totalErrors,2)
 assert.equal(result.finalStats.totalCorrectCharacters,6)
 assert.equal(result.finalStats.battleAccuracy,75)
 assert.equal(result.finalStats.bestCombo,4)
})
test("Backspace retains historical telemetry",()=>{
 const result=replay([...Array.from("comx"),"Backspace",...Array.from("puter")])
 assert.equal(result.finalStats.totalErrors,1)
 assert.equal(result.finalStats.totalTypingAttempts,9)
 assert.equal(result.finalStats.totalCorrectCharacters,8)
 assert.equal(result.finalStats.battleAccuracy,89)
 assert.equal(result.finalStats.errorLog[0].expected,"p")
 assert.equal(result.finalStats.keyStats.p.errors,1)
})
test("undoing a correct key removes credit without undoing the attempt",()=>{
 const result=replay(["c","Backspace",...Array.from("computer")])
 assert.equal(result.finalStats.totalTypingAttempts,9)
 assert.equal(result.finalStats.totalCorrectCharacters,8)
 assert.equal(result.finalStats.currentAccuracy,100)
 assert.equal(result.finalStats.battleAccuracy,89)
})
test("ABNT2 accented keys and ANSI text use the same comparisons",()=>{
 for(const text of ["ação","hello"]) {
  const result=replayBattle({...challenge,texts:[text]},transcript(Array.from(text)),3000)
  assert.equal(result.victory,true);assert.equal(result.finalStats.totalErrors,0)
 }
})
test("forged outcomes, incomplete battles, invalid keys and timing are rejected",()=>{
 assert.throws(()=>replayBattle(challenge,[],1000),/not complete/)
 assert.throws(()=>replayBattle(challenge,transcript(Array.from("computer")).map(e=>({...e,at:1})),1000),/speed/)
 assert.throws(()=>replayBattle(challenge,[{key:"c",at:4000}],1000),/Invalid input/)
 assert.throws(()=>replayBattle(challenge,[{key:"c",at:100},{key:"o",at:99}],1000),/Invalid input/)
 assert.throws(()=>replayBattle(challenge,[{key:"Enter",at:100}],1000),/Invalid input/)
 assert.throws(()=>replayBattle(challenge,[{key:"c",at:100,xp:9999} as BattleInputEvent],1000),/Invalid input/)
 assert.throws(()=>replayBattle(challenge,[...transcript(Array.from("computer")),{key:"x",at:2000}],3000),/ended/)
 assert.throws(()=>replayBattle(challenge,transcript(Array.from("computer")),30000),/Stale/)
})
test("defeat and damage are derived from the issued enemy and server time",()=>{
 const result=replayBattle({...challenge,enemy:{...enemy,attack:50,attackInterval:1000}},[],2000)
 assert.equal(result.victory,false);assert.equal(result.totalDamageTaken,100)
 const summary=calculateBattleRewards(result,enemy,createDefaultPlayerProfile())
 assert.equal(summary.updatedProfile.campaignProgress.naruto.completedStages.length,0)
 assert.ok(summary.xpResult.totalXp>0)
})
test("campaign gates use verified sequential stage coverage for every world",()=>{
 const profile=createDefaultPlayerProfile()
 assert.doesNotThrow(()=>assertCampaignAccess(profile,getCharacterById("naruto")!))
 for(const worldId of ANIME_WORLD_ORDER) {
  const world=getWorldById(worldId)!
  for(const stage of world.stages) {
   const target=CHARACTERS.find(c=>c.id===stage.enemyId)!
   if(worldId!=="naruto"||stage.stageNumber!==1) assert.throws(()=>assertCampaignAccess(profile,target))
  }
 }
 const tampered=createDefaultPlayerProfile()
 tampered.campaignProgress.naruto.currentStage=99
 tampered.campaignProgress.naruto.completed=true
 assert.throws(()=>assertCampaignAccess(tampered,getCharacterById("madara")!),/missing/)
})
test("first clear and repeated clear retain the shipped reward balance",()=>{
 const result=replay(Array.from("computer")),profile=createDefaultPlayerProfile()
 const first=calculateBattleRewards(result,enemy,profile)
 const repeat=calculateBattleRewards(result,enemy,first.updatedProfile)
 assert.equal(first.isFirstClear,true);assert.equal(repeat.isFirstClear,false)
 assert.equal(first.xpResult.totalXp-repeat.xpResult.totalXp,enemy.firstClearBonusXp)
 assert.deepEqual(profile.campaignProgress.naruto.completedStages,[])
})
