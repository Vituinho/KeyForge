import "server-only"
import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { randomInt } from "node:crypto"
import { PlayerProfile } from "@/types/player"
import { MultiplayerMatchRow } from "@/types/database"
import { getCharacterById } from "@/data/characters"
import { getTextsForCharacter } from "@/data/texts"
import { scaleEnemyForBattle } from "@/lib/battle/difficultyScaler"
import { getTopWeakKeys,prioritizeSentencesByWeakKeys } from "@/lib/worlds/hunterAdaptiveEngine"
import { calculateBattleRewards } from "@/lib/progression/calculateBattleRewards"
import { calculateMultiplayerRewards } from "@/lib/multiplayer/calculateMultiplayerRewards"
import { assertCampaignAccess,BattleChallenge,BattleInputEvent,replayBattle } from "@/lib/security/battleValidation"
import { validateProgressionRequest } from "@/lib/security/progressionRequest"
import { PracticeChallenge,PracticeRound,replayPractice } from "@/lib/security/practiceValidation"
import { calculateAcademyLessonRewards,calculateTrainingRewards } from "@/lib/progression/calculateActivityRewards"

export const runtime="nodejs"
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}})
async function body(request:Request):Promise<Record<string,unknown>> {
 if(Number(request.headers.get("content-length")??0)>1048576) throw new Error("Invalid payload")
 const reader=request.body?.getReader()
 if(!reader) throw new Error("Invalid payload")
 const chunks:Uint8Array[]=[];let size=0
 try {
  for(;;){const {done,value}=await reader.read();if(done) break;size+=value.byteLength;if(size>1048576) throw new Error("Invalid payload");chunks.push(value)}
 } finally {await reader.cancel()}
 const text=new TextDecoder().decode(Buffer.concat(chunks))
 const data:unknown=JSON.parse(text)
 if(!data||typeof data!=="object"||Array.isArray(data)) throw new Error("Invalid payload")
 return data as Record<string,unknown>
}
async function account(db:SupabaseClient,user:string) {
 const {data,error}=await db.from("verified_players").select("profile,version").eq("user_id",user).single()
 if(error||!data) throw new Error("Verified account unavailable")
 const {data:identity,error:identityError}=await db.from('profiles').select('username').eq('id',user).single()
 if(identityError||!identity) throw new Error('Account unavailable')
 return {profile:{...data.profile,username:identity.username} as PlayerProfile,version:data.version as number}
}
async function rpc(db:SupabaseClient,name:string,args:Record<string,unknown>) {
 const result=await db.rpc(name,args)
 if(result.error) throw Object.assign(new Error("Database rejected reward"),{code:result.error.code})
 return result.data
}

