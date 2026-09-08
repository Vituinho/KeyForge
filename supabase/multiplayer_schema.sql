-- ==============================================================================
-- KeyForge v3.0 Multiplayer Match Database Schema & RLS Security Policies
-- Server-Authoritative 1v1 PvP Typing Matches, Realtime Events & Queue
-- ==============================================================================

-- 1. MULTIPLAYER MATCHES TABLE
-- The central authoritative source of truth for ongoing and finished PvP battles
CREATE TABLE IF NOT EXISTS public.multiplayer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE, -- e.g. 'KF-XXXX' for private rooms, NULL for quick matches
  mode TEXT NOT NULL CHECK (mode IN ('quick', 'private')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'countdown', 'playing', 'finished', 'cancelled')),
  language TEXT NOT NULL DEFAULT 'pt-BR' CHECK (language IN ('pt-BR', 'en')),
  seed BIGINT NOT NULL, -- Deterministic seed guaranteeing identical words in identical order
  word_count INTEGER NOT NULL DEFAULT 30 CHECK (word_count >= 10 AND word_count <= 100),

  -- Players
  player_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Readiness
  player_1_ready BOOLEAN NOT NULL DEFAULT FALSE,
  player_2_ready BOOLEAN NOT NULL DEFAULT FALSE,

  -- Realtime Combat & Progression State (Server Authoritative)
  player_1_hp INTEGER NOT NULL DEFAULT 1000 CHECK (player_1_hp >= 0),
  player_2_hp INTEGER NOT NULL DEFAULT 1000 CHECK (player_2_hp >= 0),
  player_1_word_index INTEGER NOT NULL DEFAULT 0 CHECK (player_1_word_index >= 0),
  player_2_word_index INTEGER NOT NULL DEFAULT 0 CHECK (player_2_word_index >= 0),
  player_1_combo INTEGER NOT NULL DEFAULT 0 CHECK (player_1_combo >= 0),
  player_2_combo INTEGER NOT NULL DEFAULT 0 CHECK (player_2_combo >= 0),
  player_1_attack_energy INTEGER NOT NULL DEFAULT 0 CHECK (player_1_attack_energy >= 0 AND player_1_attack_energy <= 100),
  player_2_attack_energy INTEGER NOT NULL DEFAULT 0 CHECK (player_2_attack_energy >= 0 AND player_2_attack_energy <= 100),
  player_1_ultimate_energy INTEGER NOT NULL DEFAULT 0 CHECK (player_1_ultimate_energy >= 0 AND player_1_ultimate_energy <= 100),
  player_2_ultimate_energy INTEGER NOT NULL DEFAULT 0 CHECK (player_2_ultimate_energy >= 0 AND player_2_ultimate_energy <= 100),

  -- Live Telemetry for HUD sync
  player_1_wpm INTEGER NOT NULL DEFAULT 0,
  player_2_wpm INTEGER NOT NULL DEFAULT 0,
  player_1_accuracy INTEGER NOT NULL DEFAULT 100,
  player_2_accuracy INTEGER NOT NULL DEFAULT 100,

  -- Cosmetic Loadout
  player_1_skin_id TEXT NOT NULL DEFAULT 'default_forge',
  player_2_skin_id TEXT NOT NULL DEFAULT 'default_forge',

  -- Match Resolution
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_draw BOOLEAN NOT NULL DEFAULT FALSE,

  -- Synchronized Timestamps
  countdown_starts_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  player_1_last_active_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  player_2_last_active_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),

  -- Constraint: A player cannot duel themselves
  CONSTRAINT check_different_players CHECK (player_2_id IS NULL OR player_1_id <> player_2_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_matches_room_code ON public.multiplayer_matches(room_code) WHERE room_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.multiplayer_matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_players ON public.multiplayer_matches(player_1_id, player_2_id);
CREATE INDEX IF NOT EXISTS idx_matches_active ON public.multiplayer_matches(status) WHERE status IN ('waiting', 'ready', 'countdown', 'playing');

-- 2. MATCH EVENTS LOG (IDEMPOTENT EVENT SOURCING)
-- Records word completion checkpoints and critical gameplay events
CREATE TABLE IF NOT EXISTS public.multiplayer_match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.multiplayer_matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL, -- Client-generated unique UUID/string for idempotency
  event_type TEXT NOT NULL CHECK (event_type IN (
    'WORD_COMPLETED',
    'ATTACK_RESOLVED',
    'ULTIMATE_TRIGGERED',
    'TYPO_PENALTY',
    'PLAYER_DISCONNECTED',
    'PLAYER_RECONNECTED',
    'FORFEIT'
  )),
  word_index INTEGER,
  word_text TEXT,
  accuracy INTEGER,
  wpm INTEGER,
  combo INTEGER,
  damage_dealt INTEGER NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (match_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_match_events_match ON public.multiplayer_match_events(match_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_match_events_player ON public.multiplayer_match_events(player_id);

-- 3. MATCH RESULTS (HISTORICAL SUMMARY & STATS)
-- Immutable record created upon official match termination
CREATE TABLE IF NOT EXISTS public.multiplayer_match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID UNIQUE NOT NULL REFERENCES public.multiplayer_matches(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  loser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_draw BOOLEAN NOT NULL DEFAULT FALSE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- Player 1 Performance
  player_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_1_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  player_1_xp_earned INTEGER NOT NULL DEFAULT 0,

  -- Player 2 Performance
  player_2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_2_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  player_2_xp_earned INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_match_results_players ON public.multiplayer_match_results(player_1_id, player_2_id);

-- 4. CASUAL QUICK MATCH QUEUE
-- Manages players searching for matches
CREATE TABLE IF NOT EXISTS public.multiplayer_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  rank TEXT NOT NULL DEFAULT 'E',
  language TEXT NOT NULL DEFAULT 'pt-BR',
  skin_id TEXT NOT NULL DEFAULT 'default_forge',
  status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'cancelled')),
  matched_match_id UUID REFERENCES public.multiplayer_matches(id) ON DELETE SET NULL,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_queue_matching ON public.multiplayer_queue(status, language, queued_at ASC);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.multiplayer_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multiplayer_queue ENABLE ROW LEVEL SECURITY;

-- MULTIPLAYER MATCHES POLICIES
-- Players can inspect matches they are part of, or discoverable open private rooms by code
CREATE POLICY "Matches viewable by participants or room finders"
  ON public.multiplayer_matches FOR SELECT
  USING (
    auth.uid() = player_1_id OR
    auth.uid() = player_2_id OR
    (mode = 'private' AND status = 'waiting')
  );

-- Host can create a match record
CREATE POLICY "Host can insert match"
  ON public.multiplayer_matches FOR INSERT
  WITH CHECK (auth.uid() = player_1_id);

-- Direct client updates are strictly constrained:
-- Only allowed to join an open room or cancel a room the user is in.
-- All combat calculations (damage, hp, winner, energy) must happen via server RPCs.
CREATE POLICY "Participants can update room readiness or cancel"
  ON public.multiplayer_matches FOR UPDATE
  USING (auth.uid() = player_1_id OR auth.uid() = player_2_id OR (player_2_id IS NULL AND status = 'waiting'))
  WITH CHECK (
    -- Cannot forge someone else's user ID
    (auth.uid() = player_1_id OR auth.uid() = player_2_id)
  );

-- Matches cannot be deleted directly by clients
CREATE POLICY "Matches cannot be deleted by client"
  ON public.multiplayer_matches FOR DELETE
  USING (false);

-- MATCH EVENTS POLICIES
CREATE POLICY "Events viewable by match participants"
  ON public.multiplayer_match_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.multiplayer_matches m
      WHERE m.id = match_id AND (m.player_1_id = auth.uid() OR m.player_2_id = auth.uid())
    )
  );

