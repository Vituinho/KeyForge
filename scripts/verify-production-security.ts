import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { securityDatabase } from "./security-database"
import { generateMatchWords } from "../src/lib/multiplayer/wordGenerator"
import { getCharacterById } from "../src/data/characters"
import { replayBattle } from "../src/lib/security/battleValidation"
import { calculateBattleRewards } from "../src/lib/progression/calculateBattleRewards"
import { calculateMultiplayerRewards } from "../src/lib/multiplayer/calculateMultiplayerRewards"
import { MultiplayerMatchRow } from "../src/types/database"
import { replayPractice } from "../src/lib/security/practiceValidation"
import { getHomeRowExercises } from "../src/data/academyLessons"
import { calculateAcademyLessonRewards } from "../src/lib/progression/calculateActivityRewards"
async function verify() {
const db=securityDatabase()
const alice="11111111-1111-4111-8111-111111111111",bob="22222222-2222-4222-8222-222222222222",mallory="33333333-3333-4333-8333-333333333333"
let checks=0
const asUser=(user:string,sql:string,role="authenticated")=>db.sql(`SET ROLE ${role}; SET request.jwt.claim.sub='${user}'; ${sql}`)
const value=(user:string,sql:string)=>asUser(user,sql).split(/\r?\n/).at(-1)!
function denied(user:string,sql:string,role="authenticated") {
  assert.throws(()=>asUser(user,sql,role),error=>/42501|P0001|42883|40001/.test(String((error as {stderr?:string}).stderr)));checks++
}
function equal(actual:unknown,expected:unknown){assert.deepEqual(actual,expected);checks++}
try {
 equal(value(alice,"SELECT public.get_verified_player()->>'level'"),"1")
 equal(db.sql(`SELECT level FROM public.profiles WHERE id='${alice}'`),"80")
 equal(db.sql("SELECT count(*) FROM keyforge_private.legacy_snapshots"),"3")
 equal(db.sql(`SELECT snapshot->'profile'->>'xp' FROM keyforge_private.legacy_snapshots WHERE user_id='${alice}'`),"99999")
 for(const table of ["profiles","player_stats","campaign_progress","battle_history","user_cosmetics","player_crates","verified_players","verified_cosmetics","verified_crates","multiplayer_matches","multiplayer_match_events","multiplayer_match_results","multiplayer_queue"]) {
  const column=table==="profiles"?"xp":"user_id"
  for(const role of ["anon","authenticated"]) denied(alice,`DELETE FROM public.${table}`,role)
  if(table==="profiles") denied(alice,`UPDATE public.${table} SET ${column}=999999 WHERE id='${alice}'`)
  const first=db.sql(`SELECT attname FROM pg_attribute WHERE attrelid='public.${table}'::regclass AND attnum>0 AND NOT attisdropped ORDER BY attnum LIMIT 1`)
  denied(alice,`UPDATE public.${table} SET ${first}=${first}`)
  denied(alice,`INSERT INTO public.${table} DEFAULT VALUES`)
 }
 denied(alice,`INSERT INTO public.user_cosmetics(user_id,cosmetic_id) VALUES('${alice}','susanoo_divine')`)
 denied(alice,`UPDATE public.profiles SET forge_shards=100000 WHERE id='${alice}'`)
 denied(alice,`INSERT INTO public.campaign_progress(user_id,world_id,current_stage,completed) VALUES('${alice}','naruto',99,true)`)
 equal(value(alice,`SELECT count(*) FROM public.verified_players WHERE user_id='${bob}'`),"0")
 asUser(alice,`UPDATE public.profiles SET username='Cannot rename Bob' WHERE id='${bob}'`)
 equal(db.sql(`SELECT username FROM public.profiles WHERE id='${bob}'`),"Bob")
 asUser(alice,`UPDATE public.profiles SET language='en' WHERE id='${alice}'`);checks++
 for(const signature of ["public.get_verified_player()","public.get_verified_cosmetics()","public.equip_verified_skin('not_owned')","public.open_verified_crate('basic_crate','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')"]) denied("",`SELECT ${signature}`,"anon")
 denied(alice,"SELECT public.equip_verified_skin('not_owned')")
 denied(alice,`SELECT public.begin_verified_battle('${alice}',0,'{}')`)
 denied(alice,`SELECT public.begin_verified_practice('${alice}','{}')`)
 denied(alice,`SELECT public.commit_verified_reward('${alice}','battle:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,'{}','{}','{}',1000)`)
 denied(alice,`SELECT public.read_verified_battle('${bob}','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')`)
 denied(alice,"SELECT keyforge_private.ensure_player('11111111-1111-4111-8111-111111111111')")
 denied(alice,"SELECT * FROM keyforge_private.legacy_snapshots")
 for(const call of ["public.get_verified_player()","public.get_verified_cosmetics()","public.create_multiplayer_match('private')","public.find_or_create_quick_match()","public.leave_multiplayer_queue()","public.check_multiplayer_queue()"])
  denied('',`SELECT ${call}`)
 for(const language of ["pt-BR","en"] as const) for(const seed of [1,12345,4294967295]) {
  equal(JSON.parse(db.sql(`SELECT to_json(public.verified_match_words(${seed},100,'${language}'))`)),generateMatchWords(seed,100,language))
 }
 const request="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
 const crate=JSON.parse(value(alice,`SELECT public.open_verified_crate('basic_crate','${request}')`))
 equal(JSON.parse(value(alice,`SELECT public.open_verified_crate('basic_crate','${request}')`)),crate)
 equal(value(alice,"SELECT quantity FROM public.verified_crates WHERE crate_id='basic_crate'"),"0")
 denied(alice,`SELECT public.open_verified_crate('shinobi_crate','${request}')`)
 denied(alice,`SELECT public.open_verified_crate('basic_crate','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')`)
 denied(alice,`SELECT public.open_verified_crate('unknown','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')`)
 const purchase="cccccccc-cccc-4ccc-8ccc-cccccccccccc"
 denied(alice,`SELECT public.purchase_verified_crate('basic_crate','${purchase}')`)
 db.sql(`UPDATE public.verified_players SET forge_shards=350 WHERE user_id='${alice}'`)
 const purchased=JSON.parse(value(alice,`SELECT public.purchase_verified_crate('shinobi_crate','${purchase}')`))
 equal(JSON.parse(value(alice,`SELECT public.purchase_verified_crate('shinobi_crate','${purchase}')`)),purchased)
 equal(value(alice,"SELECT forge_shards FROM public.verified_players"),"100")
 equal(value(alice,"SELECT quantity FROM public.verified_crates WHERE crate_id='shinobi_crate'"),"1")
 const race=`SET ROLE authenticated; SET request.jwt.claim.sub='${bob}'; SELECT public.open_verified_crate('basic_crate','dddddddd-dddd-4ddd-8ddd-dddddddddddd')`
 const receipts=await Promise.all([db.sqlAsync(race),db.sqlAsync(race)])
 equal(JSON.parse(receipts[0].split(/\r?\n/).at(-1)!),JSON.parse(receipts[1].split(/\r?\n/).at(-1)!))
 equal(value(bob,"SELECT quantity FROM public.verified_crates WHERE crate_id='basic_crate'"),"0")
 equal(db.sql(`SELECT count(*) FROM keyforge_private.reward_ledger WHERE user_id='${bob}' AND source LIKE 'crate:%'`),"1")
 const match=JSON.parse(value(alice,"SELECT to_json(public.create_multiplayer_match('private','KF-SEC','en',1,'default_forge',10))"))
 denied(alice,"SELECT public.create_multiplayer_match('quick','FAKE-QUICK')")
 equal(match.authority_version,1)
 denied(mallory,`SELECT public.cancel_match('${match.id}')`)
 denied(mallory,`SELECT public.set_player_ready('${match.id}',true)`)
 denied(mallory,`SELECT public.submit_word_attempts('${match.id}','spoof',0,ARRAY['x'])`)
 denied(alice,`UPDATE public.multiplayer_matches SET status='finished',winner_id='${alice}' WHERE id='${match.id}'`)
 denied(alice,`INSERT INTO public.multiplayer_match_events(match_id,player_id,event_id,event_type) VALUES('${match.id}','${alice}','fake','WORD_COMPLETED')`)
 denied(alice,`SELECT public.trigger_ultimate('${match.id}')`)
 denied(alice,`SELECT public.submit_word_completion('${match.id}','fake',0,'x',260,100,1)`)
 asUser(bob,"SELECT public.join_multiplayer_match('KF-SEC','default_forge')")
 asUser(alice,`SELECT public.set_player_ready('${match.id}',true)`)
 asUser(bob,`SELECT public.set_player_ready('${match.id}',true)`)
 // Fixture the clock, never bypass protected operations as the attacker.
 db.sql(`UPDATE public.multiplayer_matches SET started_at=clock_timestamp()-interval '10 seconds',status='playing' WHERE id='${match.id}'`)
 const target=generateMatchWords(Number(match.seed),10,"en")[0]
 const keys=Array.from(target);keys[0]=keys[0]==="x"?"y":"x"
 const attempts=`ARRAY[${keys.map(k=>`'${k}'`).join(",")}]`
 const accepted=JSON.parse(value(alice,`SELECT to_json(public.submit_word_attempts('${match.id}','word-0',0,${attempts}))`))
 equal(accepted.player_1_word_index,1)
 equal(accepted.player_1_accuracy,Math.round((keys.length-1)/keys.length*100))
 equal(db.sql(`SELECT created_at<=clock_timestamp() FROM public.multiplayer_match_events WHERE match_id='${match.id}' AND event_id='word-0'`),"t")
 equal(JSON.parse(value(alice,`SELECT to_json(public.submit_word_attempts('${match.id}','word-0',0,${attempts}))`)),accepted)
 denied(bob,`SELECT public.submit_word_attempts('${match.id}','word-0',0,${attempts})`)
 denied(mallory,`SELECT public.submit_word_attempts('${match.id}','word-0',0,${attempts})`)
 denied(alice,`SELECT public.submit_word_attempts('${match.id}','word-0',0,ARRAY['x'])`)
 denied(alice,`SELECT public.submit_word_attempts('${match.id}','skip',3,ARRAY['x'])`)
 denied(alice,`SELECT public.submit_word_attempts('${match.id}','null',NULL,NULL)`)
 denied(alice,`SELECT public.cancel_match('${match.id}')`)
 denied(alice,`SELECT public.set_player_ready('${match.id}',true)`)
 asUser(alice,`SELECT public.multiplayer_heartbeat('${match.id}')`)
 denied(bob,`SELECT public.claim_disconnect_forfeit('${match.id}')`)
 denied(mallory,`SELECT public.multiplayer_heartbeat('${match.id}')`)
 equal(db.sql(`SELECT count(*) FROM public.multiplayer_match_events WHERE match_id='${match.id}' AND word_index=0`),"1")
 // Exact concurrent retries cannot apply damage or advance twice.
 const retrySql=`SET ROLE authenticated; SET request.jwt.claim.sub='${alice}'; SELECT to_json(public.submit_word_attempts('${match.id}','word-0',0,${attempts}))`
 const duplicateWords=await Promise.all([db.sqlAsync(retrySql),db.sqlAsync(retrySql)])
 equal(JSON.parse(duplicateWords[0].split(/\r?\n/).at(-1)!),JSON.parse(duplicateWords[1].split(/\r?\n/).at(-1)!))
 const words=generateMatchWords(Number(match.seed),10,'en')
 let typedAttempts=keys.length,correctAttempts=keys.length-1
 for(let index=1;index<=4;index++) {
  db.sql(`UPDATE public.multiplayer_match_events SET created_at=least(created_at,clock_timestamp()-interval '1 second') WHERE match_id='${match.id}'`)
  const roundKeys=index===1 ? ['x','Backspace',...Array.from(words[index])] : Array.from(words[index])
  if(index===2) {roundKeys[0]='x';roundKeys[roundKeys.length-1]=roundKeys[roundKeys.length-1]==='x'?'y':'x'}
  typedAttempts+=Array.from(words[index]).length+(index===1?1:0)
  correctAttempts+=Array.from(words[index]).length-(index===2?2:0)
  const list=`ARRAY[${roundKeys.map(k=>`'${k}'`).join(',')}]`
  const current=JSON.parse(value(alice,`SELECT to_json(public.submit_word_attempts('${match.id}','word-${index}',${index},${list}))`))
  equal(current.player_1_word_index,index+1)
  equal(current.player_1_accuracy,Math.round(correctAttempts/typedAttempts*100))
  if(index===1) equal(db.sql(`SELECT payload->>'errors' FROM public.multiplayer_match_events WHERE match_id='${match.id}' AND event_id='word-1'`),'1')
 }
 asUser(bob,`SELECT public.forfeit_match('${match.id}')`)
 denied(alice,`SELECT public.set_player_ready('${match.id}',true)`)
 denied(mallory,`SELECT public.forfeit_match('${match.id}')`)
 // Pre-hardening outcomes are never promoted into verified rewards, even by the reward RPC.
 const currentProfile=JSON.parse(value(alice,"SELECT public.get_verified_player()"))
 const literal=(v:unknown)=>`'${JSON.stringify(v).replaceAll("'","''")}'::jsonb`
 db.sql(`UPDATE public.multiplayer_matches SET authority_version=0 WHERE id='${match.id}'`)
 denied(alice,`SELECT public.commit_verified_reward('${alice}','pvp:${match.id}',0,${literal(currentProfile)},'{}','{}',0)`,"service_role")
 db.sql(`UPDATE public.multiplayer_matches SET authority_version=1 WHERE id='${match.id}'`)
 // Database-backed atomic campaign reward with an actual replay-derived receipt.
 const issuedEnemy={...getCharacterById('naruto')!,maxHp:1,attack:1,attackInterval:60000,mechanics:[]}
 const challenge={enemy:issuedEnemy,texts:['computer'],language:'en' as const}
 const result=replayBattle(challenge,Array.from('computer').map((key,i)=>({key,at:100+i*200})),3000)
 const summary=calculateBattleRewards(result,issuedEnemy,currentProfile)
 const receipt={summary,result}
 const session=JSON.parse(asUser(alice,`SELECT public.begin_verified_battle('${alice}',0,${literal(challenge)})`,"service_role").split(/\r?\n/).at(-1)!)
 const source='battle:'+session.id
 // If any inventory grant fails, profile, session, history and ledger all roll back.
 denied(alice,`SELECT public.commit_verified_reward('${alice}','${source}',0,${literal(summary.updatedProfile)},${literal(receipt)},'{"unknown":1}',0)`,"service_role")
 equal(value(alice,"SELECT profile->>'totalXp' FROM public.verified_players"),"0")
 equal(db.sql(`SELECT finished FROM keyforge_private.battle_sessions WHERE id='${session.id}'`),"f")
 equal(db.sql(`SELECT count(*) FROM public.battle_history WHERE reward_source='${source}'`),"0")
 const commitSql=`SET ROLE service_role; SET request.jwt.claim.sub='${alice}'; SELECT public.commit_verified_reward('${alice}','${source}',0,${literal(summary.updatedProfile)},${literal(receipt)},'{"basic_crate":1}',0)`
 const committed=await Promise.all([db.sqlAsync(commitSql),db.sqlAsync(commitSql)])
 equal(JSON.parse(committed[0].split(/\r?\n/).at(-1)!),JSON.parse(JSON.stringify(receipt)))
 equal(JSON.parse(committed[1].split(/\r?\n/).at(-1)!),JSON.parse(JSON.stringify(receipt)))
 equal(value(alice,"SELECT profile->>'totalXp' FROM public.verified_players"),String(summary.xpResult.totalXp))
 equal(db.sql(`SELECT count(*) FROM public.battle_history WHERE reward_source='${source}'`),"1")
 equal(value(alice,"SELECT quantity FROM public.verified_crates WHERE crate_id='basic_crate'"),"1")
 equal(db.sql(`SELECT count(*) FROM keyforge_private.reward_ledger WHERE source='${source}'`),"1")
 const finalMatch=JSON.parse(value(alice,`SELECT to_json(m) FROM public.multiplayer_matches m WHERE id='${match.id}'`)) as MultiplayerMatchRow
 const current=JSON.parse(value(alice,'SELECT public.get_verified_player()'))
 const mpSummary=calculateMultiplayerRewards(finalMatch,alice,finalMatch.player_1_wpm,finalMatch.player_1_accuracy,finalMatch.player_1_combo,current,()=>0.95)!
 assert.ok(mpSummary);checks++
 const mpReceipt={summary:mpSummary}
 const mpCommit=`SET ROLE service_role; SELECT public.commit_verified_reward('${alice}','pvp:${match.id}',1,${literal(mpSummary.updatedProfile)},${literal(mpReceipt)},'{}',${mpSummary.shardsAwarded})`
 const mpClaims=await Promise.all([db.sqlAsync(mpCommit),db.sqlAsync(mpCommit)])
 equal(JSON.parse(mpClaims[0].split(/\r?\n/).at(-1)!),JSON.parse(JSON.stringify(mpReceipt)))
 equal(JSON.parse(mpClaims[1].split(/\r?\n/).at(-1)!),JSON.parse(JSON.stringify(mpReceipt)))
 equal(value(alice,"SELECT profile->>'totalXp' FROM public.verified_players"),String(mpSummary.updatedProfile.totalXp))
 equal(value(alice,"SELECT forge_shards FROM public.verified_players"),String(100+mpSummary.shardsAwarded))
 equal(db.sql(`SELECT player_1_xp_earned FROM public.multiplayer_match_results WHERE match_id='${match.id}'`),String(mpSummary.totalXp))
 // A stale account version cannot overwrite an intervening legitimate reward.
 denied(alice,`SELECT public.begin_verified_battle('${alice}',0,${literal(challenge)})`,"service_role")
 // Practice and campaign receipts cannot be exchanged, and practice completion is idempotent.
 const practiceChallenge={kind:'home-row' as const,layout:'ANSI' as const,language:'en' as const}
 const practiceSession=JSON.parse(asUser(alice,`SELECT public.begin_verified_practice('${alice}',${literal(practiceChallenge)})`,'service_role').split(/\r?\n/).at(-1)!)
 let at=0
 const rounds=getHomeRowExercises('en').map(text=>({text,events:Array.from(text).map(key=>({key,at:at+=200}))}))
 const practiceReplay=replayPractice(practiceChallenge,rounds,at+500)
 const practiceReward=calculateAcademyLessonRewards(practiceReplay.lessonId!,practiceReplay.stats,mpSummary.updatedProfile)
 const practiceReceipt={summary:practiceReward}
 const practiceSource='practice:'+practiceSession.id
 denied(alice,`SELECT public.commit_verified_reward('${alice}','battle:${practiceSession.id}',2,${literal(practiceReward.updatedProfile)},${literal(practiceReceipt)},'{}',0)`,'service_role')
 denied(alice,`SELECT public.commit_verified_reward('${bob}','${practiceSource}',0,${literal(practiceReward.updatedProfile)},${literal(practiceReceipt)},'{}',0)`,'service_role')
 const practiceCommit=`SET ROLE service_role; SELECT public.commit_verified_reward('${alice}','${practiceSource}',2,${literal(practiceReward.updatedProfile)},${literal(practiceReceipt)},'{}',0)`
 const practiceClaims=await Promise.all([db.sqlAsync(practiceCommit),db.sqlAsync(practiceCommit)])
 for(const claim of practiceClaims) equal(JSON.parse(claim.split(/\r?\n/).at(-1)!),JSON.parse(JSON.stringify(practiceReceipt)))
 equal(value(alice,"SELECT profile->'stats'->>'academyLessonsCompleted' FROM public.verified_players"),'1')
 equal(db.sql(`SELECT count(*) FROM keyforge_private.reward_ledger WHERE source='${practiceSource}'`),'1')
 equal(db.sql(`SELECT count(*) FROM public.battle_history WHERE reward_source='${practiceSource}'`),'0')
 // Real queue matching, concurrent retries and the bot timeout share one atomic decision.
 equal(JSON.parse(value(bob,"SELECT public.find_or_create_quick_match('en','default_forge')")).status,'searching')
 const quick=JSON.parse(value(mallory,"SELECT public.find_or_create_quick_match('en','default_forge')"))
 equal(quick.status,'matched')
 equal(value(bob,'SELECT public.exit_queue_for_practice()'),quick.match_id)
 const quickRetry=`SET ROLE authenticated; SET request.jwt.claim.sub='${bob}'; SELECT public.find_or_create_quick_match('en','default_forge')`
 const queueRetries=await Promise.all([db.sqlAsync(quickRetry),db.sqlAsync(quickRetry)])
 for(const q of queueRetries) equal(JSON.parse(q.split(/\r?\n/).at(-1)!).match_id,quick.match_id)
 equal(db.sql("SELECT count(*) FROM public.multiplayer_matches WHERE mode='quick'"),'1')
 equal(db.sql(`SELECT (profile->>'level')::integer=(SELECT level FROM public.multiplayer_queue WHERE user_id='${bob}') FROM public.verified_players WHERE user_id='${bob}'`),'t')
 denied('',"SELECT public.exit_queue_for_practice()")
 asUser(alice,"SELECT public.find_or_create_quick_match('pt-BR','default_forge')")
 equal(value(alice,'SELECT public.exit_queue_for_practice() IS NULL'),'t')
 equal(value(alice,"SELECT count(*) FROM public.multiplayer_queue WHERE user_id=auth.uid()"),'0')
 // Privilege audit covers all shipped/new SECURITY DEFINER functions, not just named attacks.
 equal(db.sql("SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','keyforge_private') AND p.prosecdef AND has_function_privilege('anon',p.oid,'EXECUTE')"),"0")
 equal(db.sql("SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','keyforge_private') AND p.prosecdef AND NOT ('search_path=pg_catalog'=ANY(coalesce(p.proconfig,'{}')))"),"0")
 const audit=readFileSync('supabase/audits/verify_security_boundaries.sql','utf8')
 db.sql(audit);checks++
 db.sql("CREATE FUNCTION public.audit_test_unsafe() RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path=public AS 'SELECT 1'; GRANT EXECUTE ON FUNCTION public.audit_test_unsafe() TO anon")
 denied('',audit,'postgres')
 db.sql('DROP FUNCTION public.audit_test_unsafe()')
 db.sql("CREATE FUNCTION public.audit_test_unknown() RETURNS integer LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS 'SELECT 1'; GRANT EXECUTE ON FUNCTION public.audit_test_unknown() TO authenticated")
 denied('',audit,'postgres')
 db.sql('DROP FUNCTION public.audit_test_unknown()')
 console.log(`PASS: ${checks} real PostgreSQL security checks (roles, RLS, RPCs, legacy, crate replay, PvP telemetry/replay).`)
} finally {db.close()}
}
void verify().catch(error=>{console.error(error);process.exitCode=1})
