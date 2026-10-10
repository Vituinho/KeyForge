/** Preserve the shipped damage/energy formulas while closing the old RPC entry points. */
import { readFileSync, writeFileSync } from "node:fs"
const original = readFileSync("supabase/multiplayer_schema.sql", "utf8")
const source = readFileSync("src/lib/multiplayer/wordGenerator.ts", "utf8")
const dict = (name: string) => {
  const body = source.split(`const ${name} = {`)[1].split("\n}")[0]
  return Object.fromEntries(["short","medium","long"].map(tier => [tier, [...body.split(`${tier}: [`)[1].split("]")[0].matchAll(/"([^"]+)"/g)].map(m=>m[1])]))
}
let sql = "-- Generated from the shipped RPCs; regenerate only after reviewing the diff.\nBEGIN;\n"
for (const match of original.matchAll(/CREATE OR REPLACE FUNCTION public\.(\w+)\([\s\S]*?\$\$;/g)) {
  const name = match[1]
  let fn = match[0].replace("SET search_path = public", "SET search_path = pg_catalog")
    .replaceAll("TIMEZONE('utc', NOW())", "clock_timestamp()")
    .replaceAll("v_match.player_2_id <> v_user_id", "v_match.player_2_id IS DISTINCT FROM v_user_id")
    .replace("v_match.player_2_id <> v_caller_id", "v_match.player_2_id IS DISTINCT FROM v_caller_id")
  // Check membership BEFORE status/idempotency checks, including finished matches.
  if (fn.includes("IF NOT FOUND THEN") && fn.includes("p_match_id")) {
    const who = fn.includes("v_caller_id UUID") ? "v_caller_id" : "v_user_id"
    fn = fn.replace(/IF NOT FOUND THEN\s+RAISE EXCEPTION 'Match not found';\s+END IF;/, block => `${block}\n  IF v_match.player_1_id IS DISTINCT FROM ${who} AND v_match.player_2_id IS DISTINCT FROM ${who} THEN\n    RAISE EXCEPTION 'User not a participant' USING ERRCODE='42501';\n  END IF;`)
  }
  if (name === "submit_word_completion") {
    fn = fn.replace("public.submit_word_completion(", "keyforge_private.resolve_word_damage(")
    // This helper is not callable by any API role. The new entry point locks/authenticates first.
  }
  if (["create_multiplayer_match","join_multiplayer_match","find_or_create_quick_match"].includes(name)) {
    const who = name === "find_or_create_quick_match" ? "v_caller_id" : "v_user_id"
    fn = fn.replace("BEGIN\n", `BEGIN\n  IF ${who} IS NULL OR NOT EXISTS(SELECT 1 FROM public.verified_cosmetics WHERE user_id=${who} AND cosmetic_id=p_skin_id) THEN RAISE EXCEPTION 'Authentication and owned skin required' USING ERRCODE='42501'; END IF;\n`)
    // CRLF source: normalize first below; also handle the actual line endings.
    if (!fn.includes("owned skin required")) fn=fn.replace("BEGIN\r\n", `BEGIN\n  IF ${who} IS NULL OR NOT EXISTS(SELECT 1 FROM public.verified_cosmetics WHERE user_id=${who} AND cosmetic_id=p_skin_id) THEN RAISE EXCEPTION 'Authentication and owned skin required' USING ERRCODE='42501'; END IF;\n`)
  }
  if (name === "create_multiplayer_match") {
    fn=fn.replace(/\n    p_seed,/, "\n    floor(random()*4294967296)::bigint,")
    fn=fn.replace(/BEGIN\r?\n/, "BEGIN\n  IF p_mode IS DISTINCT FROM 'private' THEN RAISE EXCEPTION 'Quick matches must use the authoritative queue'; END IF;\n")
  }
  if (name === "set_player_ready") fn=fn.replace("  IF v_match.player_1_id = v_user_id THEN", `  IF v_match.status='countdown' AND (CASE WHEN v_match.player_1_id=v_user_id THEN v_match.player_1_ready ELSE v_match.player_2_ready END) IS NOT DISTINCT FROM p_ready THEN RETURN v_match; END IF;
  IF v_match.status NOT IN ('waiting','ready') THEN RAISE EXCEPTION 'Readiness cannot restart an active or resolved match'; END IF;
  IF v_match.player_1_id = v_user_id THEN`)
  if (name === "cancel_match") fn=fn.replace("  UPDATE public.multiplayer_matches", "  IF v_match.status='playing' THEN RAISE EXCEPTION 'Active matches require forfeit'; END IF;\n  UPDATE public.multiplayer_matches")
  if (name === "forfeit_match" || name === "claim_disconnect_forfeit") fn=fn.replace("  UPDATE public.multiplayer_matches", "  IF v_match.started_at IS NULL OR v_match.player_2_id IS NULL OR v_match.status NOT IN ('playing','countdown') THEN RAISE EXCEPTION 'Match has not started'; END IF;\n  UPDATE public.multiplayer_matches")
  if (name === "claim_disconnect_forfeit") fn=fn.replace("'DISCONNECT_FORFEIT'", "'FORFEIT'")
  if (name === "leave_multiplayer_queue" || name === "check_multiplayer_queue") fn=fn.replace(/BEGIN\r?\n/, "BEGIN\n  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;\n")
  if (name === "leave_multiplayer_queue") fn=fn.replace(/BEGIN\r?\n/, "BEGIN\n  PERFORM pg_advisory_xact_lock(68473211);\n")
  if (name === "find_or_create_quick_match") {
    fn=fn.replace(/BEGIN\r?\n/, `BEGIN
  PERFORM pg_advisory_xact_lock(68473211);
  SELECT m.* INTO v_new_match FROM public.multiplayer_queue q JOIN public.multiplayer_matches m ON m.id=q.matched_match_id
   WHERE q.user_id=v_caller_id AND q.status='matched' AND m.status IN ('countdown','playing');
  IF FOUND THEN RETURN jsonb_build_object('status','matched','match_id',v_new_match.id); END IF;
`)
    fn=fn.replace(/SELECT username, level, rank INTO v_caller_username, v_caller_level, v_caller_rank\s+FROM public.profiles WHERE id = v_caller_id;/, "SELECT p.username, (v.profile->>'level')::integer, v.profile->>'rank' INTO v_caller_username,v_caller_level,v_caller_rank FROM public.profiles p JOIN public.verified_players v ON v.user_id=p.id WHERE p.id=v_caller_id;")
    fn=fn.replace("AND user_id <> v_caller_id", "AND user_id <> v_caller_id\n    AND language=p_language")
  }
  sql += fn + "\n\n"
}
sql+=`-- Mark only newly created matches. Existing legacy matches retain authority_version=0.
ALTER TABLE public.multiplayer_matches ALTER COLUMN authority_version SET DEFAULT 1;
ALTER TABLE public.multiplayer_matches ALTER COLUMN player_1_last_active_at SET DEFAULT clock_timestamp();
ALTER TABLE public.multiplayer_matches ALTER COLUMN created_at SET DEFAULT clock_timestamp();
ALTER TABLE public.multiplayer_matches ALTER COLUMN updated_at SET DEFAULT clock_timestamp();
ALTER TABLE public.multiplayer_match_events ALTER COLUMN created_at SET DEFAULT clock_timestamp();
ALTER TABLE public.multiplayer_match_results ALTER COLUMN created_at SET DEFAULT clock_timestamp();
ALTER TABLE public.multiplayer_queue ALTER COLUMN queued_at SET DEFAULT clock_timestamp();
ALTER TABLE public.multiplayer_queue ALTER COLUMN updated_at SET DEFAULT clock_timestamp();
DROP FUNCTION public.submit_word_completion(uuid,text,integer,text,integer,integer,integer);
REVOKE EXECUTE ON FUNCTION public.trigger_ultimate(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA keyforge_private FROM PUBLIC, anon, authenticated;

CREATE FUNCTION keyforge_private.mulberry_step(a bigint) RETURNS numeric[]
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE t bigint; b bigint; BEGIN
 a:=(a+1831565813)&4294967295;
 t:=mod((a # (a>>15))::numeric*(a|1)::numeric,4294967296)::bigint;
 b:=mod((t # (t>>7))::numeric*(t|61)::numeric,4294967296)::bigint;
 t:=t # ((t+b)&4294967295);
 RETURN ARRAY[a::numeric,((t # (t>>14))&4294967295)::numeric/4294967296];
END $$;
CREATE FUNCTION public.verified_match_words(p_seed bigint,p_count integer,p_language text) RETURNS text[]
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE d jsonb; a bigint:=p_seed&4294967295; step numeric[]; pool jsonb; idx integer; chosen text; last_word text:=''; words text[]:='{}';
BEGIN
 IF p_count<1 OR p_count>100 OR p_language NOT IN ('en','pt-BR') THEN RAISE EXCEPTION 'Invalid word configuration'; END IF;
 d:=CASE WHEN p_language='en' THEN '${JSON.stringify(dict("WORDS_EN"))}'::jsonb ELSE '${JSON.stringify(dict("WORDS_PT_BR"))}'::jsonb END;
 FOR i IN 1..p_count LOOP
  step:=keyforge_private.mulberry_step(a); a:=step[1]::bigint;
  pool:=d->CASE WHEN step[2]<0.35 THEN 'short' WHEN step[2]<0.8 THEN 'medium' ELSE 'long' END;
  step:=keyforge_private.mulberry_step(a); a:=step[1]::bigint; idx:=floor(step[2]*jsonb_array_length(pool));
  chosen:=pool->>idx;
  IF chosen=last_word THEN chosen:=pool->>((idx+1)%jsonb_array_length(pool)); END IF;
  words:=array_append(words,chosen); last_word:=chosen;
 END LOOP;
 RETURN words;
END $$;
-- Called inside SECURITY DEFINER submit_word_attempts; no external access to PRNG helpers.
REVOKE ALL ON FUNCTION public.verified_match_words(bigint,integer,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verified_match_words(bigint,integer,text) TO service_role;

CREATE FUNCTION public.submit_word_attempts(p_match_id uuid,p_event_id text,p_word_index integer,p_attempts text[]) RETURNS public.multiplayer_matches
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=auth.uid(); m public.multiplayer_matches; e public.multiplayer_match_events; target text; typed text[]:='{}';
 key text; pos integer:=0; correct integer:=0; attempts integer:=0; errors integer:=0; combo integer; total_correct integer; total_attempts integer; acc integer; speed integer; elapsed numeric; last_time timestamptz;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_event_id IS NULL OR length(p_event_id) NOT BETWEEN 1 AND 100 OR p_word_index IS NULL OR p_attempts IS NULL OR cardinality(p_attempts) NOT BETWEEN 1 AND 256 OR array_position(p_attempts,NULL) IS NOT NULL THEN RAISE EXCEPTION 'Invalid event'; END IF;
 SELECT * INTO STRICT m FROM public.multiplayer_matches WHERE id=p_match_id FOR UPDATE;
 IF m.player_1_id IS DISTINCT FROM u AND m.player_2_id IS DISTINCT FROM u THEN RAISE EXCEPTION 'Not a participant' USING ERRCODE='42501'; END IF;
 IF m.authority_version<>1 THEN RAISE EXCEPTION 'Legacy match is unverified'; END IF;
 SELECT * INTO e FROM public.multiplayer_match_events WHERE match_id=p_match_id AND event_id=p_event_id;
 IF FOUND THEN
  IF e.player_id<>u OR e.word_index IS DISTINCT FROM p_word_index OR e.payload->'attempts' IS DISTINCT FROM to_jsonb(p_attempts) THEN RAISE EXCEPTION 'Replayed event with different payload'; END IF;
  RETURN m;
 END IF;
 IF p_word_index<>(CASE WHEN m.player_1_id=u THEN m.player_1_word_index ELSE m.player_2_word_index END) OR p_word_index>=m.word_count THEN RAISE EXCEPTION 'Out of sequence'; END IF;
 IF m.started_at IS NULL OR clock_timestamp()<m.started_at OR m.player_2_id IS NULL OR m.status NOT IN ('playing','countdown') THEN RAISE EXCEPTION 'Match not active'; END IF;
 target:=(public.verified_match_words(m.seed,m.word_count,m.language))[p_word_index+1];
 combo:=CASE WHEN m.player_1_id=u THEN m.player_1_combo ELSE m.player_2_combo END;
 FOREACH key IN ARRAY p_attempts LOOP
  IF pos=length(target) THEN RAISE EXCEPTION 'Attempts after completed word'; END IF;
  IF key='Backspace' THEN
   IF pos>0 THEN
    IF typed[pos]=substr(target,pos,1) THEN correct:=correct-1; END IF;
    typed:=typed[1:pos-1]; pos:=pos-1;
   END IF;
  ELSE
   IF length(key)<>1 THEN RAISE EXCEPTION 'Invalid character'; END IF;
   attempts:=attempts+1; pos:=pos+1; typed:=array_append(typed,key);
   IF key=substr(target,pos,1) THEN correct:=correct+1; ELSE errors:=errors+1; combo:=0; END IF;
  END IF;
 END LOOP;
 IF pos<>length(target) THEN RAISE EXCEPTION 'Incomplete word'; END IF;
 combo:=combo+1;
 SELECT coalesce(sum((payload->>'correct')::integer),0)+correct,coalesce(sum((payload->>'total_attempts')::integer),0)+attempts,max(created_at)
 INTO total_correct,total_attempts,last_time FROM public.multiplayer_match_events WHERE match_id=p_match_id AND player_id=u AND word_index IS NOT NULL;
 elapsed:=extract(epoch FROM (clock_timestamp()-m.started_at));
 IF attempts/ greatest(0.001,extract(epoch FROM (clock_timestamp()-coalesce(last_time,m.started_at))))>26 THEN RAISE EXCEPTION 'Implausible event rate'; END IF;
 speed:=round(total_correct*12/greatest(3,elapsed));
 IF speed>260 THEN RAISE EXCEPTION 'Implausible typing speed'; END IF;
 acc:=round(total_correct*100.0/greatest(1,total_attempts));
 m:=keyforge_private.resolve_word_damage(p_match_id,p_event_id,p_word_index,target,speed,acc,combo);
 UPDATE public.multiplayer_match_events SET payload=payload||jsonb_build_object('attempts',to_jsonb(p_attempts),'correct',correct,'total_attempts',attempts,'errors',errors)
 WHERE match_id=p_match_id AND event_id=p_event_id;
 RETURN m;
END $$;
CREATE FUNCTION public.multiplayer_heartbeat(p_match_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=auth.uid(); BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 UPDATE public.multiplayer_matches SET player_1_last_active_at=CASE WHEN player_1_id=u THEN clock_timestamp() ELSE player_1_last_active_at END,
 status=CASE WHEN status='countdown' AND started_at<=clock_timestamp() THEN 'playing' ELSE status END,
 player_2_last_active_at=CASE WHEN player_2_id=u THEN clock_timestamp() ELSE player_2_last_active_at END
 WHERE id=p_match_id AND status IN ('playing','countdown') AND (player_1_id=u OR player_2_id=u);
 IF NOT FOUND THEN RAISE EXCEPTION 'Active participant required' USING ERRCODE='42501'; END IF;
END $$;
CREATE FUNCTION public.exit_queue_for_practice() RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=auth.uid(); matched uuid; BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(68473211);
 SELECT matched_match_id INTO matched FROM public.multiplayer_queue WHERE user_id=u AND status='matched';
 IF matched IS NOT NULL THEN RETURN matched; END IF;
 DELETE FROM public.multiplayer_queue WHERE user_id=u;
 RETURN NULL;
END $$;
CREATE FUNCTION public.get_public_player(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE result jsonb; BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('id',p.id,'username',p.username,'level',v.profile->'level','rank',v.profile->'rank') INTO result
 FROM public.profiles p JOIN public.verified_players v ON v.user_id=p.id WHERE p.id=p_user_id;
 RETURN result;
END $$;
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p WHERE p.oid IN
 ('public.create_multiplayer_match(text,text,text,bigint,text,integer)'::regprocedure,'public.join_multiplayer_match(text,text)'::regprocedure,
  'public.set_player_ready(uuid,boolean)'::regprocedure,'public.forfeit_match(uuid)'::regprocedure,'public.cancel_match(uuid)'::regprocedure,
  'public.find_or_create_quick_match(text,text)'::regprocedure,'public.leave_multiplayer_queue()'::regprocedure,'public.check_multiplayer_queue()'::regprocedure,
  'public.claim_disconnect_forfeit(uuid)'::regprocedure,'public.submit_word_attempts(uuid,text,integer,text[])'::regprocedure,
  'public.multiplayer_heartbeat(uuid)'::regprocedure,'public.get_public_player(uuid)'::regprocedure,'public.exit_queue_for_practice()'::regprocedure) LOOP
  EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.signature);
 END LOOP;
END $$;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA keyforge_private FROM PUBLIC, anon, authenticated;
COMMIT;
`
writeFileSync("supabase/migrations/202610100003_validated_multiplayer.sql",sql)
