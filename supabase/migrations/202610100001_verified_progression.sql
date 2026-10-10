-- Generated defaults use the existing game balance. See scripts/generate-security-catalog.ts.
BEGIN;
CREATE SCHEMA IF NOT EXISTS keyforge_private;
REVOKE ALL ON SCHEMA keyforge_private FROM PUBLIC, anon, authenticated;
REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA keyforge_private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE TABLE public.verified_players (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile jsonb NOT NULL,
  version bigint NOT NULL DEFAULT 0,
  forge_shards integer NOT NULL DEFAULT 50 CHECK (forge_shards >= 0),
  equipped_skin text NOT NULL DEFAULT 'default_forge',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.verified_cosmetics (
  user_id uuid NOT NULL REFERENCES public.verified_players(user_id) ON DELETE CASCADE,
  cosmetic_id text NOT NULL, PRIMARY KEY (user_id, cosmetic_id)
);
CREATE TABLE public.verified_crates (
  user_id uuid NOT NULL REFERENCES public.verified_players(user_id) ON DELETE CASCADE,
  crate_id text NOT NULL, quantity integer NOT NULL CHECK (quantity >= 0),
  PRIMARY KEY (user_id, crate_id)
);
CREATE TABLE keyforge_private.reward_ledger (
  user_id uuid NOT NULL REFERENCES public.verified_players(user_id),
  source text NOT NULL, receipt jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, source)
);
CREATE TABLE keyforge_private.battle_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.verified_players(user_id),
  challenge jsonb NOT NULL, started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT (clock_timestamp() + interval '30 minutes'),
  finished boolean NOT NULL DEFAULT false
);
CREATE INDEX battle_sessions_owner ON keyforge_private.battle_sessions(user_id, started_at);
CREATE TABLE keyforge_private.legacy_snapshots (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id), snapshot jsonb NOT NULL,
  classification text NOT NULL DEFAULT 'unverified', captured_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO keyforge_private.legacy_snapshots(user_id, snapshot)
SELECT p.id, jsonb_build_object('profile', to_jsonb(p),
 'stats', (SELECT to_jsonb(s) FROM public.player_stats s WHERE s.user_id=p.id),
 'campaign', (SELECT coalesce(jsonb_agg(c), '[]') FROM public.campaign_progress c WHERE c.user_id=p.id),
 'inventory', (SELECT coalesce(jsonb_agg(c), '[]') FROM public.user_cosmetics c WHERE c.user_id=p.id),
 'crates', (SELECT coalesce(jsonb_agg(c), '[]') FROM public.player_crates c WHERE c.user_id=p.id))
FROM public.profiles p;

