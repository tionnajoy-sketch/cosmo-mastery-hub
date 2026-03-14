
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS birth_month integer,
  ADD COLUMN IF NOT EXISTS birth_year integer,
  ADD COLUMN IF NOT EXISTS sex text DEFAULT 'prefer_not_to_say',
  ADD COLUMN IF NOT EXISTS tone_preference text DEFAULT 'gentle',
  ADD COLUMN IF NOT EXISTS leaderboard_preference text DEFAULT 'private';
