-- Read-only deployment gate. Run as the database owner after all three migrations.
-- This checks effective privileges (including PUBLIC/inherited/column grants), not just policy names.
DO $$
DECLARE t text; r text; c record; f record;
BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname IN ('anon','authenticated') AND (rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION 'Browser API role bypasses RLS'; END IF;
 FOREACH t IN ARRAY ARRAY['profiles','player_stats','campaign_progress','battle_history','user_cosmetics','player_crates','verified_players','verified_cosmetics','verified_crates','multiplayer_matches','multiplayer_match_events','multiplayer_match_results','multiplayer_queue'] LOOP
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid=('public.'||t)::regclass) THEN RAISE EXCEPTION 'RLS disabled: %',t; END IF;
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF has_table_privilege(r,'public.'||t,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN RAISE EXCEPTION 'Direct write privilege: % / %',r,t; END IF;
   FOR c IN SELECT attname FROM pg_attribute WHERE attrelid=('public.'||t)::regclass AND attnum>0 AND NOT attisdropped LOOP
    IF has_column_privilege(r,'public.'||t,c.attname,'INSERT,REFERENCES') OR
      (has_column_privilege(r,'public.'||t,c.attname,'UPDATE') AND NOT (r='authenticated' AND t='profiles' AND c.attname IN ('username','language','keyboard_settings')))
    THEN RAISE EXCEPTION 'Protected column privilege: % / %.%',r,t,c.attname; END IF;
   END LOOP;
  END LOOP;
 END LOOP;
 IF has_schema_privilege('anon','keyforge_private','USAGE') OR has_schema_privilege('authenticated','keyforge_private','USAGE') THEN RAISE EXCEPTION 'Private schema exposed'; END IF;
 IF has_schema_privilege('anon','public','CREATE') OR has_schema_privilege('authenticated','public','CREATE') THEN RAISE EXCEPTION 'API roles can create public objects'; END IF;
 -- Audit custom invoker RPCs too: an exposed wrapper can alter JWT settings and call a definer.
 -- Extension-owned invoker utilities are inventoried below; extension definers still require review.
 FOR f IN SELECT p.*,n.nspname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','keyforge_private')
  AND (p.prosecdef OR NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')) LOOP
  IF has_function_privilege('anon',f.oid,'EXECUTE') THEN RAISE EXCEPTION 'Anonymous custom/definer RPC: %',f.oid::regprocedure; END IF;
  IF f.prosecdef AND NOT ('search_path=pg_catalog'=ANY(coalesce(f.proconfig,'{}'))) THEN RAISE EXCEPTION 'Unsafe definer search_path: %',f.oid::regprocedure; END IF;
  IF has_function_privilege('authenticated',f.oid,'EXECUTE') AND NOT (f.nspname='public' AND (f.proname,oidvectortypes(f.proargtypes)) IN
    (('get_verified_player',''),('get_verified_cosmetics',''),('equip_verified_skin','text'),('open_verified_crate','text, uuid'),('purchase_verified_crate','text, uuid'),
     ('create_multiplayer_match','text, text, text, bigint, text, integer'),('join_multiplayer_match','text, text'),('set_player_ready','uuid, boolean'),('forfeit_match','uuid'),('cancel_match','uuid'),('find_or_create_quick_match','text, text'),
     ('leave_multiplayer_queue',''),('check_multiplayer_queue',''),('claim_disconnect_forfeit','uuid'),('submit_word_attempts','uuid, text, integer, text[]'),('multiplayer_heartbeat','uuid'),('get_public_player','uuid'),('exit_queue_for_practice','')))
  THEN RAISE EXCEPTION 'Unreviewed authenticated RPC signature: %',f.oid::regprocedure; END IF;
 END LOOP;
 RAISE NOTICE 'Effective privilege audit passed. JWT/Auth, HTTP ownership and Realtime still require staging tests.';
END $$;

SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname IN ('public','keyforge_private') ORDER BY schemaname,tablename,policyname;
SELECT n.nspname,p.oid::regprocedure AS function,p.prosecdef AS security_definer,p.proconfig,
 has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','keyforge_private') ORDER BY n.nspname,p.proname;
