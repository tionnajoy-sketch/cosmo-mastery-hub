CREATE TABLE IF NOT EXISTS public.assessment_dna (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID NOT NULL,
  accuracy_score INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_answer_correct BOOLEAN,
  confidence_signal TEXT,
  dominant_gap TEXT,
  reteach_trigger BOOLEAN NOT NULL DEFAULT false,
  recommended_static_action TEXT,
  last_review_path TEXT,
  mastery_status TEXT NOT NULL DEFAULT 'New',
  first_attempt_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, term_id)
);

ALTER TABLE public.assessment_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own assessment dna"
  ON public.assessment_dna FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own assessment dna"
  ON public.assessment_dna FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own assessment dna"
  ON public.assessment_dna FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER touch_assessment_dna_updated_at
  BEFORE UPDATE ON public.assessment_dna
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();