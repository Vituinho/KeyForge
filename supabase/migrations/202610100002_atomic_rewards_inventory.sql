BEGIN;
-- All inventory mutations serialize on the verified account, including different crate tiers.
DROP FUNCTION public.open_player_crate(text);
CREATE FUNCTION public.open_verified_crate(p_crate_id text, p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=auth.uid(); source_key text; receipt jsonb; c jsonb; skin jsonb;
 total numeric; pick numeric; threshold numeric:=0; rarity text; weight jsonb; dup boolean; shards integer; remaining integer;
BEGIN
 IF u IS NULL OR p_request_id IS NULL THEN RAISE EXCEPTION 'Authentication and request ID required' USING ERRCODE='42501'; END IF;
 source_key:='crate:'||p_request_id;
 PERFORM 1 FROM public.verified_players WHERE user_id=u FOR UPDATE;
 SELECT l.receipt INTO receipt FROM keyforge_private.reward_ledger l WHERE user_id=u AND source=source_key;
 IF receipt IS NOT NULL THEN
  IF receipt->>'crate_id' IS DISTINCT FROM p_crate_id THEN RAISE EXCEPTION 'Request ID reused for different crate'; END IF;
  RETURN receipt;
 END IF;
 SELECT definition INTO c FROM keyforge_private.crate_catalog WHERE id=p_crate_id;
 IF c IS NULL THEN RAISE EXCEPTION 'Unknown crate'; END IF;
 UPDATE public.verified_crates SET quantity=quantity-1 WHERE user_id=u AND crate_id=p_crate_id AND quantity>0 RETURNING quantity INTO remaining;
 IF remaining IS NULL THEN RAISE EXCEPTION 'No crates available'; END IF;
 SELECT sum((w->>'weight')::numeric) INTO total FROM jsonb_array_elements(c->'dropWeights') w;
 pick:=random()*total;
 FOR weight IN SELECT * FROM jsonb_array_elements(c->'dropWeights') LOOP
  threshold:=threshold+(weight->>'weight')::numeric;
  IF pick<threshold THEN rarity:=weight->>'rarity'; EXIT; END IF;
 END LOOP;
 -- Same unowned-first rarity pool and salvage values as data/crates.ts.
 SELECT s.definition INTO skin FROM keyforge_private.skin_catalog s WHERE s.definition->>'rarity'=rarity
 ORDER BY EXISTS(SELECT 1 FROM public.verified_cosmetics o WHERE o.user_id=u AND o.cosmetic_id=s.id), random() LIMIT 1;
 IF skin IS NULL THEN RAISE EXCEPTION 'Empty drop pool'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.verified_cosmetics WHERE user_id=u AND cosmetic_id=skin->>'id') INTO dup;
 shards:=CASE WHEN dup THEN (skin->>'shardsValue')::integer ELSE 0 END;
 INSERT INTO public.verified_cosmetics VALUES(u,skin->>'id') ON CONFLICT DO NOTHING;
 UPDATE public.verified_players SET forge_shards=forge_shards+shards WHERE user_id=u;
 receipt:=jsonb_build_object('success',true,'crate_id',p_crate_id,'skin_id',skin->>'id','is_duplicate',dup,'shards_awarded',shards,
  'remaining_crates',remaining,'new_shards_balance',(SELECT forge_shards FROM public.verified_players WHERE user_id=u));
 INSERT INTO keyforge_private.reward_ledger VALUES(u,source_key,receipt,now());
 RETURN receipt;
END $$;

CREATE FUNCTION public.get_verified_cosmetics() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=auth.uid(); result jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('equippedSkinId',equipped_skin,'forgeShards',forge_shards,'updatedAt',now(),
 'unlockedSkinIds',(SELECT jsonb_agg(cosmetic_id ORDER BY cosmetic_id) FROM public.verified_cosmetics WHERE user_id=u),
 'crates',(SELECT coalesce(jsonb_object_agg(crate_id,quantity),'{}') FROM public.verified_crates WHERE user_id=u))
 INTO result FROM public.verified_players WHERE user_id=u;
 RETURN result;
