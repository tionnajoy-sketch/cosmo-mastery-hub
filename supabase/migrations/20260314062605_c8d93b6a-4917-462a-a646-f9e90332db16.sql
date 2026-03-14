
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  user_name text,
  total_coins integer,
  blocks_mastered integer,
  current_streak integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.name AS user_name,
    COALESCE(uc.coins, 0) AS total_coins,
    COALESCE(uc.blocks_mastered, 0) AS blocks_mastered,
    0 AS current_streak
  FROM profiles p
  LEFT JOIN user_coins uc ON uc.user_id = p.id
  WHERE p.leaderboard_preference = 'global'
  ORDER BY COALESCE(uc.coins, 0) DESC
  LIMIT 50;
END;
$$;
