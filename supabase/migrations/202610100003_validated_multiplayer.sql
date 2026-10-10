-- Generated from the shipped RPCs; regenerate only after reviewing the diff.
BEGIN;
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
SET search_path = pg_catalog
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_code TEXT := NULL;
BEGIN
  IF p_mode IS DISTINCT FROM 'private' THEN RAISE EXCEPTION 'Quick matches must use the authoritative queue'; END IF;
  IF v_user_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.verified_cosmetics WHERE user_id=v_user_id AND cosmetic_id=p_skin_id) THEN RAISE EXCEPTION 'Authentication and owned skin required' USING ERRCODE='42501'; END IF;
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
    floor(random()*4294967296)::bigint,
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

CREATE OR REPLACE FUNCTION public.join_multiplayer_match(
  p_room_code TEXT,
  p_skin_id TEXT DEFAULT 'default_forge'
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_norm_code TEXT := UPPER(TRIM(p_room_code));
BEGIN
  IF v_user_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.verified_cosmetics WHERE user_id=v_user_id AND cosmetic_id=p_skin_id) THEN RAISE EXCEPTION 'Authentication and owned skin required' USING ERRCODE='42501'; END IF;
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
    player_2_last_active_at = clock_timestamp(),
    updated_at = clock_timestamp()
  WHERE id = v_match.id
  RETURNING * INTO v_match;

  RETURN v_match;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_player_ready(
  p_match_id UUID,
  p_ready BOOLEAN
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_p1_ready BOOLEAN;
  v_p2_ready BOOLEAN;
  v_both_ready BOOLEAN;
  v_now TIMESTAMPTZ := clock_timestamp();
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
  IF v_match.player_1_id IS DISTINCT FROM v_user_id AND v_match.player_2_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'User not a participant' USING ERRCODE='42501';
  END IF;

  IF v_match.status='countdown' AND (CASE WHEN v_match.player_1_id=v_user_id THEN v_match.player_1_ready ELSE v_match.player_2_ready END) IS NOT DISTINCT FROM p_ready THEN RETURN v_match; END IF;
  IF v_match.status NOT IN ('waiting','ready') THEN RAISE EXCEPTION 'Readiness cannot restart an active or resolved match'; END IF;
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

CREATE OR REPLACE FUNCTION keyforge_private.resolve_word_damage(
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
SET search_path = pg_catalog
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
  v_now TIMESTAMPTZ := clock_timestamp();
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
  IF v_match.player_1_id IS DISTINCT FROM v_user_id AND v_match.player_2_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'User not a participant' USING ERRCODE='42501';
  END IF;

  -- Verify active status or transition countdown -> playing
  IF v_match.status = 'countdown' AND v_match.started_at IS NOT NULL AND v_now >= v_match.started_at THEN
    v_match.status := 'playing';
  END IF;

  IF v_match.status <> 'playing' THEN
    RAISE EXCEPTION 'Match is not in active playing state (current: %)', v_match.status;
  END IF;

  v_is_p1 := (v_match.player_1_id = v_user_id);
  IF NOT v_is_p1 AND v_match.player_2_id IS DISTINCT FROM v_user_id THEN
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

CREATE OR REPLACE FUNCTION public.trigger_ultimate(
  p_match_id UUID
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_is_p1 BOOLEAN;
  v_ult_damage INTEGER := 160;
  v_now TIMESTAMPTZ := clock_timestamp();
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
  IF v_match.player_1_id IS DISTINCT FROM v_user_id AND v_match.player_2_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'User not a participant' USING ERRCODE='42501';
  END IF;

  IF v_match.status <> 'playing' THEN
    RAISE EXCEPTION 'Match is not currently playing';
  END IF;

  v_is_p1 := (v_match.player_1_id = v_user_id);
  IF NOT v_is_p1 AND v_match.player_2_id IS DISTINCT FROM v_user_id THEN
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

CREATE OR REPLACE FUNCTION public.forfeit_match(
  p_match_id UUID
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_winner UUID;
  v_now TIMESTAMPTZ := clock_timestamp();
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
  IF v_match.player_1_id IS DISTINCT FROM v_user_id AND v_match.player_2_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'User not a participant' USING ERRCODE='42501';
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

  IF v_match.started_at IS NULL OR v_match.player_2_id IS NULL OR v_match.status NOT IN ('playing','countdown') THEN RAISE EXCEPTION 'Match has not started'; END IF;
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

CREATE OR REPLACE FUNCTION public.cancel_match(
  p_match_id UUID
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_now TIMESTAMPTZ := clock_timestamp();
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
  IF v_match.player_1_id IS DISTINCT FROM v_user_id AND v_match.player_2_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'User not a participant' USING ERRCODE='42501';
  END IF;

  IF v_match.player_1_id <> v_user_id AND v_match.player_2_id IS DISTINCT FROM v_user_id THEN
    RAISE EXCEPTION 'User not a participant in this match';
  END IF;

  IF v_match.status IN ('finished', 'cancelled') THEN
    RETURN v_match;
  END IF;

  IF v_match.status='playing' THEN RAISE EXCEPTION 'Active matches require forfeit'; END IF;
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

CREATE OR REPLACE FUNCTION public.find_or_create_quick_match(
  p_language TEXT DEFAULT 'pt-BR',
  p_skin_id TEXT DEFAULT 'default_forge'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
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
  PERFORM pg_advisory_xact_lock(68473211);
  SELECT m.* INTO v_new_match FROM public.multiplayer_queue q JOIN public.multiplayer_matches m ON m.id=q.matched_match_id
   WHERE q.user_id=v_caller_id AND q.status='matched' AND m.status IN ('countdown','playing');
  IF FOUND THEN RETURN jsonb_build_object('status','matched','match_id',v_new_match.id); END IF;
  IF v_caller_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.verified_cosmetics WHERE user_id=v_caller_id AND cosmetic_id=p_skin_id) THEN RAISE EXCEPTION 'Authentication and owned skin required' USING ERRCODE='42501'; END IF;
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for matchmaking';
  END IF;

  SELECT p.username, (v.profile->>'level')::integer, v.profile->>'rank' INTO v_caller_username,v_caller_level,v_caller_rank FROM public.profiles p JOIN public.verified_players v ON v.user_id=p.id WHERE p.id=v_caller_id;

  v_caller_username := COALESCE(v_caller_username, 'Shinobi');
  v_caller_level := COALESCE(v_caller_level, 1);
  v_caller_rank := COALESCE(v_caller_rank, 'E');

  -- Look for an existing waiting player
  SELECT * INTO v_waiting
  FROM public.multiplayer_queue
  WHERE status = 'searching'
    AND user_id <> v_caller_id
    AND language=p_language
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
      clock_timestamp()
    )
    RETURNING * INTO v_new_match;

    -- Update waiting player entry
    UPDATE public.multiplayer_queue
    SET status = 'matched',
        matched_match_id = v_new_match.id,
        updated_at = clock_timestamp()
    WHERE id = v_waiting.id;

    -- Upsert caller entry
    INSERT INTO public.multiplayer_queue (
      user_id, username, level, rank, language, skin_id, status, matched_match_id, queued_at, updated_at
    ) VALUES (
      v_caller_id, v_caller_username, v_caller_level, v_caller_rank, p_language, p_skin_id, 'matched', v_new_match.id, clock_timestamp(), clock_timestamp()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET status = 'matched',
        matched_match_id = v_new_match.id,
        updated_at = clock_timestamp();

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
      v_caller_id, v_caller_username, v_caller_level, v_caller_rank, p_language, p_skin_id, 'searching', NULL, clock_timestamp(), clock_timestamp()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET status = 'searching',
        matched_match_id = NULL,
        language = p_language,
        skin_id = p_skin_id,
        queued_at = clock_timestamp(),
        updated_at = clock_timestamp();

    RETURN jsonb_build_object(
      'status', 'searching',
      'match_id', NULL
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_multiplayer_queue()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(68473211);
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
  DELETE FROM public.multiplayer_queue WHERE user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.check_multiplayer_queue()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_rec RECORD;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
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

CREATE OR REPLACE FUNCTION public.claim_disconnect_forfeit(
  p_match_id UUID
)
RETURNS public.multiplayer_matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_match public.multiplayer_matches;
  v_disconnected_id UUID;
  v_now TIMESTAMPTZ := clock_timestamp();
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
  IF v_match.player_1_id IS DISTINCT FROM v_caller_id AND v_match.player_2_id IS DISTINCT FROM v_caller_id THEN
    RAISE EXCEPTION 'User not a participant' USING ERRCODE='42501';
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

  IF v_match.started_at IS NULL OR v_match.player_2_id IS NULL OR v_match.status NOT IN ('playing','countdown') THEN RAISE EXCEPTION 'Match has not started'; END IF;
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
    'FORFEIT',
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

-- Mark only newly created matches. Existing legacy matches retain authority_version=0.
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
 d:=CASE WHEN p_language='en' THEN '{"short":["fire","wind","leaf","seal","clan","blade","dash","kage","soul","wave","sand","fist","strike","mark","edge","flow","palm","rush","iron","gate","path","dust","core","aura"],"medium":["chakra","jutsu","kunai","shuriken","shinobi","konoha","hokage","shadow","clones","scroll","lightning","torrent","barrier","impact","phantom","dragon","spiral","warrior","spirit","stealth","flame","recoil","strike","falcon","vision","instinct","master"],"long":["rasengan","chidori","sharingan","byakugan","amaterasu","susanoo","tsukuyomi","taijutsu","genjutsu","ninjutsu","senjutsu","summoning","destruction","resurrection","discipline","transformation","concentrate","legendary","teleport","annihilation","domination"]}'::jsonb ELSE '{"short":["fogo","raio","vento","agua","selo","cura","foco","kage","clan","vila","manto","dano","alma","arma","mira","onda","lama","arte","raiz","areia","golpe","furor","salto","guarda"],"medium":["chakra","jutsu","kunai","shuriken","shinobi","konoha","hokage","sharingan","byakugan","katon","suiton","raiton","doton","fuuton","espada","lamina","escudo","trovao","corrente","destino","guerreiro","sombra","clone","tecnica","defesa","ataque","impacto","espirito"],"long":["rasengan","chidori","amaterasu","susanoo","tsukuyomi","kamui","taijutsu","genjutsu","senjutsu","ninjutsu","ressurreicao","invocacao","transformacao","concentracao","velocidade","perfeicao","destruicao","tempestade","iluminacao","legendario","disciplina"]}'::jsonb END;
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