END $$;
CREATE FUNCTION public.equip_verified_skin(p_skin_id text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=auth.uid(); BEGIN
 IF u IS NULL OR NOT EXISTS(SELECT 1 FROM public.verified_cosmetics WHERE user_id=u AND cosmetic_id=p_skin_id)
 THEN RAISE EXCEPTION 'Skin not owned' USING ERRCODE='42501'; END IF;
 UPDATE public.verified_players SET equipped_skin=p_skin_id WHERE user_id=u;
END $$;

CREATE FUNCTION public.purchase_verified_crate(p_crate_id text,p_request_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid:=auth.uid(); r jsonb; cost integer; source_key text:='purchase:'||p_request_id;
BEGIN
 IF u IS NULL OR p_request_id IS NULL THEN RAISE EXCEPTION 'Authentication and request ID required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.verified_players WHERE user_id=u FOR UPDATE;
 SELECT receipt INTO r FROM keyforge_private.reward_ledger WHERE user_id=u AND source=source_key;
 IF r IS NOT NULL THEN
  IF r->>'crate_id' IS DISTINCT FROM p_crate_id THEN RAISE EXCEPTION 'Request reused'; END IF;
  RETURN r;
 END IF;
 SELECT (definition->>'costShards')::integer INTO cost FROM keyforge_private.crate_catalog WHERE id=p_crate_id;
 IF cost IS NULL THEN RAISE EXCEPTION 'Unknown crate'; END IF;
 UPDATE public.verified_players SET forge_shards=forge_shards-cost WHERE user_id=u AND forge_shards>=cost;
 IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient shards'; END IF;
 INSERT INTO public.verified_crates VALUES(u,p_crate_id,1) ON CONFLICT(user_id,crate_id) DO UPDATE SET quantity=public.verified_crates.quantity+1;
 r:=jsonb_build_object('success',true,'crate_id',p_crate_id);
 INSERT INTO keyforge_private.reward_ledger VALUES(u,source_key,r,now());
 RETURN r;
END $$;

-- Service-only persistence: the Next.js server validates the challenge and computes this receipt.
-- The version comparison forces a concurrent winner to reload and recompute; nothing is lost.
CREATE FUNCTION public.commit_verified_reward(p_user uuid, p_source text, p_version bigint, p_profile jsonb, p_receipt jsonb, p_crates jsonb, p_shards integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v bigint; r jsonb; item record; m public.multiplayer_matches; session_id uuid;
BEGIN
 SELECT version INTO STRICT v FROM public.verified_players WHERE user_id=p_user FOR UPDATE;
 SELECT receipt INTO r FROM keyforge_private.reward_ledger WHERE user_id=p_user AND source=p_source;
 IF r IS NOT NULL THEN RETURN r; END IF;
 IF v<>p_version THEN RAISE EXCEPTION 'Progression changed; recompute' USING ERRCODE='40001'; END IF;
 IF p_profile->>'id' IS DISTINCT FROM p_user::text OR p_shards<0 THEN RAISE EXCEPTION 'Invalid reward'; END IF;
 IF p_source LIKE 'battle:%' THEN
  session_id:=substr(p_source,8)::uuid;
  PERFORM 1 FROM keyforge_private.battle_sessions WHERE id=session_id AND user_id=p_user AND NOT finished AND expires_at>clock_timestamp() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid battle session'; END IF;
  UPDATE keyforge_private.battle_sessions SET finished=true WHERE id=session_id;
 ELSIF p_source LIKE 'pvp:%' THEN
  SELECT * INTO STRICT m FROM public.multiplayer_matches WHERE id=substr(p_source,5)::uuid FOR UPDATE;
  IF m.status<>'finished' OR m.authority_version<>1 OR NOT (m.player_1_id=p_user OR m.player_2_id IS NOT DISTINCT FROM p_user)
   OR NOT EXISTS(SELECT 1 FROM public.multiplayer_match_results WHERE match_id=m.id)
  THEN RAISE EXCEPTION 'Unverified match result'; END IF;
 ELSE RAISE EXCEPTION 'Unknown reward source'; END IF;
 UPDATE public.verified_players SET profile=p_profile,version=version+1,forge_shards=forge_shards+p_shards WHERE user_id=p_user;
 FOR item IN SELECT * FROM jsonb_each_text(p_crates) LOOP
  IF NOT EXISTS(SELECT 1 FROM keyforge_private.crate_catalog WHERE id=item.key) OR item.value::integer<1 THEN RAISE EXCEPTION 'Invalid crate reward'; END IF;
  INSERT INTO public.verified_crates VALUES(p_user,item.key,item.value::integer) ON CONFLICT(user_id,crate_id) DO UPDATE SET quantity=public.verified_crates.quantity+excluded.quantity;
 END LOOP;
 INSERT INTO keyforge_private.reward_ledger VALUES(p_user,p_source,p_receipt,now());
 RETURN p_receipt;
END $$;

-- Pre-hardening matches can still be inspected, but never mint verified rewards.
ALTER TABLE public.multiplayer_matches ADD COLUMN authority_version integer NOT NULL DEFAULT 0;

CREATE FUNCTION public.begin_verified_battle(p_user uuid, p_version bigint, p_challenge jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v bigint; s keyforge_private.battle_sessions;
BEGIN
 SELECT version INTO STRICT v FROM public.verified_players WHERE user_id=p_user FOR UPDATE;
 IF v<>p_version THEN RAISE EXCEPTION 'Progression changed; recompute' USING ERRCODE='40001'; END IF;
 IF (SELECT count(*) FROM keyforge_private.battle_sessions WHERE user_id=p_user AND started_at>clock_timestamp()-interval '1 minute')>=10 THEN RAISE EXCEPTION 'Challenge rate limit exceeded'; END IF;
 -- Replace an abandoned challenge. Old receipts remain available for idempotent retries.
 UPDATE keyforge_private.battle_sessions SET expires_at=clock_timestamp() WHERE user_id=p_user AND NOT finished;
 INSERT INTO keyforge_private.battle_sessions(user_id,challenge) VALUES(p_user,p_challenge) RETURNING * INTO s;
 RETURN to_jsonb(s);
END $$;
CREATE FUNCTION public.read_verified_reward(p_user uuid, p_source text) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT receipt FROM keyforge_private.reward_ledger WHERE user_id=p_user AND source=p_source $$;
CREATE FUNCTION public.read_verified_battle(p_user uuid, p_id uuid) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$ SELECT to_jsonb(s)||jsonb_build_object('server_elapsed_ms',extract(epoch FROM (clock_timestamp()-s.started_at))*1000) FROM keyforge_private.battle_sessions s WHERE user_id=p_user AND id=p_id $$;

REVOKE EXECUTE ON FUNCTION public.commit_verified_reward(uuid,text,bigint,jsonb,jsonb,jsonb,integer),public.begin_verified_battle(uuid,bigint,jsonb),public.read_verified_reward(uuid,text),public.read_verified_battle(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.commit_verified_reward(uuid,text,bigint,jsonb,jsonb,jsonb,integer),public.begin_verified_battle(uuid,bigint,jsonb),public.read_verified_reward(uuid,text),public.read_verified_battle(uuid,uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.open_verified_crate(text,uuid),public.get_verified_cosmetics(),public.equip_verified_skin(text),public.purchase_verified_crate(text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.open_verified_crate(text,uuid),public.get_verified_cosmetics(),public.equip_verified_skin(text),public.purchase_verified_crate(text,uuid) TO authenticated;
COMMIT;
