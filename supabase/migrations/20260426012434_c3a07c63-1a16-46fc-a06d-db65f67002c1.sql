CREATE TABLE public.session_balance_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL,
  session_balance_flag TEXT NOT NULL DEFAULT '',
  learning_ms INTEGER NOT NULL DEFAULT 0,
  support_ms INTEGER NOT NULL DEFAULT 0,
  quiz_ms INTEGER NOT NULL DEFAULT 0,
  cafe_ms INTEGER NOT NULL DEFAULT 0,
  total_active_ms INTEGER NOT NULL DEFAULT 0,
  ignore_count INTEGER NOT NULL DEFAULT 0,
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.session_balance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own session balance"
ON public.session_balance_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own session balance"
ON public.session_balance_events FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_session_balance_user_created ON public.session_balance_events(user_id, created_at DESC);