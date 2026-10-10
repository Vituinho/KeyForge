import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { readdirSync,readFileSync } from "node:fs"
import { join } from "node:path"

/** Built production server, isolated port, deliberately absent service key. No Supabase writes. */
async function verify() {
 const port=33000+Math.floor(Math.random()*6000)
 const origin=`http://127.0.0.1:${port}`
 const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port),'--hostname','127.0.0.1'],{
  env:{...process.env,SUPABASE_SERVICE_ROLE_KEY:''},windowsHide:true,stdio:['ignore','pipe','pipe'],
 })
 let output=''
 child.stdout.on('data',chunk=>{output=(output+String(chunk)).slice(-4000)})
 child.stderr.on('data',chunk=>{output=(output+String(chunk)).slice(-4000)})
 const closed=new Promise<void>(resolve=>child.once('close',()=>resolve()))
 try {
  let ready=false
  for(let i=0;i<60;i++) {
   if(child.exitCode!==null) throw new Error(output)
   try {ready=(await fetch(origin)).status===200;if(ready) break} catch {}
   await new Promise(resolve=>setTimeout(resolve,250))
  }
  assert.ok(ready,'Production server failed to start')
  for(const path of ['/academy','/battle','/multiplayer','/multiplayer/arena','/locker','/locker/crates','/profile','/training'])
   assert.equal((await fetch(origin+path)).status,200,path)
  assert.equal((await fetch(origin+'/api/progression')).status,405)
  const anonymous=await fetch(origin+'/api/progression',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'pvp',winner_id:'forged',xp:999999})})
  assert.equal(anonymous.status,401)
  assert.equal(anonymous.headers.get('Cache-Control'),'no-store')
  const missingConfig=await fetch(origin+'/api/progression',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer invalid-test-token'},body:JSON.stringify({action:'import',profile:{xp:999999}})})
  assert.equal(missingConfig.status,503)
  assert.equal(missingConfig.headers.get('Cache-Control'),'no-store')
  function bundles(dir:string):string[] {
   return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?bundles(join(dir,entry.name)):entry.name.endsWith('.js')?[join(dir,entry.name)]:[])
  }
  for(const file of bundles('.next/static')) assert.equal(readFileSync(file,'utf8').includes('SUPABASE_SERVICE_ROLE_KEY'),false,file)
  console.log('PASS: production pages, POST-only reward endpoint, anonymous 401, missing-key 503, no-store and server-key isolation in browser bundles. Real Supabase JWT/HTTP/RLS tests remain required.')
 } finally {child.kill();await closed}
}
void verify().catch(error=>{console.error(error);process.exitCode=1})
