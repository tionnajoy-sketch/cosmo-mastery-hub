
ALTER TABLE public.tj_lessons
  ADD COLUMN IF NOT EXISTS why_it_matters TEXT,
  ADD COLUMN IF NOT EXISTS accent_color TEXT;
