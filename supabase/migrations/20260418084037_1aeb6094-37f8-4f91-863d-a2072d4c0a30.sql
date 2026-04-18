-- ── Adaptive Reinforcement Loop: schema ──

-- 1) Per-user term struggle tracking (Weakness Tracking System)
CREATE TABLE public.term_struggle (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID NOT NULL,
  incorrect_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  reinforcement_cycles INTEGER NOT NULL DEFAULT 0,
  last_attempted TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mastery_status TEXT NOT NULL DEFAULT 'weak', -- weak | improving | mastered
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, term_id)
);

CREATE INDEX idx_term_struggle_user ON public.term_struggle(user_id);
CREATE INDEX idx_term_struggle_status ON public.term_struggle(user_id, mastery_status);

ALTER TABLE public.term_struggle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own struggle" ON public.term_struggle
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own struggle" ON public.term_struggle
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own struggle" ON public.term_struggle
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own struggle" ON public.term_struggle
  FOR DELETE USING (auth.uid() = user_id);

-- 2) Structured journal entries (Journal + Reflection System)
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  term_id UUID,
  prompt_question TEXT NOT NULL DEFAULT '',
  user_response TEXT NOT NULL DEFAULT '',
  correctness BOOLEAN,
  reflection_type TEXT NOT NULL DEFAULT 'learning', -- quiz | activity | learning | reinforcement
  topic TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_user ON public.journal_entries(user_id, created_at DESC);
CREATE INDEX idx_journal_term ON public.journal_entries(user_id, term_id);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own journal" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own journal" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own journal" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own journal" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- 3) Touch trigger for updated_at on term_struggle
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_term_struggle_touch
  BEFORE UPDATE ON public.term_struggle
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Realtime
ALTER TABLE public.term_struggle REPLICA IDENTITY FULL;
ALTER TABLE public.journal_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.term_struggle;
ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;