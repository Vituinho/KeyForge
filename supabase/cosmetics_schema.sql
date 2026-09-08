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
