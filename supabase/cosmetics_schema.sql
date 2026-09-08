-- ==============================================================================
-- KeyForge v2.4 Cosmetics, Inventory & Crate Architecture
-- PostgreSQL / Supabase Schema with Strict Row Level Security (RLS)
-- ==============================================================================

-- 1. EXTEND PROFILES WITH COSMETIC LOADOUT & FORGE SHARDS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS equipped_keyboard_skin TEXT NOT NULL DEFAULT 'default_forge',
  ADD COLUMN IF NOT EXISTS forge_shards INTEGER NOT NULL DEFAULT 50 CHECK (forge_shards >= 0),
  ADD COLUMN IF NOT EXISTS keyboard_settings JSONB NOT NULL DEFAULT '{"showKeyboard": true, "effectIntensity": "full", "showHandsGuide": false, "showHomeRowAnchors": true}'::jsonb;

-- 2. USER COSMETICS INVENTORY TABLE
-- Stores permanent cosmetic unlocks for each player (skins, badges, frames)
CREATE TABLE IF NOT EXISTS public.user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cosmetic_id TEXT NOT NULL,
  cosmetic_type TEXT NOT NULL DEFAULT 'keyboard_skin',
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (user_id, cosmetic_id, cosmetic_type)
);

CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON public.user_cosmetics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_lookup ON public.user_cosmetics(user_id, cosmetic_id);

-- 3. PLAYER CRATES INVENTORY TABLE
-- Tracks unopened gameplay loot crates awarded through progression and milestones
CREATE TABLE IF NOT EXISTS public.player_crates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crate_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (user_id, crate_id)
);

CREATE INDEX IF NOT EXISTS idx_player_crates_user ON public.player_crates(user_id);

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_crates ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR USER COSMETICS
-- Players can inspect their own cosmetics collection
CREATE POLICY "Users can view own cosmetics"
  ON public.user_cosmetics FOR SELECT
  USING (auth.uid() = user_id);

-- Players can add cosmetics to their inventory (starter gifts / verified client sync)
CREATE POLICY "Users can insert own cosmetics"
  ON public.user_cosmetics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cosmetics cannot be modified or deleted directly by client
CREATE POLICY "Cosmetics cannot be deleted by client"
  ON public.user_cosmetics FOR DELETE
  USING (false);

-- 6. RLS POLICIES FOR PLAYER CRATES
-- Players can inspect their own unopened crates
CREATE POLICY "Users can view own crates"
  ON public.player_crates FOR SELECT
  USING (auth.uid() = user_id);

-- Players can insert crate records for themselves
CREATE POLICY "Users can insert own crates"
  ON public.player_crates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Players can update crate balances for themselves
CREATE POLICY "Users can update own crates"
  ON public.player_crates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. UPDATE SIGNUP TRIGGER TO GRANT STARTER REWARDS