export async function POST(request:Request) {
 const authorization=request.headers.get("authorization")
 if(!authorization?.startsWith("Bearer ") || authorization.length>16384) return json({error:"Authentication required"},401)
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,secret=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!anon||!secret) return json({error:"Verified rewards unavailable"},503)
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
 const {data:{user},error}=await auth.auth.getUser(authorization.slice(7))
 if(error||!user) return json({error:"Authentication required"},401)
 // Secret exists only in this server module, never in a NEXT_PUBLIC variable/client import.
 const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}})
 try {
  const input=await body(request)
  validateProgressionRequest(input)
  if(input.action==='beginPractice') {
   if(!['academy','home-row','training'].includes(String(input.kind))||!['ABNT2','ANSI'].includes(String(input.layout))||!['en','pt-BR'].includes(String(input.language))) throw new Error('Invalid practice')
   if(input.targetKeys!==undefined&&(!Array.isArray(input.targetKeys)||input.targetKeys.length>5||input.targetKeys.some(k=>typeof k!=='string'||k.length!==1||!k.trim()||/\p{C}/u.test(k)))) throw new Error('Invalid target keys')
   const challenge={kind:input.kind,layout:input.layout,language:input.language,targetKeys:input.targetKeys??[]}
   const session=await rpc(db,'begin_verified_practice',{p_user:user.id,p_challenge:challenge})
   return json({id:session.id})
  }
  if(input.action==="begin") {
   if(typeof input.enemyId!=="string" || !["en","pt-BR"].includes(String(input.language))) throw new Error("Invalid challenge")
   const enemy=getCharacterById(input.enemyId)
   if(!enemy) throw new Error("Unknown enemy")
   const {profile,version}=await account(db,user.id)
   assertCampaignAccess(profile,enemy)
   const scaled=scaleEnemyForBattle(enemy,profile)
   let texts=getTextsForCharacter(enemy.id,input.language as "pt-BR"|"en")
   if(enemy.world==="hunter") texts=prioritizeSentencesByWeakKeys(texts,getTopWeakKeys(profile.keyErrors??{},5))
   const challenge:BattleChallenge={enemy:scaled,texts,language:input.language as "pt-BR"|"en"}
   const session=await rpc(db,"begin_verified_battle",{p_user:user.id,p_version:version,p_challenge:challenge})
   return json({id:session.id,...challenge})
  }
  if(input.action!=="finish"&&input.action!=="pvp"&&input.action!=='practice') throw new Error("Unknown activity")
  const battle=input.action==="finish"
  const practice=input.action==='practice'
  const id=battle||practice?input.sessionId:input.matchId
  if(typeof id!=="string"||!UUID.test(id)) throw new Error("Invalid activity ID")
  const source=`${battle?"battle":practice?'practice':"pvp"}:${id}`
  const cached=await rpc(db,"read_verified_reward",{p_user:user.id,p_source:source})
  if(cached) return json(cached)
  // Recompute against the new account version if another validated activity committed first.
  for(let retry=0;retry<3;retry++) {
   const {profile,version}=await account(db,user.id)
   let receipt:Record<string,unknown>;let next:PlayerProfile;const crates:Record<string,number>={};let shards=0
   if(practice) {
    const session=await rpc(db,'read_verified_battle',{p_user:user.id,p_id:id})
    if(!session||session.finished||new Date(session.expires_at).getTime()<=Date.now()||!['academy','home-row','training'].includes(session.challenge.kind)) throw new Error('Invalid practice session')
    const replay=replayPractice(session.challenge as PracticeChallenge,input.rounds as PracticeRound[],Number(session.server_elapsed_ms),typeof input.targetKey==='string'?input.targetKey:undefined)
    const summary=replay.lessonId?calculateAcademyLessonRewards(replay.lessonId,replay.stats,profile):calculateTrainingRewards(replay.stats,profile)
    next=summary.updatedProfile;receipt={summary}
   } else if(battle) {
    const session=await rpc(db,"read_verified_battle",{p_user:user.id,p_id:id})
    if(!session||session.finished||new Date(session.expires_at).getTime()<=Date.now()) throw new Error("Invalid session")
    const challenge=session.challenge as BattleChallenge
    if(session.challenge.kind) throw new Error('Not a battle challenge')
    assertCampaignAccess(profile,challenge.enemy)
    const result=replayBattle(challenge,input.events as BattleInputEvent[],Number(session.server_elapsed_ms))
    const summary=calculateBattleRewards(result,challenge.enemy,profile)
    for(const c of summary.awardedCrates??[]) crates[c.crateId]=(crates[c.crateId]??0)+c.count
    receipt={summary,result};next=summary.updatedProfile
   } else {
    const {data:match,error:matchError}=await db.from("multiplayer_matches").select("*").eq("id",id).single()
    if(matchError||!match||match.authority_version!==1||match.status!=="finished"||![match.player_1_id,match.player_2_id].includes(user.id)) throw new Error("Unverified match")
    const isP1=match.player_1_id===user.id
    const {data:events,error:eventError}=await db.from("multiplayer_match_events").select("combo").eq("match_id",id).eq("player_id",user.id).not("word_index","is",null)
    if(eventError) throw new Error("Missing match evidence")
    const combo=Math.max(0,...(events??[]).map(e=>e.combo??0))
    const summary=calculateMultiplayerRewards(match as MultiplayerMatchRow,user.id,isP1?match.player_1_wpm:match.player_2_wpm,isP1?match.player_1_accuracy:match.player_2_accuracy,combo,profile,()=>randomInt(0,1000000)/1000000)
    if(!summary) return json({summary:null})
    if(summary.awardedCrate) crates[summary.awardedCrate.crateId]=1
    shards=summary.shardsAwarded;next=summary.updatedProfile;receipt={summary}
   }
   try {
    return json(await rpc(db,"commit_verified_reward",{p_user:user.id,p_source:source,p_version:version,p_profile:next,p_receipt:receipt,p_crates:crates,p_shards:shards}))
   } catch(error) {if((error as {code?:string}).code!=="40001" || retry===2) throw error}
  }
  return json({error:"Retry verification"},409)
 } catch {return json({error:"Activity could not be verified"},422)}
}
