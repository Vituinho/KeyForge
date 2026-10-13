import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { WebSocket } from "ws"
import { backendTestDatabase } from "./backend-test-database"
import { createApp } from "../backend/app"
import { json } from "../backend/database"
import type { MultiplayerMatchRow } from "../src/types/database"
import { getWordsForMatch } from "../src/lib/multiplayer/wordGenerator"
import { generateKeyExercises } from "../src/lib/academy/keyExercises"
import { getCharacterById } from "../src/data/characters"
import { getWorldById } from "../src/data/worlds"
import { replayBattle, type BattleChallenge } from "../src/lib/security/battleValidation"
import { importLegacy } from "../backend/legacy"
import { hash as bcryptHash } from "bcryptjs"
import { createDefaultPlayerProfile } from "../src/types/player"
import { createDefaultCosmeticsState } from "../src/types/cosmetics"
async function main() {
 const database=backendTestDatabase()
 const origin="http://localhost:3000"
 const config={databaseUrl:database.url,frontendOrigin:origin,secret:"disposable-test-secret-12345678901234567890",production:false,port:0}
 const {app,db}=await createApp(config)
 let checks=0
 const equal=(actual:unknown,expected:unknown,label:string)=>{assert.deepEqual(actual,expected,label);checks++}
 type Identity={id:string;cookie:string}
 const request=(user:Identity|undefined,path:string,payload?:unknown,method?:"POST"|"GET"|"PATCH")=>app.inject({method:method??(payload===undefined?"GET":"POST"),url:"/api/"+path,headers:{origin,"content-type":"application/json",...(user?{cookie:user.cookie}:{})},payload:payload===undefined?undefined:JSON.stringify(payload)})
 const register=async(name:string):Promise<Identity>=>{
  const response=await request(undefined,"auth/sign-up/email",{email:name.toLowerCase()+"@example.test",name,password:"Strong-password-123"})
  equal(response.statusCode,200,"register "+name+" "+response.body)
  const user={id:response.json().user.id,cookie:response.cookies.map(cookie=>`${cookie.name}=${cookie.value}`).join("; ")}
  equal((await request(user,"player")).json().level,1,"fresh account")
  return user
 }
 const sockets:WebSocket[]=[]
 try {
  equal(database.sql("SELECT rolsuper::text || ',' || rolcreatedb::text || ',' || rolcreaterole::text FROM pg_roles WHERE rolname='keyforge_app'"),'false,false,false','runtime role lacks administrative privileges')
  equal(database.sql("SELECT has_schema_privilege('keyforge_app','public','CREATE')"),'f','runtime cannot create bypass functions')
  equal(database.sql("SELECT has_table_privilege('keyforge_app','\"_prisma_migrations\"','UPDATE')"),'f','runtime cannot alter migration ledger')
  equal(database.sql("SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN LATERAL aclexplode(c.relacl) a WHERE n.nspname='public' AND a.grantee=0"),'0','no public table access')
  const alice=await register("Alice"),bob=await register("Bob"),mallory=await register("Mallory")
  const login=await request(undefined,"auth/sign-in/email",{email:"alice@example.test",password:"Strong-password-123"})
  equal(login.statusCode,200,"real password login")
  equal((await request(undefined,"auth/sign-in/email",{email:"alice@example.test",password:"wrong-password"})).statusCode,401,"wrong password")
  equal((await request(undefined,"auth/sign-up/email",{email:"duplicate@example.test",name:"aLiCe",password:"Strong-password-123"})).statusCode,400,"case-insensitive username")
  equal((await request(alice,"auth/update-user",{name:"Admin",xp:9999})).statusCode,404,"no generic auth mutation")
  equal((await request(alice,"auth/sign-up/email",{name:"Forged",email:"forged@example.test",password:"Strong-password-123",usernameKey:"alice",emailVerified:true})).statusCode,422,"protected auth fields")
  const protectedFields=["xp","level","totalXp","rank","attributes","stats","campaignProgress","worldsUnlocked","worldsCompleted","worldMastery","totalStagesCleared","achievements","forgeShards","unlockedSkinIds","crates","victory","winnerId","userId","id","profile","inventory","version","multiplayerStats","keyErrors"]
  for(const key of protectedFields) {
   equal((await request(alice,"preferences",{[key]:999999},"PATCH")).statusCode,422,"protected preference "+key)
   equal((await request(alice,"progression",{action:"pvp",matchId:randomUUID(),[key]:999999})).statusCode,422,"protected reward "+key)
   equal((await request(alice,"inventory",{action:"equip",skinId:"default_forge",[key]:999999})).statusCode,422,"protected inventory "+key)
   equal((await request(alice,"matches",{action:"create",mode:"private",language:"en",[key]:999999})).statusCode,422,"protected match "+key)
  }
  for(const [path,payload,method] of [["player",undefined,"GET"],["inventory",undefined,"GET"],["preferences",{username:"Hacked"},"PATCH"],["progression",{action:"pvp",matchId:randomUUID()},"POST"],["inventory",{action:"open",crateId:"basic_crate",requestId:randomUUID()},"POST"],["matches",{action:"create",mode:"private",language:"en"},"POST"],["queue",{action:"enter",language:"en"},"POST"],["ws-ticket",{},"POST"]] as const) equal((await request(undefined,path,payload,method)).statusCode,401,"unauthorized "+path)
  equal((await request(alice,"preferences",{username:"Alice",userId:bob.id},"PATCH")).statusCode,422,"another user")
  equal((await app.inject({url:'/api/player',headers:{cookie:alice.cookie,'x-keyforge-account':bob.id}})).statusCode,409,'stale account precondition')
  equal((await request(alice,'preferences',{keyboardSettings:{keyboardLayout:'off'}},'PATCH')).statusCode,422,'preference enum cannot cross fields')
  equal((await request(alice,"inventory",{action:"equip",skinId:"unowned_secret"})).statusCode,422,"unowned equip")
  equal((await request(alice,"progression",{action:"finish",sessionId:randomUUID(),events:[]})).statusCode,422,"fake battle")
  equal((await request(alice,"progression",{action:"pvp",matchId:randomUUID()})).statusCode,422,"fake victory")
  equal((await request(alice,"progression",{action:"import",profile:{xp:99999}})).statusCode,422,"tampered import")
  equal((await request(alice,"import",{profile:{xp:99999}})).statusCode,404,"no import API")
  const open={action:"open",crateId:"basic_crate",requestId:randomUUID()}
  const results=await Promise.all([request(alice,"inventory",open),request(alice,"inventory",open)])
  equal(results[0].statusCode,200,"crate first");equal(results[1].statusCode,200,"crate concurrency")
  equal(results[0].json(),results[1].json(),"same crate receipt")
  equal((await request(alice,"inventory")).json().crates.basic_crate,0,"one consumption")
  equal(await db.receipt.count({where:{userId:alice.id}}),1,"one receipt")
  equal((await request(alice,"inventory",{...open,crateId:"mythic_crate"})).statusCode,422,"changed crate replay")
  equal((await request(alice,"inventory",{...open,requestId:randomUUID(),skinId:"chosen"})).statusCode,422,"chosen outcome")
  equal((await request(alice,"inventory",{action:"purchase",crateId:"mythic_crate",requestId:randomUUID()})).statusCode,422,"insufficient currency")
  equal((await request(bob,"inventory")).json().crates.basic_crate,1,"other inventory intact")
  const own=await db.player.findUniqueOrThrow({where:{userId:alice.id}})
  const funded=own.inventory as unknown as ReturnType<typeof createDefaultCosmeticsState>;funded.forgeShards=250
  await db.player.update({where:{userId:alice.id},data:{inventory:json(funded)}})
  const purchase={action:'purchase',crateId:'basic_crate',requestId:randomUUID()}
  const purchases=await Promise.all([request(alice,'inventory',purchase),request(alice,'inventory',purchase)])
  equal(purchases[0].statusCode,200,'purchase succeeds')
  equal(purchases[1].json(),purchases[0].json(),'purchase idempotent')
  equal((await request(alice,'inventory')).json().forgeShards,150,'purchase once')
  equal((await request(alice,'inventory')).json().crates.basic_crate,1,'one purchased crate')
  equal((await request(alice,'inventory',{action:'equip',skinId:'midnight_shinobi'})).statusCode,200,'owned equip')
  equal((await request(alice,'inventory')).json().equippedSkinId,'midnight_shinobi','equip persisted')
  for(const layout of ['ABNT2','ANSI'] as const) {
   const language=layout==='ANSI'?'en':'pt-BR'
   const begin=await request(alice,'progression',{action:'beginPractice',kind:'academy',layout,language})
   equal(begin.statusCode,200,'practice begin '+layout)
   const sessionId=begin.json().id
   let at=0
   const rounds=generateKeyExercises('r',layout).map(drill=>({text:drill.text,events:Array.from(drill.text).map(key=>({key,at:at+=200}))}))
   await db.challenge.update({where:{id:sessionId},data:{createdAt:new Date(Date.now()-at-500)}})
   equal((await request(bob,'progression',{action:'practice',sessionId,rounds,targetKey:'r'})).statusCode,422,'wrong practice owner '+layout)
   equal((await request(alice,'progression',{action:'practice',sessionId,rounds:rounds.slice(0,5),targetKey:'r'})).statusCode,422,'incomplete practice '+layout)
   const claim={action:'practice',sessionId,rounds,targetKey:'r'}
   const firstPractice=await request(alice,'progression',claim)
   equal(firstPractice.statusCode,200,'practice reward '+layout)
   equal((await request(alice,'progression',claim)).json(),firstPractice.json(),'practice duplicate '+layout)
   equal((await db.challenge.findUniqueOrThrow({where:{id:sessionId}})).finished,true,'practice consumed '+layout)
  }
  const world=getWorldById('naruto')!
  const locked=world.stages.find(stage=>stage.stageNumber===2)!
  equal((await request(alice,'progression',{action:'begin',enemyId:locked.enemyId,language:'en'})).statusCode,422,'campaign gate')
  const battleBegin=await request(alice,'progression',{action:'begin',enemyId:world.stages[0].enemyId,language:'en'})
  equal(battleBegin.statusCode,200,'issued campaign challenge')
  const challenge=battleBegin.json() as BattleChallenge&{id:string}
  const events:{key:string;at:number}[]=[]
  let completed=false
  for(let cycle=0;cycle<10&&!completed;cycle++) for(const text of challenge.texts) {
   if(completed) break
   for(const key of Array.from(text)) {
    events.push({key,at:events.length*150+150})
    try {const result=replayBattle(challenge,events,events.at(-1)!.at+500);if(result.victory){completed=true;break}} catch {}
   }
  }
  equal(completed,true,'legitimate battle replay finishes')
  await db.challenge.update({where:{id:challenge.id},data:{createdAt:new Date(Date.now()-events.at(-1)!.at-500)}})
  const battleClaim={action:'finish',sessionId:challenge.id,events}
  equal((await request(bob,'progression',battleClaim)).statusCode,422,'wrong battle owner')
  const firstBattle=await request(alice,'progression',battleClaim)
  equal(firstBattle.statusCode,200,'validated battle completion')
  equal(firstBattle.json().result.victory,true,'derived victory')
  equal((await request(alice,'progression',battleClaim)).json(),firstBattle.json(),'duplicate battle reward')
  equal((await request(alice,'player')).json().campaignProgress.naruto.completedStages.includes(1),true,'campaign persisted')
  equal((await request(alice,'progression',{action:'begin',enemyId:locked.enemyId,language:'en'})).statusCode,200,'next campaign stage')
  const enemy=getCharacterById(world.stages[0].enemyId)!
  equal(challenge.enemy.id,enemy.id,'issued enemy identity')
  const create=await request(alice,"matches",{action:"create",mode:"private",language:"en"})
  equal(create.statusCode,200,"create private")
  let match=create.json() as MultiplayerMatchRow
  equal((await request(mallory,`matches/${match.id}`)).statusCode,403,"private membership")
  equal((await request(bob,"matches",{action:"join",roomCode:match.room_code})).statusCode,200,"join private")
  equal((await request(mallory,"matches",{action:"join",roomCode:match.room_code})).statusCode,422,"full room")
  equal((await request(mallory,"matches",{action:"ready",matchId:match.id,isReady:true})).statusCode,403,"outsider ready")
  equal((await request(alice,"matches",{action:"ready",matchId:match.id,isReady:true})).statusCode,200,"p1 ready")
  match=(await request(bob,"matches",{action:"ready",matchId:match.id,isReady:true})).json()
  equal(match.status,"countdown","server countdown")
  equal((await request(alice,"progression",{action:"pvp",matchId:match.id})).statusCode,422,"unfinished reward")
  equal((await request(alice,"matches",{action:"word",matchId:match.id,eventId:"too-early",wordIndex:0,attempts:Array.from(getWordsForMatch(match)[0])})).statusCode,422,"before countdown")
  // Fixture advances only the server clock, never grants browser authority.
  match.started_at=new Date(Date.now()-20000).toISOString()
  match.status="countdown"
  await db.match.update({where:{id:match.id},data:{state:json(match)}})
  equal((await request(alice,`matches/${match.id}`)).json().status,'playing','elapsed countdown readable without heartbeat delay')
  const words=getWordsForMatch(match)
  let first:unknown
  for(let index=0;index<5;index++) {
   const input={action:"word",matchId:match.id,eventId:"alice-"+index,wordIndex:index,attempts:Array.from(words[index])}
   if(index===0) first=input
   const response=await request(alice,"matches",input)
   equal(response.statusCode,200,"validated word "+index)
   equal(response.json().player_1_word_index,index+1,"index "+index)
  }
  equal((await request(alice,"matches",first)).statusCode,200,"replayed match idempotent")
  equal(await db.matchEvent.count({where:{matchId:match.id}}),5,"no replay events")
  equal((await request(alice,"matches",{...(first as object),attempts:["x"]})).statusCode,422,"changed replay")
  equal((await request(bob,"matches",{action:"word",matchId:match.id,eventId:"bob-bad",wordIndex:1,attempts:Array.from(words[1])})).statusCode,422,"out of order")
  equal((await request(mallory,"matches",{action:"forfeit",matchId:match.id})).statusCode,403,"outsider forfeit")
  equal((await request(alice,"matches",{action:"disconnect",matchId:match.id})).statusCode,422,"fake disconnect")
  const typo=Array.from(words[0]);typo[1]=typo[1]==="x"?"z":"x"
  const bobWord=await request(bob,"matches",{action:"word",matchId:match.id,eventId:"bob-0",wordIndex:0,attempts:typo})
  equal(bobWord.statusCode,200,"substitution advances")
  equal((await db.matchEvent.findFirstOrThrow({where:{matchId:match.id,userId:bob.id}})).data && (await db.matchEvent.findFirstOrThrow({where:{matchId:match.id,userId:bob.id}})).data!==null,true,"stored typing evidence")
  await app.listen({host:"127.0.0.1",port:0})
  const address=app.server.address() as {port:number}
  const connect=async(user:Identity,existingTicket?:string)=>{
   const ticket=existingTicket??(await request(user,"ws-ticket",{})).json().ticket
   const socket=new WebSocket(`ws://127.0.0.1:${address.port}/ws`,{origin})
   sockets.push(socket)
   const messages:Record<string,unknown>[]=[]
   socket.on("message",raw=>messages.push(JSON.parse(raw.toString())))
   await new Promise<void>((resolve,reject)=>{socket.once("open",resolve);socket.once("error",reject)})
   socket.send(JSON.stringify({type:"authenticate",ticket}))
   const wait=async(predicate:(message:Record<string,unknown>)=>boolean)=>{
    const end=Date.now()+5000
    while(Date.now()<end){const value=messages.find(predicate);if(value)return value;await new Promise(resolve=>setTimeout(resolve,10))}
    throw new Error("WebSocket timeout")
   }
   return {socket,messages,wait,ticket}
  }
  const a=await connect(alice),b=await connect(bob)
  await a.wait(message=>message.type==="authenticated");checks++
  a.socket.send(JSON.stringify({type:"subscribe",matchId:match.id}))
  b.socket.send(JSON.stringify({type:"subscribe",matchId:match.id}))
  equal((await a.wait(message=>message.type==="match")).type,"match","authenticated snapshot")
  await b.wait(message=>message.type==="match");checks++
  b.socket.close()
  const reconnect=await connect(bob)
  reconnect.socket.send(JSON.stringify({type:"subscribe",matchId:match.id}))
  equal((await reconnect.wait(message=>message.type==="match")).type,"match","reconnect persisted match")
  const replay=await connect(alice,a.ticket)
  const closed=await new Promise<number>(resolve=>replay.socket.once("close",code=>resolve(code)))
  equal(closed,1008,"one-use ticket")
  const outsider=await connect(mallory)
  await outsider.wait(message=>message.type==="authenticated")
  const forbiddenClose=new Promise<number>(resolve=>outsider.socket.once("close",code=>resolve(code)))
  outsider.socket.send(JSON.stringify({type:"subscribe",matchId:match.id}))
  equal(await forbiddenClose,1008,"WS membership")
  const forgedSocket=await connect(bob)
  await forgedSocket.wait(message=>message.type==='authenticated')
  const forgedClose=new Promise<number>(resolve=>forgedSocket.socket.once('close',code=>resolve(code)))
  forgedSocket.socket.send(JSON.stringify({type:'attack',matchId:match.id,damage:9999,winnerId:bob.id}))
  equal(await forgedClose,1008,'forged WS combat')
  const evilSocket=new WebSocket(`ws://127.0.0.1:${address.port}/ws`,{origin:'https://evil.test'})
  sockets.push(evilSocket)
  equal(await new Promise<number>((resolve,reject)=>{evilSocket.once('close',resolve);evilSocket.once('error',reject)}),1008,'WS origin validation')
  equal((await request(bob,"matches",{action:"forfeit",matchId:match.id})).statusCode,200,"authoritative finish")
  const reward={action:"pvp",matchId:match.id}
  const rewards=await Promise.all([request(alice,"progression",reward),request(alice,"progression",reward)])
  equal(rewards[0].statusCode,200,"pvp reward");equal(rewards[1].statusCode,200,"duplicate reward")
  equal(rewards[0].json(),rewards[1].json(),"atomic same receipt")
  equal(await db.receipt.count({where:{userId:alice.id,source:"pvp:"+match.id}}),1,"one match reward")
  equal((await request(mallory,"progression",reward)).statusCode,422,"outsider reward")
  equal((await request(alice,"progression",{...reward,xp:999999})).statusCode,422,"forged reward")
  equal((await request(bob,`matches/${match.id}/result`)).json().winner_id,alice.id,"persisted result")
  const queueAlice=await request(alice,'queue',{action:'enter',language:'pt-BR'})
  equal(queueAlice.json().status,'searching','quick queue waiting')
  const queueBob=await request(bob,'queue',{action:'enter',language:'pt-BR'})
  equal(queueBob.json().status,'matched','quick queue paired')
  const quickId=queueBob.json().matchId
  equal((await request(alice,'queue',{action:'check'})).json().matchId,quickId,'both accounts same quick match')
  equal((await request(alice,'queue',{action:'practice'})).json().matchId,quickId,'human pairing wins atomic bot handoff')
  equal((await request(mallory,`matches/${quickId}`)).statusCode,403,'quick match membership')
  const quick=(await request(alice,`matches/${quickId}`)).json() as MultiplayerMatchRow
  equal(quick.status,'playing','quick match keeps immediate start behavior')
  quick.started_at=new Date(Date.now()-20000).toISOString();quick.status='playing'
  quick.player_2_last_active_at=new Date(Date.now()-20000).toISOString()
  await db.match.update({where:{id:quickId},data:{state:json(quick)}})
  const quickWords=getWordsForMatch(quick)
  for(let index=0;index<3;index++) equal((await request(alice,'matches',{action:'word',matchId:quickId,eventId:'quick-'+index,wordIndex:index,attempts:Array.from(quickWords[index])})).statusCode,200,'quick validated word '+index)
  const disconnect=await request(alice,'matches',{action:'disconnect',matchId:quickId})
  equal(disconnect.statusCode,200,'server grace verified')
  equal(disconnect.json().winner_id,alice.id,'authoritative disconnect winner')
  equal((await request(alice,'progression',{action:'pvp',matchId:quickId})).json().summary.baseXp,120,'quick winner balance')
  equal((await request(alice,'queue',{action:'enter',language:'en'})).json().status,'searching','finished queue clears for next match')
  equal((await request(alice,'queue',{action:'leave'})).json().status,'searching','leave waiting queue')
  equal(await db.queue.count({where:{userId:alice.id}}),0,'queue removal persisted')
  const leavingRoom=(await request(alice,'matches',{action:'create',mode:'private',language:'en'})).json() as MultiplayerMatchRow
  equal((await request(bob,'matches',{action:'join',roomCode:leavingRoom.room_code})).statusCode,200,'guest joins new lobby')
  const leavingSocket=await connect(bob)
  await leavingSocket.wait(message=>message.type==='authenticated')
  leavingSocket.socket.send(JSON.stringify({type:'subscribe',matchId:leavingRoom.id}))
  await leavingSocket.wait(message=>message.type==='match')
  const membershipClosed=new Promise<number>(resolve=>leavingSocket.socket.once('close',code=>resolve(code)))
  equal((await request(bob,'matches',{action:'forfeit',matchId:leavingRoom.id})).json().player_2_id,null,'guest leaves waiting lobby')
  equal(await membershipClosed,1008,'leaving guest loses WS membership')
  equal((await request(mallory,'matches',{action:'join',roomCode:leavingRoom.room_code})).statusCode,200,'waiting room accepts replacement guest')
  equal((await request(alice,'matches',{action:'cancel',matchId:leavingRoom.id})).json().status,'cancelled','host cancels waiting room')
  equal((await request(alice,"preferences",{username:"AliceNew"},"PATCH")).statusCode,200,"preference update")
  equal((await request(alice,"player")).json().username,"AliceNew","preference persistence")
  const session=await request(alice,"auth/get-session")
  equal(session.json().user.id,alice.id,"persistent session")
  const restarted=await createApp(config)
  try {equal((await restarted.app.inject({url:'/api/player',headers:{cookie:alice.cookie}})).json().id,alice.id,'session survives a fresh backend instance')}
  finally {await restarted.app.close()}
  const legacyId=randomUUID()
  const legacy=[{id:legacyId,email:'legacy@example.test',username:'Legacy',emailVerified:true,passwordHash:await bcryptHash('legacy-password-123',10),createdAt:'2025-01-01T00:00:00Z',legacy:{xp:999999,rank:'SSS',forgeShards:999999}}]
  equal((await importLegacy(db,legacy,'reviewed-archive-test')).imported,1,'legacy identity import')
  equal((await importLegacy(db,legacy,'reviewed-archive-test')).imported,0,'legacy import idempotent')
  equal(await db.legacyRecord.count({where:{userId:legacyId}}),1,'legacy archive retained')
  const legacyLogin=await request(undefined,'auth/sign-in/email',{email:'legacy@example.test',password:'legacy-password-123'})
  equal(legacyLogin.statusCode,200,'existing password migration')
  const legacyUser={id:legacyId,cookie:legacyLogin.cookies.map(cookie=>`${cookie.name}=${cookie.value}`).join('; ')}
  equal((await request(legacyUser,'player')).json().level,1,'unverified legacy cannot become competitive XP')
  equal((await request(legacyUser,'inventory')).json().forgeShards,50,'unverified legacy cannot mint shards')
  equal((await db.legacyRecord.findFirstOrThrow({where:{userId:legacyId}})).snapshot && (await db.legacyRecord.findFirstOrThrow({where:{userId:legacyId}})).classification,'unverified-legacy','legacy trust classification')
  const verifiedId=randomUUID()
  const trustedProfile={...createDefaultPlayerProfile('VerifiedLegacy'),id:verifiedId,level:3,xp:20,totalXp:800,academyProgress:{'home-row':{completed:true,attempts:1,bestAccuracy:100,bestWpm:40}}}
  const trustedInventory=createDefaultCosmeticsState();trustedInventory.forgeShards=150
  const historicalSource='battle:'+randomUUID()
  const historicalCrate=randomUUID()
  const trusted=[{...legacy[0],id:verifiedId,email:'verified-legacy@example.test',username:'VerifiedLegacy',verified:{profile:trustedProfile,inventory:trustedInventory,auditReference:'owner-reviewed-trusted-store-export',receipts:[{source:historicalSource,receipt:{preserved:true}},{source:'crate:'+historicalCrate,receipt:{success:true}}]}}]
  equal((await importLegacy(db,trusted,'reviewed-trusted-export')).imported,1,'trusted owner import')
  equal((await db.player.findUniqueOrThrow({where:{userId:verifiedId}})).profile as unknown as typeof trustedProfile,trustedProfile,'legitimate verified progress preserved')
  equal(await db.receipt.count({where:{userId:verifiedId,source:historicalSource}}),1,'historical reward ledger preserved')
  const verifiedLogin=await request(undefined,'auth/sign-in/email',{email:'verified-legacy@example.test',password:'legacy-password-123'})
  equal(verifiedLogin.statusCode,200,'verified legacy login')
  const verifiedUser={id:verifiedId,cookie:verifiedLogin.cookies.map(cookie=>`${cookie.name}=${cookie.value}`).join('; ')}
  equal((await request(verifiedUser,'inventory',{action:'open',crateId:'basic_crate',requestId:historicalCrate})).statusCode,422,'historical crate event cannot spend again after cutover')
  equal((await request(verifiedUser,'inventory')).json().crates.basic_crate,1,'historical replay preserves remaining crates')
  const revokedClose=new Promise<number>(resolve=>reconnect.socket.once('close',code=>resolve(code)))
  equal((await request(bob,'auth/sign-out',{})).statusCode,200,'pvp session logout')
  reconnect.socket.send(JSON.stringify({type:'presence',status:'in_lobby'}))
  equal(await revokedClose,1008,'revoked session loses WS access')
  const productionOrigin='https://staging.example.test',proxySecret='secure-test-proxy-secret-1234567890123456'
  const secure=await createApp({...config,production:true,frontendOrigin:productionOrigin,proxySecret})
  try {
   let observedIp:unknown
   secure.app.addHook('onResponse',async request=>{observedIp=request.headers['x-keyforge-client-ip']})
   equal((await secure.app.inject({url:'/health',headers:{'x-keyforge-client-ip':'1.2.3.4'}})).statusCode,200,'public health does not require proxy credentials')
   equal(observedIp,'127.0.0.1','public endpoint cannot spoof trusted client IP')
   equal((await secure.app.inject({url:'/api/player',headers:{cookie:alice.cookie,'x-forwarded-for':'1.2.3.4'}})).statusCode,403,'untrusted direct proxy headers rejected')
   const secureLogin=await secure.app.inject({method:'POST',url:'/api/auth/sign-in/email',headers:{origin:productionOrigin,'x-keyforge-proxy':proxySecret},payload:{email:'alice@example.test',password:'Strong-password-123'}})
   equal(secureLogin.statusCode,200,'production session login')
   equal(observedIp,'127.0.0.1','missing trusted IP falls back to transport')
   const setCookie=secureLogin.headers['set-cookie'] as string[]
   const sessionCookie=setCookie.find(value=>value.includes('session_token'))!
   equal(/; Secure/i.test(sessionCookie),true,'production Secure cookie')
   equal(/; HttpOnly/i.test(sessionCookie),true,'HttpOnly cookie')
   equal(/; SameSite=Lax/i.test(sessionCookie),true,'SameSite cookie')
   equal(/; Domain=/i.test(sessionCookie),false,'host-only cookie')
  } finally {await secure.app.close()}
  equal((await request(alice,"auth/sign-out",{})).statusCode,200,"logout")
  equal((await request(alice,"player")).statusCode,401,"revoked session")
  console.log(`Backend security: ${checks} PostgreSQL-backed assertions passed (HTTP, transactions, two accounts, WebSocket/reconnect/replays)`)
 } finally {for(const socket of sockets) socket.terminate();await app.close();database.close()}
}
void main().catch(error=>{console.error(error);process.exitCode=1})