-- Automatically seeds starter skins and 1 starter crate on account creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_username TEXT;
BEGIN
  initial_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'Warrior_' || SUBSTRING(NEW.id::text, 1, 8)
  );

  -- 1. Create Base Profile with default starter loadout
  INSERT INTO public.profiles (
    id,
    username,
    level,
    xp,
    total_xp,
    rank,
    title,
    equipped_keyboard_skin,
    forge_shards,
    keyboard_settings
  ) VALUES (
    NEW.id,
    initial_username,
    1,
    0,
    0,
    'E',
    'Academy Student',
    'default_forge',
    50,
    '{"showKeyboard": true, "effectIntensity": "full", "showHandsGuide": false, "showHomeRowAnchors": true}'::jsonb
  );

  -- 2. Create Lifetime Stats
  INSERT INTO public.player_stats (user_id)
  VALUES (NEW.id);

  -- 3. Initialize Naruto Campaign World
  INSERT INTO public.campaign_progress (user_id, world_id, current_stage, completed_stages, completed)
  VALUES (NEW.id, 'naruto', 1, '{}', false);

  -- 4. Grant Starter Keyboard Skins
  INSERT INTO public.user_cosmetics (user_id, cosmetic_id, cosmetic_type)
  VALUES
    (NEW.id, 'default_forge', 'keyboard_skin'),
    (NEW.id, 'midnight_shinobi', 'keyboard_skin'),
    (NEW.id, 'clean_light', 'keyboard_skin')
  ON CONFLICT (user_id, cosmetic_id, cosmetic_type) DO NOTHING;

  -- 5. Grant Welcome Basic Crate
  INSERT INTO public.player_crates (user_id, crate_id, quantity)
  VALUES (NEW.id, 'basic_crate', 1)
  ON CONFLICT (user_id, crate_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. SERVER-AUTHORITATIVE CRATE OPENING RPC
-- Atomically validates crate ownership, decrements count, rolls drop, and applies duplicate salvage protection
CREATE OR REPLACE FUNCTION public.open_player_crate(p_crate_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_current_count INTEGER;
  v_skin_id TEXT;
  v_is_duplicate BOOLEAN;
  v_shards_value INTEGER := 0;
  v_new_shards INTEGER := 0;
  v_remaining_crates INTEGER := 0;
  v_roll NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to open crates.';
  END IF;

  -- 1. Check & decrement crate inventory atomically
  SELECT quantity INTO v_current_count
  FROM public.player_crates
  WHERE user_id = v_user_id AND crate_id = p_crate_id
  FOR UPDATE;

  IF v_current_count IS NULL OR v_current_count <= 0 THEN
    RAISE EXCEPTION 'No unopened crates of type % available.', p_crate_id;
  END IF;

  v_remaining_crates := v_current_count - 1;
  UPDATE public.player_crates
  SET quantity = v_remaining_crates, updated_at = now()
  WHERE user_id = v_user_id AND crate_id = p_crate_id;

  -- 2. Determine random loot drop based on crate type
  v_roll := random() * 100;

  IF p_crate_id = 'mythic_crate' THEN
    IF v_roll < 2.0 THEN
      -- Secret
      v_skin_id := (ARRAY['glitch_singularity', 'void_god_entity'])[floor(random() * 2 + 1)];
      v_shards_value := 2000;
    ELSIF v_roll < 15.0 THEN
      -- Mythic
      v_skin_id := (ARRAY['six_paths_senjutsu', 'ultra_instinct', 'sun_god_freedom'])[floor(random() * 3 + 1)];
      v_shards_value := 1000;
    ELSIF v_roll < 55.0 THEN
      -- Legendary
      v_skin_id := (ARRAY['celestial_forge', 'kurama_nine_tails', 'susanoo_perfect', 'king_of_curses'])[floor(random() * 4 + 1)];
      v_shards_value := 400;
    ELSE
      -- Epic
      v_skin_id := (ARRAY['aetherial_forge', 'sharingan_eye', 'sage_mode', 'super_saiyan', 'domain_expansion'])[floor(random() * 5 + 1)];
      v_shards_value := 150;
    END IF;
  ELSIF p_crate_id = 'elite_crate' THEN
    IF v_roll < 0.1 THEN
      v_skin_id := 'glitch_singularity';
      v_shards_value := 2000;
    ELSIF v_roll < 1.5 THEN
      v_skin_id := (ARRAY['six_paths_senjutsu', 'ultra_instinct', 'sun_god_freedom'])[floor(random() * 3 + 1)];
      v_shards_value := 1000;
    ELSIF v_roll < 10.0 THEN
      v_skin_id := (ARRAY['celestial_forge', 'kurama_nine_tails', 'susanoo_perfect', 'king_of_curses'])[floor(random() * 4 + 1)];
      v_shards_value := 400;
    ELSIF v_roll < 40.0 THEN
      v_skin_id := (ARRAY['aetherial_forge', 'sharingan_eye', 'sage_mode', 'super_saiyan', 'domain_expansion'])[floor(random() * 5 + 1)];
      v_shards_value := 150;
    ELSE
      v_skin_id := (ARRAY['cyber_forge', 'flame_rasengan', 'chidori_volt', 'spirit_bomb', 'black_flash', 'haki_conqueror'])[floor(random() * 6 + 1)];
      v_shards_value := 60;
    END IF;
  ELSIF p_crate_id = 'shinobi_crate' THEN
    IF v_roll < 0.1 THEN
      v_skin_id := 'six_paths_senjutsu';
      v_shards_value := 1000;
    ELSIF v_roll < 1.0 THEN
      v_skin_id := (ARRAY['kurama_nine_tails', 'susanoo_perfect'])[floor(random() * 2 + 1)];
      v_shards_value := 400;
    ELSIF v_roll < 6.0 THEN
      v_skin_id := (ARRAY['sharingan_eye', 'sage_mode'])[floor(random() * 2 + 1)];
      v_shards_value := 150;
    ELSIF v_roll < 20.0 THEN
      v_skin_id := (ARRAY['flame_rasengan', 'chidori_volt'])[floor(random() * 2 + 1)];
      v_shards_value := 60;
    ELSIF v_roll < 55.0 THEN
      v_skin_id := (ARRAY['mist_assassin', 'cloud_lightning', 'turtle_hermit', 'cursed_energy'])[floor(random() * 4 + 1)];
      v_shards_value := 25;
    ELSE
      v_skin_id := (ARRAY['midnight_shinobi', 'leaf_village', 'sand_drifter', 'capsule_corp'])[floor(random() * 4 + 1)];
      v_shards_value := 10;
    END IF;
  ELSE
    -- Basic Crate
    IF v_roll < 0.5 THEN
      v_skin_id := (ARRAY['aetherial_forge', 'sharingan_eye'])[floor(random() * 2 + 1)];
      v_shards_value := 150;
    ELSIF v_roll < 7.0 THEN
      v_skin_id := (ARRAY['cyber_forge', 'flame_rasengan', 'chidori_volt'])[floor(random() * 3 + 1)];
      v_shards_value := 60;
    ELSIF v_roll < 30.0 THEN
      v_skin_id := (ARRAY['crimson_forge', 'mist_assassin', 'cloud_lightning', 'turtle_hermit'])[floor(random() * 4 + 1)];
      v_shards_value := 25;
    ELSE
      v_skin_id := (ARRAY['default_forge', 'clean_light', 'midnight_shinobi', 'obsidian_core', 'leaf_village', 'sand_drifter', 'capsule_corp', 'straw_voyage'])[floor(random() * 8 + 1)];
      v_shards_value := 10;
    END IF;
  END IF;

  -- 3. Check duplicate
  SELECT EXISTS (
    SELECT 1 FROM public.user_cosmetics
    WHERE user_id = v_user_id AND cosmetic_id = v_skin_id AND cosmetic_type = 'keyboard_skin'
  ) INTO v_is_duplicate;

  IF v_is_duplicate THEN
    -- Award Shards
    UPDATE public.profiles
    SET forge_shards = forge_shards + v_shards_value, updated_at = now()
    WHERE id = v_user_id
    RETURNING forge_shards INTO v_new_shards;
  ELSE
    -- Insert new cosmetic unlock
    INSERT INTO public.user_cosmetics (user_id, cosmetic_id, cosmetic_type)
    VALUES (v_user_id, v_skin_id, 'keyboard_skin');

    SELECT forge_shards INTO v_new_shards
    FROM public.profiles WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'skin_id', v_skin_id,
    'is_duplicate', v_is_duplicate,
    'shards_awarded', CASE WHEN v_is_duplicate THEN v_shards_value ELSE 0 END,
    'remaining_crates', v_remaining_crates,
    'new_shards_balance', v_new_shards
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

