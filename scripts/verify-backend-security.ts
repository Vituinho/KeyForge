import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { WebSocket } from "ws"
import { backendTestDatabase } from "./backend-test-database"
import { createApp } from "../backend/app"
import { json } from "../backend/database"
import type { MultiplayerMatchRow } from "../src/types/database"
import { getWordsForMatch } from "../src/lib/multiplayer/wordGenerator"
async function main() {
 const database=backendTestDatabase()
 const origin="http://localhost:3000"
 const config={databaseUrl:database.url,frontendOrigin:origin,secret:"disposable-test-secret-12345678901234567890",production:false,port:0}
 const {app,db}=await createApp(config)
 let checks=0
 const equal=(actual:unknown,expected:unknown,label:string)=>{assert.deepEqual(actual,expected,label);checks++}
 type Identity={id:string;cookie:string}
 const request=(user:Identity|undefined,path:string,payload?:unknown,method?:"POST"|"GET"|"PATCH")=>app.inject({method:method??(payload===undefined?"GET":"POST"),url:"/api/"+path,headers:{origin,...(user?{cookie:user.cookie}:{})},payload})
 const register=async(name:string):Promise<Identity>=>{
  const response=await request(undefined,"auth/sign-up/email",{email:name.toLowerCase()+"@example.test",name,password:"Strong-password-123"})
  equal(response.statusCode,200,"register "+name)
  const user={id:response.json().user.id,cookie:response.cookies.map(cookie=>`${cookie.name}=${cookie.value}`).join("; ")}
  equal((await request(user,"player")).json().level,1,"fresh account")
  return user
 }
 const sockets:WebSocket[]=[]
 try {
  const alice=await register("Alice"),bob=await register("Bob"),mallory=await register("Mallory")
  const protectedFields=["xp","level","totalXp","rank","attributes","stats","campaignProgress","worldsUnlocked","worldsCompleted","worldMastery","totalStagesCleared","achievements","forgeShards","unlockedSkinIds","crates","victory","winnerId","userId","id","profile","inventory","version","multiplayerStats","keyErrors"]
  for(const key of protectedFields) {
   equal((await request(alice,"preferences",{[key]:999999},"PATCH")).statusCode,422,"protected preference "+key)
   equal((await request(alice,"progression",{action:"pvp",matchId:randomUUID(),[key]:999999})).statusCode,422,"protected reward "+key)
   equal((await request(alice,"inventory",{action:"equip",skinId:"default_forge",[key]:999999})).statusCode,422,"protected inventory "+key)
   equal((await request(alice,"matches",{action:"create",mode:"private",language:"en",[key]:999999})).statusCode,422,"protected match "+key)
  }
  for(const [path,payload,method] of [["player",undefined,"GET"],["inventory",undefined,"GET"],["preferences",{username:"Hacked"},"PATCH"],["progression",{action:"pvp",matchId:randomUUID()},"POST"],["inventory",{action:"open",crateId:"basic_crate",requestId:randomUUID()},"POST"],["matches",{action:"create",mode:"private",language:"en"},"POST"],["queue",{action:"enter",language:"en"},"POST"],["ws-ticket",{},"POST"]] as const) equal((await request(undefined,path,payload,method)).statusCode,401,"unauthorized "+path)
  equal((await request(alice,"preferences",{username:"Alice",userId:bob.id},"PATCH")).statusCode,422,"another user")
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
  match.status="playing"
  await db.match.update({where:{id:match.id},data:{state:json(match)}})
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
  equal((await request(bob,"matches",{action:"forfeit",matchId:match.id})).statusCode,200,"authoritative finish")
  const reward={action:"pvp",matchId:match.id}
  const rewards=await Promise.all([request(alice,"progression",reward),request(alice,"progression",reward)])
  equal(rewards[0].statusCode,200,"pvp reward");equal(rewards[1].statusCode,200,"duplicate reward")
  equal(rewards[0].json(),rewards[1].json(),"atomic same receipt")
  equal(await db.receipt.count({where:{userId:alice.id,source:"pvp:"+match.id}}),1,"one match reward")
  equal((await request(mallory,"progression",reward)).statusCode,422,"outsider reward")
  equal((await request(alice,"progression",{...reward,xp:999999})).statusCode,422,"forged reward")
  equal((await request(bob,`matches/${match.id}/result`)).json().winner_id,alice.id,"persisted result")
  equal((await request(alice,"preferences",{username:"AliceNew"},"PATCH")).statusCode,200,"preference update")
  equal((await request(alice,"player")).json().username,"AliceNew","preference persistence")
  const session=await request(alice,"auth/get-session")
  equal(session.json().user.id,alice.id,"persistent session")
  equal((await request(alice,"auth/sign-out",{})).statusCode,200,"logout")
  equal((await request(alice,"player")).statusCode,401,"revoked session")
  console.log(`Backend security: ${checks} PostgreSQL-backed assertions passed (HTTP, transactions, two accounts, WebSocket/reconnect/replays)`)
 } finally {for(const socket of sockets) socket.terminate();await app.close();database.close()}
}
void main().catch(error=>{console.error(error);process.exitCode=1})
