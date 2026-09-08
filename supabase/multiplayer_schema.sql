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

-- ==============================================================================
-- 6. AUTHORITATIVE SERVER-SIDE STORED PROCEDURES (RPCs)
-- The server is the sole authority for HP, energy, attacks, winners and resolution
-- ==============================================================================

-- 6.1 CREATE MULTIPLAYER MATCH
CREATE OR REPLACE FUNCTION public.create_multiplayer_match(
  p_mode TEXT,
  p_room_code TEXT DEFAULT NULL,
  p_language TEXT DEFAULT 'pt-BR',
  p_seed BIGINT DEFAULT 12345,
  p_skin_id TEXT DEFAULT 'default_forge',
  p_word_count INTEGER DEFAULT 30
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_code TEXT := NULL;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_mode = 'private' THEN
    IF p_room_code IS NOT NULL AND p_room_code <> '' THEN
      v_code := UPPER(TRIM(p_room_code));
    ELSE
      v_code := 'KF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    END IF;
  END IF;

  INSERT INTO public.multiplayer_matches (
    room_code,
    mode,
    status,
    language,
    seed,
    word_count,
    player_1_id,
    player_1_skin_id,
    player_1_hp,
    player_2_hp,
    player_1_ready,
    player_2_ready
  ) VALUES (
    v_code,
    p_mode,
    'waiting',
    p_language,
    p_seed,
    p_word_count,
    v_user_id,
    p_skin_id,
    1000,
    1000,
    FALSE,
    FALSE
  )
  RETURNING * INTO v_match;

  RETURN v_match;
END;
$$;

-- 6.2 JOIN MULTIPLAYER MATCH
CREATE OR REPLACE FUNCTION public.join_multiplayer_match(
  p_room_code TEXT,
  p_skin_id TEXT DEFAULT 'default_forge'
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_norm_code TEXT := UPPER(TRIM(p_room_code));
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_match
  FROM public.multiplayer_matches
  WHERE room_code = v_norm_code
    AND status = 'waiting'
    AND player_2_id IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found or already occupied';
  END IF;

  IF v_match.player_1_id = v_user_id THEN
    RAISE EXCEPTION 'Cannot join your own room as opponent';
  END IF;

  UPDATE public.multiplayer_matches
  SET
    player_2_id = v_user_id,
    player_2_skin_id = p_skin_id,
    player_2_last_active_at = TIMEZONE('utc', NOW()),
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = v_match.id
  RETURNING * INTO v_match;

  RETURN v_match;
END;
$$;

-- 6.3 SET PLAYER READY STATE & SYNCHRONIZED COUNTDOWN
CREATE OR REPLACE FUNCTION public.set_player_ready(
  p_match_id UUID,
  p_ready BOOLEAN
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_p1_ready BOOLEAN;
  v_p2_ready BOOLEAN;
  v_both_ready BOOLEAN;
  v_now TIMESTAMPTZ := TIMEZONE('utc', NOW());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_match
  FROM public.multiplayer_matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.player_1_id = v_user_id THEN
    v_p1_ready := p_ready;
    v_p2_ready := v_match.player_2_ready;
  ELSIF v_match.player_2_id = v_user_id THEN
    v_p1_ready := v_match.player_1_ready;
    v_p2_ready := p_ready;
  ELSE
    RAISE EXCEPTION 'User not a participant in this match';
  END IF;

  v_both_ready := v_p1_ready AND v_p2_ready;

  IF v_both_ready THEN
    UPDATE public.multiplayer_matches
    SET
      player_1_ready = v_p1_ready,
      player_2_ready = v_p2_ready,
      status = 'countdown',
      countdown_starts_at = v_now,
      started_at = v_now + INTERVAL '3 seconds',
      updated_at = v_now
    WHERE id = p_match_id
    RETURNING * INTO v_match;
  ELSE
    UPDATE public.multiplayer_matches
    SET
      player_1_ready = v_p1_ready,
      player_2_ready = v_p2_ready,
      status = 'waiting',
      countdown_starts_at = NULL,
      started_at = NULL,
      updated_at = v_now
    WHERE id = p_match_id
    RETURNING * INTO v_match;
  END IF;

  RETURN v_match;
END;
$$;

-- 6.4 SUBMIT WORD COMPLETION (AUTHORITATIVE DAMAGE, ENERGY & WINNER CALCULATION)
CREATE OR REPLACE FUNCTION public.submit_word_completion(
  p_match_id UUID,
  p_event_id TEXT,
  p_word_index INTEGER,
  p_word_text TEXT,
  p_wpm INTEGER,
  p_accuracy INTEGER,
  p_combo INTEGER
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_is_p1 BOOLEAN;
  v_expected_index INTEGER;
  v_current_energy INTEGER;
  v_new_energy INTEGER;
  v_energy_gain INTEGER := 25;
  v_damage INTEGER := 0;
  v_combo_mult NUMERIC := 1.0;
  v_acc_ratio NUMERIC := 1.0;
  v_now TIMESTAMPTZ := TIMEZONE('utc', NOW());
  v_opp_hp INTEGER;
  v_new_p1_hp INTEGER;
  v_new_p2_hp INTEGER;
  v_new_p1_energy INTEGER;
  v_new_p2_energy INTEGER;
  v_new_p1_ult INTEGER;
  v_new_p2_ult INTEGER;
  v_winner UUID := NULL;
  v_finished BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Check idempotency: if event_id was already processed, return existing state
  IF EXISTS (
    SELECT 1 FROM public.multiplayer_match_events
    WHERE match_id = p_match_id AND event_id = p_event_id
  ) THEN
    SELECT * INTO v_match FROM public.multiplayer_matches WHERE id = p_match_id;
    RETURN v_match;
  END IF;

  -- 2. Lock match row
  SELECT * INTO v_match
  FROM public.multiplayer_matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  -- Verify active status or transition countdown -> playing
  IF v_match.status = 'countdown' AND v_match.started_at IS NOT NULL AND v_now >= v_match.started_at THEN
    v_match.status := 'playing';
  END IF;

  IF v_match.status <> 'playing' THEN
    RAISE EXCEPTION 'Match is not in active playing state (current: %)', v_match.status;
  END IF;

  v_is_p1 := (v_match.player_1_id = v_user_id);
  IF NOT v_is_p1 AND v_match.player_2_id <> v_user_id THEN
    RAISE EXCEPTION 'User not a participant in this match';
  END IF;

  -- 3. Verify sequential word progression (Anti-Cheat check)
  v_expected_index := CASE WHEN v_is_p1 THEN v_match.player_1_word_index ELSE v_match.player_2_word_index END;
  IF p_word_index <> v_expected_index THEN
    RAISE EXCEPTION 'Invalid word index: expected %, received %', v_expected_index, p_word_index;
  END IF;

  -- 3.1 Anti-Cheat: Validate combo cannot exceed completed word sequence
  IF p_combo > (p_word_index + 1) THEN
    RAISE EXCEPTION 'Anti-Cheat: Combo % exceeds maximum possible %', p_combo, (p_word_index + 1);
  END IF;

  -- 3.2 Anti-Cheat: Validate accuracy range
  IF p_accuracy < 0 OR p_accuracy > 100 THEN
    RAISE EXCEPTION 'Anti-Cheat: Invalid accuracy %', p_accuracy;
  END IF;

  -- 3.3 Anti-Cheat: Validate plausible human typing physics (reject impossible >260 WPM)
  IF p_wpm > 260 THEN
    RAISE EXCEPTION 'Anti-Cheat: Impossible typing velocity % WPM', p_wpm;
  END IF;

  -- 4. Calculate Attack Energy Gain
  -- Base: +25 energy. Bonus for high accuracy (>=98% -> +5), Combo >=10 (-> +5)
  IF p_accuracy >= 98 THEN
    v_energy_gain := v_energy_gain + 5;
  END IF;
  IF p_combo >= 10 THEN
    v_energy_gain := v_energy_gain + 5;
  END IF;

  v_current_energy := CASE WHEN v_is_p1 THEN v_match.player_1_attack_energy ELSE v_match.player_2_attack_energy END;
  v_new_energy := v_current_energy + v_energy_gain;

  -- 5. Attack Resolution at 100 Energy
  IF v_new_energy >= 100 THEN
    v_combo_mult := 1.0 + LEAST(1.5, p_combo * 0.05); -- e.g. 10 combo = 1.5x, 20 = 2.0x, max 2.5x
    v_acc_ratio := GREATEST(0.5, p_accuracy / 100.0);
    v_damage := ROUND(70.0 * v_combo_mult * v_acc_ratio);
    v_new_energy := v_new_energy - 100;
  ELSE
    v_damage := 0;
  END IF;

  -- 6. Apply state adjustments
  IF v_is_p1 THEN
    v_opp_hp := GREATEST(0, v_match.player_2_hp - v_damage);
    v_new_p1_hp := v_match.player_1_hp;
    v_new_p2_hp := v_opp_hp;
    v_new_p1_energy := v_new_energy;
    v_new_p2_energy := v_match.player_2_attack_energy;
    v_new_p1_ult := LEAST(100, v_match.player_1_ultimate_energy + 5);
    v_new_p2_ult := v_match.player_2_ultimate_energy;
  ELSE
    v_opp_hp := GREATEST(0, v_match.player_1_hp - v_damage);
    v_new_p1_hp := v_opp_hp;
    v_new_p2_hp := v_match.player_2_hp;
    v_new_p1_energy := v_match.player_1_attack_energy;
    v_new_p2_energy := v_new_energy;
    v_new_p1_ult := v_match.player_1_ultimate_energy;
    v_new_p2_ult := LEAST(100, v_match.player_2_ultimate_energy + 5);
  END IF;

  -- 7. Win Condition Check
  IF v_opp_hp <= 0 THEN
    v_finished := TRUE;
    v_winner := v_user_id;
  ELSIF (p_word_index + 1) >= v_match.word_count THEN
    v_finished := TRUE;
    IF v_new_p1_hp > v_new_p2_hp THEN
      v_winner := v_match.player_1_id;
    ELSIF v_new_p2_hp > v_new_p1_hp THEN
      v_winner := v_match.player_2_id;
    ELSE
      v_winner := NULL; -- Draw
    END IF;
  END IF;

  -- 8. Update Match State
  UPDATE public.multiplayer_matches
  SET
    status = CASE WHEN v_finished THEN 'finished' ELSE 'playing' END,
    winner_id = CASE WHEN v_finished THEN v_winner ELSE NULL END,
    is_draw = CASE WHEN v_finished AND v_winner IS NULL THEN TRUE ELSE FALSE END,
    finished_at = CASE WHEN v_finished THEN v_now ELSE NULL END,
    player_1_hp = v_new_p1_hp,
    player_2_hp = v_new_p2_hp,
    player_1_word_index = CASE WHEN v_is_p1 THEN p_word_index + 1 ELSE v_match.player_1_word_index END,
    player_2_word_index = CASE WHEN NOT v_is_p1 THEN p_word_index + 1 ELSE v_match.player_2_word_index END,
    player_1_combo = CASE WHEN v_is_p1 THEN p_combo ELSE v_match.player_1_combo END,
    player_2_combo = CASE WHEN NOT v_is_p1 THEN p_combo ELSE v_match.player_2_combo END,
    player_1_attack_energy = v_new_p1_energy,
    player_2_attack_energy = v_new_p2_energy,
    player_1_ultimate_energy = v_new_p1_ult,
    player_2_ultimate_energy = v_new_p2_ult,
    player_1_wpm = CASE WHEN v_is_p1 THEN p_wpm ELSE v_match.player_1_wpm END,
    player_2_wpm = CASE WHEN NOT v_is_p1 THEN p_wpm ELSE v_match.player_2_wpm END,
    player_1_accuracy = CASE WHEN v_is_p1 THEN p_accuracy ELSE v_match.player_1_accuracy END,
    player_2_accuracy = CASE WHEN NOT v_is_p1 THEN p_accuracy ELSE v_match.player_2_accuracy END,
    player_1_last_active_at = CASE WHEN v_is_p1 THEN v_now ELSE v_match.player_1_last_active_at END,
    player_2_last_active_at = CASE WHEN NOT v_is_p1 THEN v_now ELSE v_match.player_2_last_active_at END,
    updated_at = v_now
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  -- 9. Insert Event Log (Idempotent)
  INSERT INTO public.multiplayer_match_events (
    match_id,
    player_id,
    event_id,
    event_type,
    word_index,
    word_text,
    accuracy,
    wpm,
    combo,
    damage_dealt,
    payload
  ) VALUES (
    p_match_id,
    v_user_id,
    p_event_id,
    CASE WHEN v_damage > 0 THEN 'ATTACK_RESOLVED' ELSE 'WORD_COMPLETED' END,
    p_word_index,
    p_word_text,
    p_accuracy,
    p_wpm,
    p_combo,
    v_damage,
    jsonb_build_object(
      'energy_gain', v_energy_gain,
      'new_energy', v_new_energy,
      'damage', v_damage,
      'opponent_hp', v_opp_hp
    )
  );

  -- 10. Record Official Result if Finished
  IF v_finished THEN
    INSERT INTO public.multiplayer_match_results (
      match_id,
      mode,
      winner_id,
      loser_id,
      is_draw,
      duration_seconds,
      player_1_id,
      player_1_stats,
      player_1_xp_earned,
      player_2_id,
      player_2_stats,
      player_2_xp_earned
    ) VALUES (
      v_match.id,
      v_match.mode,
      v_match.winner_id,
      CASE WHEN v_winner IS NOT NULL THEN (CASE WHEN v_winner = v_match.player_1_id THEN v_match.player_2_id ELSE v_match.player_1_id END) ELSE NULL END,
      v_match.is_draw,
      GREATEST(1, ROUND(EXTRACT(EPOCH FROM (v_now - COALESCE(v_match.started_at, v_now))))::INTEGER),
      v_match.player_1_id,
      jsonb_build_object('wpm', v_match.player_1_wpm, 'accuracy', v_match.player_1_accuracy, 'hp', v_match.player_1_hp),
      CASE WHEN v_match.winner_id = v_match.player_1_id THEN 120 ELSE 40 END,
      v_match.player_2_id,
      jsonb_build_object('wpm', v_match.player_2_wpm, 'accuracy', v_match.player_2_accuracy, 'hp', v_match.player_2_hp),
      CASE WHEN v_match.winner_id = v_match.player_2_id THEN 120 ELSE 40 END
    ) ON CONFLICT (match_id) DO NOTHING;
  END IF;

  RETURN v_match;
END;
$$;

-- 6.5 TRIGGER MULTIPLAYER ULTIMATE
CREATE OR REPLACE FUNCTION public.trigger_ultimate(
  p_match_id UUID
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_is_p1 BOOLEAN;
  v_ult_damage INTEGER := 160;
  v_now TIMESTAMPTZ := TIMEZONE('utc', NOW());
  v_opp_hp INTEGER;
  v_finished BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_match
  FROM public.multiplayer_matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.status <> 'playing' THEN
    RAISE EXCEPTION 'Match is not currently playing';
  END IF;

  v_is_p1 := (v_match.player_1_id = v_user_id);
  IF NOT v_is_p1 AND v_match.player_2_id <> v_user_id THEN
    RAISE EXCEPTION 'User not a participant in this match';
  END IF;

  IF v_is_p1 THEN
    IF v_match.player_1_ultimate_energy < 100 THEN
      RAISE EXCEPTION 'Ultimate gauge not fully charged';
    END IF;
    v_opp_hp := GREATEST(0, v_match.player_2_hp - v_ult_damage);
    v_finished := (v_opp_hp <= 0);

    UPDATE public.multiplayer_matches
    SET
      player_1_ultimate_energy = 0,
      player_2_hp = v_opp_hp,
      status = CASE WHEN v_finished THEN 'finished' ELSE 'playing' END,
      winner_id = CASE WHEN v_finished THEN v_user_id ELSE NULL END,
      finished_at = CASE WHEN v_finished THEN v_now ELSE NULL END,
      updated_at = v_now
    WHERE id = p_match_id
    RETURNING * INTO v_match;
  ELSE
    IF v_match.player_2_ultimate_energy < 100 THEN
      RAISE EXCEPTION 'Ultimate gauge not fully charged';
    END IF;
    v_opp_hp := GREATEST(0, v_match.player_1_hp - v_ult_damage);
    v_finished := (v_opp_hp <= 0);

    UPDATE public.multiplayer_matches
    SET
      player_2_ultimate_energy = 0,
      player_1_hp = v_opp_hp,
      status = CASE WHEN v_finished THEN 'finished' ELSE 'playing' END,
      winner_id = CASE WHEN v_finished THEN v_user_id ELSE NULL END,
      finished_at = CASE WHEN v_finished THEN v_now ELSE NULL END,
      updated_at = v_now
    WHERE id = p_match_id
    RETURNING * INTO v_match;
  END IF;

  INSERT INTO public.multiplayer_match_events (
    match_id,
    player_id,
    event_id,
    event_type,
    damage_dealt,
    payload
  ) VALUES (
    p_match_id,
    v_user_id,
    'ult_' || MD5(RANDOM()::TEXT),
    'ULTIMATE_TRIGGERED',
    v_ult_damage,
    jsonb_build_object('ultimate_damage', v_ult_damage, 'opponent_hp', v_opp_hp)
  );

  -- Record Official Result if Ultimate finished the match
  IF v_finished THEN
    INSERT INTO public.multiplayer_match_results (
      match_id,
      mode,
      winner_id,
      loser_id,
      is_draw,
      duration_seconds,
      player_1_id,
      player_1_stats,
      player_1_xp_earned,
      player_2_id,
      player_2_stats,
      player_2_xp_earned
    ) VALUES (
      v_match.id,
      v_match.mode,
      v_match.winner_id,
      CASE WHEN v_match.winner_id = v_match.player_1_id THEN v_match.player_2_id ELSE v_match.player_1_id END,
      FALSE,
      GREATEST(1, ROUND(EXTRACT(EPOCH FROM (v_now - COALESCE(v_match.started_at, v_now))))::INTEGER),
      v_match.player_1_id,
      jsonb_build_object('wpm', v_match.player_1_wpm, 'accuracy', v_match.player_1_accuracy, 'hp', v_match.player_1_hp),
      CASE WHEN v_match.winner_id = v_match.player_1_id THEN 120 ELSE 40 END,
      v_match.player_2_id,
      jsonb_build_object('wpm', v_match.player_2_wpm, 'accuracy', v_match.player_2_accuracy, 'hp', v_match.player_2_hp),
      CASE WHEN v_match.winner_id = v_match.player_2_id THEN 120 ELSE 40 END
    ) ON CONFLICT (match_id) DO NOTHING;
  END IF;

  RETURN v_match;
END;
$$;

-- 6.6 FORFEIT MATCH
CREATE OR REPLACE FUNCTION public.forfeit_match(
  p_match_id UUID
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_winner UUID;
  v_now TIMESTAMPTZ := TIMEZONE('utc', NOW());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_match
  FROM public.multiplayer_matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.status = 'finished' OR v_match.status = 'cancelled' THEN
    RETURN v_match;
  END IF;

  IF v_match.player_1_id = v_user_id THEN
    v_winner := v_match.player_2_id;
  ELSIF v_match.player_2_id = v_user_id THEN
    v_winner := v_match.player_1_id;
  ELSE
    RAISE EXCEPTION 'User not a participant in this match';
  END IF;

  UPDATE public.multiplayer_matches
  SET
    status = 'finished',
    winner_id = v_winner,
    is_draw = FALSE,
    finished_at = v_now,
    updated_at = v_now
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  INSERT INTO public.multiplayer_match_events (
    match_id,
    player_id,
    event_id,
    event_type,
    payload
  ) VALUES (
    p_match_id,
    v_user_id,
    'forfeit_' || MD5(RANDOM()::TEXT),
    'FORFEIT',
    jsonb_build_object('forfeited_by', v_user_id)
  );

  -- Record Official Result upon Forfeit
  INSERT INTO public.multiplayer_match_results (
    match_id,
    mode,
    winner_id,
    loser_id,
    is_draw,
    duration_seconds,
    player_1_id,
    player_1_stats,
    player_1_xp_earned,
    player_2_id,
    player_2_stats,
    player_2_xp_earned
  ) VALUES (
    v_match.id,
    v_match.mode,
    v_winner,
    v_user_id,
    FALSE,
    GREATEST(1, ROUND(EXTRACT(EPOCH FROM (v_now - COALESCE(v_match.started_at, v_now))))::INTEGER),
    v_match.player_1_id,
    jsonb_build_object('wpm', v_match.player_1_wpm, 'accuracy', v_match.player_1_accuracy, 'hp', v_match.player_1_hp, 'forfeited', v_match.player_1_id = v_user_id),
    CASE WHEN v_winner = v_match.player_1_id THEN 120 ELSE 40 END,
    v_match.player_2_id,
    jsonb_build_object('wpm', v_match.player_2_wpm, 'accuracy', v_match.player_2_accuracy, 'hp', v_match.player_2_hp, 'forfeited', v_match.player_2_id = v_user_id),
    CASE WHEN v_winner = v_match.player_2_id THEN 120 ELSE 40 END
  ) ON CONFLICT (match_id) DO NOTHING;

  RETURN v_match;
END;
$$;

-- 6.7 CANCEL MATCH
CREATE OR REPLACE FUNCTION public.cancel_match(
  p_match_id UUID
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_now TIMESTAMPTZ := TIMEZONE('utc', NOW());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_match
  FROM public.multiplayer_matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.player_1_id <> v_user_id AND v_match.player_2_id <> v_user_id THEN
    RAISE EXCEPTION 'User not a participant in this match';
  END IF;

  IF v_match.status IN ('finished', 'cancelled') THEN
    RETURN v_match;
  END IF;

  UPDATE public.multiplayer_matches
  SET
    status = 'cancelled',
    finished_at = v_now,
    updated_at = v_now
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  RETURN v_match;
END;
$$;

-- 6.8 CASUAL QUICK MATCH MATCHMAKING
CREATE OR REPLACE FUNCTION public.find_or_create_quick_match(
  p_language TEXT DEFAULT 'pt-BR',
  p_skin_id TEXT DEFAULT 'default_forge'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_caller_username TEXT;
  v_caller_level INTEGER;
  v_caller_rank TEXT;
  v_waiting RECORD;
  v_new_match public.multiplayer_matches;
  v_seed BIGINT;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for matchmaking';
  END IF;

  SELECT username, level, rank INTO v_caller_username, v_caller_level, v_caller_rank
  FROM public.profiles WHERE id = v_caller_id;

  v_caller_username := COALESCE(v_caller_username, 'Shinobi');
  v_caller_level := COALESCE(v_caller_level, 1);
  v_caller_rank := COALESCE(v_caller_rank, 'E');

  -- Look for an existing waiting player
  SELECT * INTO v_waiting
  FROM public.multiplayer_queue
  WHERE status = 'searching'
    AND user_id <> v_caller_id
    AND updated_at >= NOW() - INTERVAL '60 seconds'
  ORDER BY queued_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    v_seed := FLOOR(RANDOM() * 1000000 + 1)::BIGINT;

    -- Create synchronized quick match
    INSERT INTO public.multiplayer_matches (
      mode,
      status,
      language,
      seed,
      word_count,
      player_1_id,
      player_2_id,
      player_1_skin_id,
      player_2_skin_id,
      player_1_ready,
      player_2_ready,
      started_at
    ) VALUES (
      'quick',
      'playing',
      p_language,
      v_seed,
      30,
      v_waiting.user_id,
      v_caller_id,
      v_waiting.skin_id,
      p_skin_id,
      true,
      true,
      TIMEZONE('utc', NOW())
    )
    RETURNING * INTO v_new_match;

    -- Update waiting player entry
    UPDATE public.multiplayer_queue
    SET status = 'matched',
        matched_match_id = v_new_match.id,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = v_waiting.id;

    -- Upsert caller entry
    INSERT INTO public.multiplayer_queue (
      user_id, username, level, rank, language, skin_id, status, matched_match_id, queued_at, updated_at
    ) VALUES (
      v_caller_id, v_caller_username, v_caller_level, v_caller_rank, p_language, p_skin_id, 'matched', v_new_match.id, TIMEZONE('utc', NOW()), TIMEZONE('utc', NOW())
    )
    ON CONFLICT (user_id) DO UPDATE
    SET status = 'matched',
        matched_match_id = v_new_match.id,
        updated_at = TIMEZONE('utc', NOW());

    RETURN jsonb_build_object(
      'status', 'matched',
      'match_id', v_new_match.id,
      'opponent_id', v_waiting.user_id,
      'opponent_username', v_waiting.username
    );
  ELSE
    -- No waiting player: register in queue
    INSERT INTO public.multiplayer_queue (
      user_id, username, level, rank, language, skin_id, status, matched_match_id, queued_at, updated_at
    ) VALUES (
      v_caller_id, v_caller_username, v_caller_level, v_caller_rank, p_language, p_skin_id, 'searching', NULL, TIMEZONE('utc', NOW()), TIMEZONE('utc', NOW())
    )
    ON CONFLICT (user_id) DO UPDATE
    SET status = 'searching',
        matched_match_id = NULL,
        language = p_language,
        skin_id = p_skin_id,
        queued_at = TIMEZONE('utc', NOW()),
        updated_at = TIMEZONE('utc', NOW());

    RETURN jsonb_build_object(
      'status', 'searching',
      'match_id', NULL
    );
  END IF;
END;
$$;

-- 6.9 LEAVE MULTIPLAYER QUEUE
CREATE OR REPLACE FUNCTION public.leave_multiplayer_queue()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.multiplayer_queue WHERE user_id = auth.uid();
END;
$$;

-- 6.10 CHECK MULTIPLAYER QUEUE
CREATE OR REPLACE FUNCTION public.check_multiplayer_queue()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  SELECT * INTO v_rec FROM public.multiplayer_queue WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'idle', 'matched_match_id', NULL);
  END IF;
  RETURN jsonb_build_object(
    'status', v_rec.status,
    'matched_match_id', v_rec.matched_match_id
  );
END;
$$;

-- 6.11 CLAIM DISCONNECT FORFEIT VICTORY
CREATE OR REPLACE FUNCTION public.claim_disconnect_forfeit(
  p_match_id UUID
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_disconnected_id UUID;
  v_now TIMESTAMPTZ := TIMEZONE('utc', NOW());
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_match
  FROM public.multiplayer_matches
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF v_match.status IN ('finished', 'cancelled') THEN
    RETURN v_match;
  END IF;

  IF v_match.player_1_id = v_caller_id THEN
    v_disconnected_id := v_match.player_2_id;
    -- Verify opponent has been inactive for at least 15 seconds
    IF v_match.player_2_last_active_at IS NOT NULL AND v_match.player_2_last_active_at > (v_now - INTERVAL '15 seconds') THEN
      RAISE EXCEPTION 'Reconnect grace period has not expired yet';
    END IF;
  ELSIF v_match.player_2_id = v_caller_id THEN
    v_disconnected_id := v_match.player_1_id;
    -- Verify opponent has been inactive for at least 15 seconds
    IF v_match.player_1_last_active_at > (v_now - INTERVAL '15 seconds') THEN
      RAISE EXCEPTION 'Reconnect grace period has not expired yet';
    END IF;
  ELSE
    RAISE EXCEPTION 'User not a participant in this match';
  END IF;

  UPDATE public.multiplayer_matches
  SET
    status = 'finished',
    winner_id = v_caller_id,
    is_draw = FALSE,
    finished_at = v_now,
    updated_at = v_now
  WHERE id = p_match_id
  RETURNING * INTO v_match;

  INSERT INTO public.multiplayer_match_events (
    match_id,
    player_id,
    event_id,
    event_type,
    payload
  ) VALUES (
    p_match_id,
    v_caller_id,
    'disc_forfeit_' || MD5(RANDOM()::TEXT),
    'DISCONNECT_FORFEIT',
    jsonb_build_object('forfeited_by', v_disconnected_id, 'winner_id', v_caller_id)
  );

  INSERT INTO public.multiplayer_match_results (
    match_id,
    mode,
    winner_id,
    loser_id,
    is_draw,
    duration_seconds,
    player_1_id,
    player_1_stats,
    player_1_xp_earned,
    player_2_id,
    player_2_stats,
    player_2_xp_earned
  ) VALUES (
    v_match.id,
    v_match.mode,
    v_caller_id,
    v_disconnected_id,
    FALSE,
    GREATEST(1, ROUND(EXTRACT(EPOCH FROM (v_now - COALESCE(v_match.started_at, v_now))))::INTEGER),
    v_match.player_1_id,
    jsonb_build_object('wpm', v_match.player_1_wpm, 'accuracy', v_match.player_1_accuracy, 'hp', v_match.player_1_hp, 'disconnected', v_match.player_1_id = v_disconnected_id),
    CASE WHEN v_caller_id = v_match.player_1_id THEN 120 ELSE 40 END,
    v_match.player_2_id,
    jsonb_build_object('wpm', v_match.player_2_wpm, 'accuracy', v_match.player_2_accuracy, 'hp', v_match.player_2_hp, 'disconnected', v_match.player_2_id = v_disconnected_id),
    CASE WHEN v_caller_id = v_match.player_2_id THEN 120 ELSE 40 END
  ) ON CONFLICT (match_id) DO NOTHING;

  RETURN v_match;
END;
$$;



