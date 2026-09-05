-- KeyForge v2.3 Database Schema & Security Policies
-- Designed for Supabase / PostgreSQL with strict Row Level Security (RLS)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE
-- Connected to auth.users. Represents public warrior identity & RPG state.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  rank TEXT NOT NULL DEFAULT 'E',
  title TEXT DEFAULT 'Academy Student',
  attributes JSONB NOT NULL DEFAULT '{"speed": 10, "accuracy": 10, "technique": 10, "combo": 10, "overall": 10}'::jsonb,
  achievements TEXT[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Case-insensitive unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));

-- 3. PLAYER STATS TABLE
-- Lifetime performance telemetry and volume metrics
CREATE TABLE IF NOT EXISTS public.player_stats (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  battles_played INTEGER NOT NULL DEFAULT 0,
  battles_won INTEGER NOT NULL DEFAULT 0,
  battles_lost INTEGER NOT NULL DEFAULT 0,
  enemies_defeated INTEGER NOT NULL DEFAULT 0,
  total_typing_time INTEGER NOT NULL DEFAULT 0,
  total_characters_typed INTEGER NOT NULL DEFAULT 0,
  total_correct_characters INTEGER NOT NULL DEFAULT 0,
  total_errors INTEGER NOT NULL DEFAULT 0,
  average_wpm INTEGER NOT NULL DEFAULT 0,
  best_wpm INTEGER NOT NULL DEFAULT 0,
  average_accuracy INTEGER NOT NULL DEFAULT 0,
  best_combo INTEGER NOT NULL DEFAULT 0,
  training_sessions INTEGER NOT NULL DEFAULT 0,
  academy_lessons_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4. CAMPAIGN PROGRESS TABLE
-- Sagas and World progress (Naruto World, future worlds)
CREATE TABLE IF NOT EXISTS public.campaign_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  world_id TEXT NOT NULL DEFAULT 'naruto',
  current_stage INTEGER NOT NULL DEFAULT 1,
  completed_stages INTEGER[] NOT NULL DEFAULT '{}',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (user_id, world_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_progress_user ON public.campaign_progress(user_id);

-- 5. BATTLE HISTORY TABLE
-- Log of completed solo and boss battles
CREATE TABLE IF NOT EXISTS public.battle_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enemy_id TEXT NOT NULL,
  enemy_name TEXT NOT NULL,
  enemy_anime TEXT NOT NULL,
  victory BOOLEAN NOT NULL,
  battle_wpm INTEGER NOT NULL,
  best_wpm INTEGER NOT NULL,
  battle_accuracy INTEGER NOT NULL,
  best_combo INTEGER NOT NULL,
  damage_dealt INTEGER NOT NULL DEFAULT 0,
  damage_taken INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  weak_keys TEXT[] NOT NULL DEFAULT '{}',
  played_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_battle_history_user_date ON public.battle_history(user_id, played_at DESC);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Mandatory security requirement: users can NEVER modify or access other players' private data
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read basic profile, owner can insert/update
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Player Stats: Public read for matchmaking/stats view, owner write
CREATE POLICY "Player stats are viewable by everyone"
  ON public.player_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own stats"
  ON public.player_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON public.player_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Campaign Progress: strictly private to user
CREATE POLICY "Users can view own campaign progress"
  ON public.campaign_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaign progress"
  ON public.campaign_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaign progress"
  ON public.campaign_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Battle History: strictly private to user
CREATE POLICY "Users can view own battle history"
  ON public.battle_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own battle record"
  ON public.battle_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own battle records"
  ON public.battle_history FOR DELETE
  USING (auth.uid() = user_id);

-- 7. TRIGGER FOR AUTOMATIC PROFILE INITIALIZATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_username TEXT;
BEGIN
  initial_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    'Warrior_' || SUBSTRING(NEW.id::text, 1, 8)
  );

  -- Insert profile
  INSERT INTO public.profiles (id, username, level, xp, total_xp, rank, title)
  VALUES (
    NEW.id,
    initial_username,
    1,
    0,
    0,
    'E',
    'Academy Student'
  );

  -- Insert player stats
  INSERT INTO public.player_stats (user_id)
  VALUES (NEW.id);

  -- Insert Naruto World campaign progress
  INSERT INTO public.campaign_progress (user_id, world_id, current_stage, completed_stages, completed)
  VALUES (NEW.id, 'naruto', 1, '{}', false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