CREATE FUNCTION keyforge_private.ensure_player(p_user uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v_name text;
BEGIN
 SELECT username INTO STRICT v_name FROM public.profiles WHERE id=p_user;
 INSERT INTO public.verified_players(user_id, profile)
 VALUES (p_user, '{"id":"player_local","username":"Player","level":1,"xp":0,"totalXp":0,"rank":"E","attributes":{"speed":0,"accuracy":100,"technique":0,"combo":0,"overall":20},"stats":{"battlesPlayed":0,"battlesWon":0,"battlesLost":0,"totalTypingTime":0,"totalCharactersTyped":0,"totalCorrectCharacters":0,"totalErrors":0,"averageWpm":0,"bestWpm":0,"averageAccuracy":100,"bestCombo":0,"enemiesDefeated":0,"trainingSessions":0,"academyLessonsCompleted":0},"multiplayerStats":{"matchesPlayed":0,"wins":0,"losses":0,"winRate":0,"bestWpm":0,"bestCombo":0,"currentWinStreak":0,"bestWinStreak":0},"campaignProgress":{"naruto":{"unlocked":true,"completed":false,"currentStage":1,"completedStages":[],"defeatedEnemies":[],"bestScores":{},"firstClearClaimed":{}}},"worldsUnlocked":1,"worldsCompleted":0,"worldMastery":0,"totalStagesCleared":0,"keyErrors":{},"achievements":[],"bestWpm":0,"bestAccuracy":100,"bestCombo":0,"worldBaselines":{},"worldIntroSeen":{},"onboardingCompleted":false,"createdAt":"1970-01-01T00:00:00.000Z","updatedAt":"1970-01-01T00:00:00.000Z"}'::jsonb || jsonb_build_object('id',p_user,'username',v_name,'createdAt',now(),'updatedAt',now()))
 ON CONFLICT DO NOTHING;
 INSERT INTO public.verified_cosmetics(user_id, cosmetic_id)
 SELECT p_user, unnest(ARRAY['default_forge','midnight_shinobi','clean_light']) ON CONFLICT DO NOTHING;
 -- Seed the starter crate only on account creation, never on subsequent reads.
END $$;
INSERT INTO public.verified_players(user_id,profile)
 SELECT p.id, '{"id":"player_local","username":"Player","level":1,"xp":0,"totalXp":0,"rank":"E","attributes":{"speed":0,"accuracy":100,"technique":0,"combo":0,"overall":20},"stats":{"battlesPlayed":0,"battlesWon":0,"battlesLost":0,"totalTypingTime":0,"totalCharactersTyped":0,"totalCorrectCharacters":0,"totalErrors":0,"averageWpm":0,"bestWpm":0,"averageAccuracy":100,"bestCombo":0,"enemiesDefeated":0,"trainingSessions":0,"academyLessonsCompleted":0},"multiplayerStats":{"matchesPlayed":0,"wins":0,"losses":0,"winRate":0,"bestWpm":0,"bestCombo":0,"currentWinStreak":0,"bestWinStreak":0},"campaignProgress":{"naruto":{"unlocked":true,"completed":false,"currentStage":1,"completedStages":[],"defeatedEnemies":[],"bestScores":{},"firstClearClaimed":{}}},"worldsUnlocked":1,"worldsCompleted":0,"worldMastery":0,"totalStagesCleared":0,"keyErrors":{},"achievements":[],"bestWpm":0,"bestAccuracy":100,"bestCombo":0,"worldBaselines":{},"worldIntroSeen":{},"onboardingCompleted":false,"createdAt":"1970-01-01T00:00:00.000Z","updatedAt":"1970-01-01T00:00:00.000Z"}'::jsonb || jsonb_build_object('id',p.id,'username',p.username,'createdAt',now(),'updatedAt',now()) FROM public.profiles p;
INSERT INTO public.verified_cosmetics SELECT p.user_id, s FROM public.verified_players p CROSS JOIN unnest(ARRAY['default_forge','midnight_shinobi','clean_light']) s;
INSERT INTO public.verified_crates SELECT user_id,'basic_crate',1 FROM public.verified_players;

CREATE FUNCTION public.get_verified_player() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE u uuid := auth.uid(); v jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT profile || jsonb_build_object('username',p.username) INTO v FROM public.verified_players v JOIN public.profiles p ON p.id=v.user_id WHERE v.user_id=u;
 IF v IS NULL THEN RAISE EXCEPTION 'Verified account missing'; END IF;
 RETURN v;
END $$;

DO $$ DECLARE t text; p record; columns text; BEGIN
 FOREACH t IN ARRAY ARRAY['profiles','player_stats','campaign_progress','battle_history','user_cosmetics','player_crates','multiplayer_matches','multiplayer_match_events','multiplayer_match_results','multiplayer_queue'] LOOP
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t AND cmd <> 'SELECT' LOOP
   EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t);
  END LOOP;
  EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM PUBLIC, anon, authenticated',t);
  SELECT string_agg(quote_ident(attname),',') INTO columns FROM pg_attribute WHERE attrelid=('public.'||t)::regclass AND attnum>0 AND NOT attisdropped;
  -- Table-level REVOKE does not remove old column-level grants.
  EXECUTE format('REVOKE INSERT (%s), UPDATE (%s), REFERENCES (%s) ON public.%I FROM PUBLIC, anon, authenticated',columns,columns,columns,t);
 END LOOP;
 -- Restrict profile preferences by BOTH column grants and owner policy.
 GRANT UPDATE(username,language,keyboard_settings) ON public.profiles TO authenticated;
 CREATE POLICY profile_preferences ON public.profiles FOR UPDATE TO authenticated USING (id=auth.uid()) WITH CHECK(id=auth.uid());
 FOREACH t IN ARRAY ARRAY['verified_players','verified_cosmetics','verified_crates'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',t);
  EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
  EXECUTE format('CREATE POLICY owner_read ON public.%I FOR SELECT TO authenticated USING(user_id=auth.uid())',t);
 END LOOP;
END $$;
-- Private tables are never exposed in the Supabase API. Defense in depth for schema grants.
ALTER TABLE keyforge_private.reward_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyforge_private.battle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyforge_private.legacy_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA keyforge_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA keyforge_private TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA keyforge_private TO service_role;
GRANT ALL ON public.verified_players, public.verified_cosmetics, public.verified_crates TO service_role;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA keyforge_private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_verified_player() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_verified_player() TO authenticated;

-- This is the only profile provisioning path. Existing rows and legacy inventories remain intact.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 INSERT INTO public.profiles(id,username) VALUES(NEW.id, coalesce(nullif(NEW.raw_user_meta_data->>'username',''),'Player_'||substr(NEW.id::text,1,8)));
 INSERT INTO public.player_stats(user_id) VALUES(NEW.id);
 PERFORM keyforge_private.ensure_player(NEW.id);
 INSERT INTO public.verified_crates VALUES(NEW.id,'basic_crate',1);
 RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TABLE keyforge_private.crate_catalog (id text PRIMARY KEY, definition jsonb NOT NULL);
INSERT INTO keyforge_private.crate_catalog VALUES
('basic_crate', '{"id":"basic_crate","type":"basic","name":"Basic Forged Crate","description":"Standard supply cache forged from basic alloy minerals. Contains common to rare skins.","icon":"📦","color":"#a3a3a3","borderColor":"border-neutral-600","bgGlow":"rgba(163,163,163,0.15)","costShards":100,"guaranteedMinRarity":"common","dropWeights":[{"rarity":"common","weight":70},{"rarity":"uncommon","weight":23},{"rarity":"rare","weight":6.5},{"rarity":"epic","weight":0.5},{"rarity":"legendary","weight":0},{"rarity":"mythic","weight":0},{"rarity":"secret","weight":0}]}'::jsonb),
('shinobi_crate', '{"id":"shinobi_crate","type":"shinobi","name":"Shinobi Secret Crate","description":"Ancient shinobi scroll crate holding elemental chakra and jutsu-infused keyboard skins.","icon":"📜","color":"#10b981","borderColor":"border-emerald-500","bgGlow":"rgba(16,185,129,0.2)","costShards":250,"guaranteedMinRarity":"common","dropWeights":[{"rarity":"common","weight":45},{"rarity":"uncommon","weight":35},{"rarity":"rare","weight":14},{"rarity":"epic","weight":5},{"rarity":"legendary","weight":0.9},{"rarity":"mythic","weight":0.1},{"rarity":"secret","weight":0}]}'::jsonb),
('elite_crate', '{"id":"elite_crate","type":"elite","name":"Elite Ronin Crate","description":"High-grade chest containing battle-hardened rare, epic, and legendary armaments.","icon":"⚔️","color":"#a855f7","borderColor":"border-purple-500","bgGlow":"rgba(168,85,247,0.25)","costShards":600,"guaranteedMinRarity":"rare","dropWeights":[{"rarity":"rare","weight":60},{"rarity":"epic","weight":30},{"rarity":"legendary","weight":8.5},{"rarity":"mythic","weight":1.4},{"rarity":"secret","weight":0.1}]}'::jsonb),
('mythic_crate', '{"id":"mythic_crate","type":"mythic","name":"Celestial Mythic Crate","description":"Transcendent divine vault containing exclusively epic, legendary, mythic, and secret skins.","icon":"👑","color":"#f59e0b","borderColor":"border-amber-400","bgGlow":"rgba(245,158,11,0.35)","costShards":1800,"guaranteedMinRarity":"epic","dropWeights":[{"rarity":"epic","weight":45},{"rarity":"legendary","weight":40},{"rarity":"mythic","weight":13},{"rarity":"secret","weight":2}]}'::jsonb);
CREATE TABLE keyforge_private.skin_catalog (id text PRIMARY KEY, definition jsonb NOT NULL);
INSERT INTO keyforge_private.skin_catalog VALUES
('default_forge', '{"id":"default_forge","rarity":"common","shardsValue":10}'::jsonb),
('clean_light', '{"id":"clean_light","rarity":"common","shardsValue":10}'::jsonb),
('midnight_shinobi', '{"id":"midnight_shinobi","rarity":"common","shardsValue":10}'::jsonb),
('obsidian_core', '{"id":"obsidian_core","rarity":"common","shardsValue":10}'::jsonb),
('leaf_village', '{"id":"leaf_village","rarity":"common","shardsValue":10}'::jsonb),
('sand_drifter', '{"id":"sand_drifter","rarity":"common","shardsValue":10}'::jsonb),
('capsule_corp', '{"id":"capsule_corp","rarity":"common","shardsValue":10}'::jsonb),
('straw_voyage', '{"id":"straw_voyage","rarity":"common","shardsValue":10}'::jsonb),
('crimson_forge', '{"id":"crimson_forge","rarity":"uncommon","shardsValue":25}'::jsonb),
('mist_assassin', '{"id":"mist_assassin","rarity":"uncommon","shardsValue":25}'::jsonb),
('cloud_lightning', '{"id":"cloud_lightning","rarity":"uncommon","shardsValue":25}'::jsonb),
('turtle_hermit', '{"id":"turtle_hermit","rarity":"uncommon","shardsValue":25}'::jsonb),
('cursed_energy', '{"id":"cursed_energy","rarity":"uncommon","shardsValue":25}'::jsonb),
('monarch_shadows', '{"id":"monarch_shadows","rarity":"uncommon","shardsValue":25}'::jsonb),
('abyssal_sovereign', '{"id":"abyssal_sovereign","rarity":"uncommon","shardsValue":25}'::jsonb),
('cyber_forge', '{"id":"cyber_forge","rarity":"rare","shardsValue":60}'::jsonb),
('flame_rasengan', '{"id":"flame_rasengan","rarity":"rare","shardsValue":60}'::jsonb),
('chidori_volt', '{"id":"chidori_volt","rarity":"rare","shardsValue":60}'::jsonb),
('spirit_bomb', '{"id":"spirit_bomb","rarity":"rare","shardsValue":60}'::jsonb),
('black_flash', '{"id":"black_flash","rarity":"rare","shardsValue":60}'::jsonb),
('haki_conqueror', '{"id":"haki_conqueror","rarity":"rare","shardsValue":60}'::jsonb),
('aetherial_forge', '{"id":"aetherial_forge","rarity":"epic","shardsValue":150}'::jsonb),
('sharingan_eye', '{"id":"sharingan_eye","rarity":"epic","shardsValue":150}'::jsonb),
('sage_mode', '{"id":"sage_mode","rarity":"epic","shardsValue":150}'::jsonb),
('super_saiyan', '{"id":"super_saiyan","rarity":"epic","shardsValue":150}'::jsonb),
('domain_expansion', '{"id":"domain_expansion","rarity":"epic","shardsValue":150}'::jsonb),
('celestial_forge', '{"id":"celestial_forge","rarity":"legendary","shardsValue":400}'::jsonb),
('kurama_nine_tails', '{"id":"kurama_nine_tails","rarity":"legendary","shardsValue":400}'::jsonb),
('susanoo_perfect', '{"id":"susanoo_perfect","rarity":"legendary","shardsValue":400}'::jsonb),
('king_of_curses', '{"id":"king_of_curses","rarity":"legendary","shardsValue":400}'::jsonb),
('six_paths_senjutsu', '{"id":"six_paths_senjutsu","rarity":"mythic","shardsValue":1000}'::jsonb),
('ultra_instinct', '{"id":"ultra_instinct","rarity":"mythic","shardsValue":1000}'::jsonb),
('sun_god_freedom', '{"id":"sun_god_freedom","rarity":"mythic","shardsValue":1000}'::jsonb),
('glitch_singularity', '{"id":"glitch_singularity","rarity":"secret","shardsValue":2000}'::jsonb),
('void_god_entity', '{"id":"void_god_entity","rarity":"secret","shardsValue":2000}'::jsonb);
ALTER TABLE keyforge_private.crate_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyforge_private.skin_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA keyforge_private FROM PUBLIC, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA keyforge_private TO service_role;
COMMIT;
