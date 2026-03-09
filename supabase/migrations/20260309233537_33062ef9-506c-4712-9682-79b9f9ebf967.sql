
CREATE TABLE public.term_learning_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  term_id uuid NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'still_learning',
  last_reviewed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, term_id)
);

ALTER TABLE public.term_learning_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own term status" ON public.term_learning_status FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own term status" ON public.term_learning_status FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own term status" ON public.term_learning_status FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own term status" ON public.term_learning_status FOR DELETE TO authenticated USING (auth.uid() = user_id);
