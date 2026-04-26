-- Confidence ratings: captured per question across all quiz/practice/assessment surfaces
CREATE TABLE public.confidence_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  surface text NOT NULL,                       -- 'section_quiz' | 'pop_quiz' | 'random_quiz' | 'module_quiz' | 'module_quiz_bank' | 'pretest' | 'posttest' | 'final_exam' | 'comprehensive_final' | 'orb_assess' | 'practice'
  question_ref text NOT NULL DEFAULT '',       -- question id or hash if synthetic
  question_text text NOT NULL DEFAULT '',
  section_id uuid,
  module_id uuid,
  term_id uuid,
  block_number integer,
  is_correct boolean NOT NULL,
  confidence_rating integer NOT NULL CHECK (confidence_rating BETWEEN 1 AND 5),
  understanding_status text NOT NULL,          -- 'fragile_understanding' | 'strong_misconception' | 'strong_understanding' | 'recognized_uncertainty' | 'building_understanding' | 'developing_misconception'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.confidence_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own confidence ratings"
ON public.confidence_ratings
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own confidence ratings"
ON public.confidence_ratings
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_confidence_ratings_user_created ON public.confidence_ratings(user_id, created_at DESC);
CREATE INDEX idx_confidence_ratings_user_status ON public.confidence_ratings(user_id, understanding_status);
CREATE INDEX idx_confidence_ratings_term ON public.confidence_ratings(user_id, term_id);
