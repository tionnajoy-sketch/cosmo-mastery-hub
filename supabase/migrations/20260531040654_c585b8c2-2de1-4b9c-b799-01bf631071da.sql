
-- Add prerequisites column to tj_lessons for pathway visualization
ALTER TABLE public.tj_lessons ADD COLUMN IF NOT EXISTS prerequisites text[];

-- Backfill prerequisites for Skin Structure & Growth cluster (progression chain)
UPDATE public.tj_lessons SET prerequisites = ARRAY[]::text[] WHERE slug = 'cells';
UPDATE public.tj_lessons SET prerequisites = ARRAY['cells'] WHERE slug = 'tissue';
UPDATE public.tj_lessons SET prerequisites = ARRAY['tissue'] WHERE slug = 'epidermis';
UPDATE public.tj_lessons SET prerequisites = ARRAY['epidermis'] WHERE slug = 'dermis';
UPDATE public.tj_lessons SET prerequisites = ARRAY['dermis'] WHERE slug = 'subcutaneous';
UPDATE public.tj_lessons SET prerequisites = ARRAY['epidermis'] WHERE slug = 'melanocyte';
UPDATE public.tj_lessons SET prerequisites = ARRAY['melanocyte'] WHERE slug = 'melanin';
UPDATE public.tj_lessons SET prerequisites = ARRAY['epidermis'] WHERE slug = 'keratin';
UPDATE public.tj_lessons SET prerequisites = ARRAY['dermis'] WHERE slug = 'collagen';
UPDATE public.tj_lessons SET prerequisites = ARRAY['collagen'] WHERE slug = 'elastin';

-- New table for cached TJ contextual reflection responses
CREATE TABLE IF NOT EXISTS public.tj_reflection_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_slug text NOT NULL,
  reflection_text text NOT NULL,
  tj_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tj_reflection_responses TO authenticated;
GRANT ALL ON public.tj_reflection_responses TO service_role;

ALTER TABLE public.tj_reflection_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own reflection responses"
  ON public.tj_reflection_responses FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reflection responses"
  ON public.tj_reflection_responses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own reflection responses"
  ON public.tj_reflection_responses FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tj_reflection_responses_user_lesson
  ON public.tj_reflection_responses (user_id, lesson_slug, created_at DESC);

CREATE TRIGGER trg_tj_reflection_responses_updated_at
  BEFORE UPDATE ON public.tj_reflection_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
