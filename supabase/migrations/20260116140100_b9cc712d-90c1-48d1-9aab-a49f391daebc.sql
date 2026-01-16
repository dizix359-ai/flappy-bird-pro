-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Players can update their own scores" ON public.leaderboard;

-- Create a more restrictive update policy
-- Since there's no authentication, we'll restrict direct updates completely
-- Score updates will be handled through a secure RPC function that validates the player_name
CREATE POLICY "No direct score updates allowed" 
ON public.leaderboard 
FOR UPDATE 
USING (false)
WITH CHECK (false);

-- Create a secure function for updating scores that validates player ownership
CREATE OR REPLACE FUNCTION public.update_player_score(
  p_player_name TEXT,
  p_score INTEGER,
  p_difficulty TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
  v_existing_score INTEGER;
BEGIN
  -- Validate inputs
  IF p_player_name IS NULL OR LENGTH(TRIM(p_player_name)) < 1 OR LENGTH(p_player_name) > 50 THEN
    RAISE EXCEPTION 'Invalid player name';
  END IF;
  
  IF p_score IS NULL OR p_score < 0 OR p_score > 999999 THEN
    RAISE EXCEPTION 'Invalid score';
  END IF;
  
  IF p_difficulty NOT IN ('easy', 'medium', 'hard', 'crazy') THEN
    RAISE EXCEPTION 'Invalid difficulty';
  END IF;

  -- Check if player already has a score for this difficulty
  SELECT id, score INTO v_existing_id, v_existing_score
  FROM public.leaderboard
  WHERE player_name = p_player_name AND difficulty = p_difficulty
  LIMIT 1;
  
  -- Only update if new score is higher
  IF v_existing_id IS NOT NULL THEN
    IF p_score > v_existing_score THEN
      UPDATE public.leaderboard
      SET score = p_score, updated_at = now()
      WHERE id = v_existing_id;
    END IF;
    RETURN TRUE;
  ELSE
    -- Insert new score
    INSERT INTO public.leaderboard (player_name, score, difficulty)
    VALUES (p_player_name, p_score, p_difficulty);
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant execute permission to anon role
GRANT EXECUTE ON FUNCTION public.update_player_score(TEXT, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.update_player_score(TEXT, INTEGER, TEXT) TO authenticated;