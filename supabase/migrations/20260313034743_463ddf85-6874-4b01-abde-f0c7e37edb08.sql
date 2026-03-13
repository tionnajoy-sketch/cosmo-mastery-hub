
CREATE TABLE public.uploaded_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid REFERENCES public.uploaded_modules(id) ON DELETE CASCADE NOT NULL,
  block_number integer NOT NULL DEFAULT 1,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'practice',
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.uploaded_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own uploaded quiz results" ON public.uploaded_quiz_results
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own uploaded quiz results" ON public.uploaded_quiz_results
  FOR SELECT TO public USING (auth.uid() = user_id);