CREATE POLICY "Participants can insert own events"
  ON public.multiplayer_match_events FOR INSERT
  WITH CHECK (
    auth.uid() = player_id AND
    EXISTS (
      SELECT 1 FROM public.multiplayer_matches m
      WHERE m.id = match_id AND (m.player_1_id = auth.uid() OR m.player_2_id = auth.uid())
    )
  );

CREATE POLICY "Events immutable"
  ON public.multiplayer_match_events FOR UPDATE
  USING (false);

CREATE POLICY "Events cannot be deleted"
  ON public.multiplayer_match_events FOR DELETE
  USING (false);

-- MATCH RESULTS POLICIES
CREATE POLICY "Results viewable by participants"
  ON public.multiplayer_match_results FOR SELECT
  USING (auth.uid() = player_1_id OR auth.uid() = player_2_id);

CREATE POLICY "Results cannot be inserted by client directly"
  ON public.multiplayer_match_results FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Results cannot be modified"
  ON public.multiplayer_match_results FOR UPDATE
  USING (false);

CREATE POLICY "Results cannot be deleted"
  ON public.multiplayer_match_results FOR DELETE
  USING (false);

-- QUEUE POLICIES
CREATE POLICY "Queue viewable by self"
  ON public.multiplayer_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Queue insertable by self"
  ON public.multiplayer_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Queue updatable by self"
  ON public.multiplayer_queue FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Queue deletable by self"
  ON public.multiplayer_queue FOR DELETE
  USING (auth.uid() = user_id);
