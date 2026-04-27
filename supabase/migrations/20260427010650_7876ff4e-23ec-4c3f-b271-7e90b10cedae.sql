-- DNA Action Log: one row per learner action with full before/after DNA snapshot.
-- Sits alongside dna_progress_events (which logs per-field changes).
-- Powers the admin debug view and rule-validation tests.

CREATE TABLE IF NOT EXISTS public.dna_action_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  term_id         uuid,
  module_id       uuid,
  lesson_label    text NOT NULL DEFAULT '',
  layer           text NOT NULL DEFAULT '',
  action          text NOT NULL,
  correct         boolean,
  reattempt       boolean NOT NULL DEFAULT false,
  time_spent_ms   integer NOT NULL DEFAULT 0,
  reinforcement_triggered boolean NOT NULL DEFAULT false,
  accuracy_score  integer NOT NULL DEFAULT 0,
  dna_before      jsonb NOT NULL DEFAULT '{}'::jsonb,
  dna_after       jsonb NOT NULL DEFAULT '{}'::jsonb,
  delta           jsonb NOT NULL DEFAULT '{}'::jsonb,
  reasons         jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dna_action_log_user_created
  ON public.dna_action_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dna_action_log_term
  ON public.dna_action_log (term_id);

ALTER TABLE public.dna_action_log ENABLE ROW LEVEL SECURITY;

-- Validation: action must be one of the allowed values.
CREATE OR REPLACE FUNCTION public.validate_dna_action_log()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.action NOT IN ('correct','incorrect','retry','skip','complete','reinforcement','time') THEN
    RAISE EXCEPTION 'Invalid dna_action_log.action: %', NEW.action;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_dna_action_log ON public.dna_action_log;
CREATE TRIGGER trg_validate_dna_action_log
  BEFORE INSERT ON public.dna_action_log
  FOR EACH ROW EXECUTE FUNCTION public.validate_dna_action_log();

-- RLS: users see + insert their own; admins see everything.
CREATE POLICY "Users insert own dna actions"
  ON public.dna_action_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own dna actions"
  ON public.dna_action_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all dna actions"
  ON public.dna_action_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin debug RPC: current DNA + last 10 actions + accuracy per lesson + reinforcement triggers.
CREATE OR REPLACE FUNCTION public.admin_dna_debug(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_dna jsonb;
  recent_actions jsonb;
  lesson_accuracy jsonb;
  reinforcement_triggers jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT COALESCE(brain_strengths, '{}'::jsonb)
    INTO current_dna
    FROM public.profiles
    WHERE id = _user_id;

  SELECT COALESCE(jsonb_agg(row_to_json(a) ORDER BY a.created_at DESC), '[]'::jsonb)
    INTO recent_actions
    FROM (
      SELECT id, term_id, lesson_label, layer, action, correct, reattempt,
             reinforcement_triggered, accuracy_score, dna_before, dna_after,
             delta, reasons, created_at
        FROM public.dna_action_log
        WHERE user_id = _user_id
        ORDER BY created_at DESC
        LIMIT 10
    ) a;

  SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb)
    INTO lesson_accuracy
    FROM (
      SELECT lesson_label,
             COUNT(*) FILTER (WHERE correct IS NOT NULL) AS attempts,
             COUNT(*) FILTER (WHERE correct = true) AS correct_count,
             ROUND(
               100.0 * COUNT(*) FILTER (WHERE correct = true)
                     / NULLIF(COUNT(*) FILTER (WHERE correct IS NOT NULL), 0),
               1
             ) AS accuracy_pct
        FROM public.dna_action_log
        WHERE user_id = _user_id AND lesson_label <> ''
        GROUP BY lesson_label
        ORDER BY MAX(created_at) DESC
        LIMIT 20
    ) b;

  SELECT COALESCE(jsonb_agg(row_to_json(c) ORDER BY c.created_at DESC), '[]'::jsonb)
    INTO reinforcement_triggers
    FROM (
      SELECT lesson_label, layer, created_at, accuracy_score
        FROM public.dna_action_log
        WHERE user_id = _user_id AND reinforcement_triggered = true
        ORDER BY created_at DESC
        LIMIT 20
    ) c;

  RETURN jsonb_build_object(
    'user_id', _user_id,
    'current_dna', current_dna,
    'recent_actions', recent_actions,
    'lesson_accuracy', lesson_accuracy,
    'reinforcement_triggers', reinforcement_triggers,
    'generated_at', now()
  );
END;
$$;