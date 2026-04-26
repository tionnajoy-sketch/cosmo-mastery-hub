
-- Admin aggregation function: returns one row per (user, term)
-- combining all behavior signals. Gated by admin role.
CREATE OR REPLACE FUNCTION public.admin_learner_behavior()
RETURNS TABLE (
  user_id uuid,
  user_name text,
  term_id uuid,
  term_name text,
  section_id uuid,
  section_name text,
  block_number integer,
  chapter_label text,
  confidence_rating numeric,
  understanding_status text,
  preferred_thinking_path text,
  error_type text,
  second_chance_behavior text,
  recovery_pattern text,
  most_skipped_layer text,
  breakdown_point text,
  cognitive_load text,
  preferred_mode text,
  mastery_status text,
  last_reviewed_at timestamptz,
  review_due_at timestamptz,
  incorrect_attempts integer,
  reflection_skips integer,
  memory_anchor_skips integer,
  quiz_avoidance_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  RETURN QUERY
  WITH base AS (
    -- Every (user, term) pair that has any signal at all
    SELECT DISTINCT ts.user_id, ts.term_id FROM public.term_struggle ts
    UNION
    SELECT DISTINCT ad.user_id, ad.term_id FROM public.assessment_dna ad
    UNION
    SELECT DISTINCT cr.user_id, cr.term_id FROM public.confidence_ratings cr WHERE cr.term_id IS NOT NULL
    UNION
    SELECT DISTINCT et.user_id, et.term_id FROM public.error_type_picks et WHERE et.term_id IS NOT NULL
    UNION
    SELECT DISTINCT sc.user_id, sc.term_id FROM public.second_chance_picks sc WHERE sc.term_id IS NOT NULL
    UNION
    SELECT DISTINCT bp.user_id, bp.term_id FROM public.breakdown_point_picks bp WHERE bp.term_id IS NOT NULL
    UNION
    SELECT DISTINCT cl.user_id, cl.term_id FROM public.cognitive_load_snapshots cl WHERE cl.term_id IS NOT NULL
    UNION
    SELECT DISTINCT lm.user_id, lm.term_id FROM public.learning_mode_stats lm WHERE lm.term_id IS NOT NULL
    UNION
    SELECT DISTINCT te.user_id, te.term_id FROM public.term_entry_choices te WHERE te.term_id IS NOT NULL
    UNION
    SELECT DISTINCT mf.user_id, mf.term_id FROM public.micro_decision_flags mf WHERE mf.term_id IS NOT NULL
  ),
  conf AS (
    SELECT user_id, term_id,
           AVG(confidence_rating)::numeric(4,2) AS confidence_rating,
           (ARRAY_AGG(understanding_status ORDER BY created_at DESC))[1] AS understanding_status
    FROM public.confidence_ratings
    WHERE term_id IS NOT NULL
    GROUP BY user_id, term_id
  ),
  thinking AS (
    SELECT DISTINCT ON (user_id, term_id) user_id, term_id, preferred_thinking_path
    FROM public.term_entry_choices
    WHERE term_id IS NOT NULL
    ORDER BY user_id, term_id, created_at DESC
  ),
  err AS (
    SELECT user_id, term_id,
           (mode() WITHIN GROUP (ORDER BY error_type)) AS error_type
    FROM public.error_type_picks
    WHERE term_id IS NOT NULL
    GROUP BY user_id, term_id
  ),
  sc AS (
    SELECT DISTINCT ON (user_id, term_id) user_id, term_id, second_chance_behavior, recovery_pattern
    FROM public.second_chance_picks
    WHERE term_id IS NOT NULL
    ORDER BY user_id, term_id, created_at DESC
  ),
  bp AS (
    SELECT user_id, term_id,
           (mode() WITHIN GROUP (ORDER BY breakdown_point)) AS breakdown_point
    FROM public.breakdown_point_picks
    WHERE term_id IS NOT NULL
    GROUP BY user_id, term_id
  ),
  cl AS (
    SELECT DISTINCT ON (user_id, term_id) user_id, term_id, cognitive_load
    FROM public.cognitive_load_snapshots
    WHERE term_id IS NOT NULL
    ORDER BY user_id, term_id, created_at DESC
  ),
  lm AS (
    SELECT DISTINCT ON (user_id, term_id) user_id, term_id, preferred_mode
    FROM public.learning_mode_stats
    WHERE term_id IS NOT NULL
    ORDER BY user_id, term_id, updated_at DESC
  ),
  flag_counts AS (
    SELECT user_id, term_id,
           SUM(CASE WHEN flag = 'skipped_reflection'    THEN occurrence_count ELSE 0 END)::int AS reflection_skips,
           SUM(CASE WHEN flag = 'skipped_memory_anchor' THEN occurrence_count ELSE 0 END)::int AS memory_anchor_skips,
           SUM(CASE WHEN flag = 'quiz_avoidance'        THEN occurrence_count ELSE 0 END)::int AS quiz_avoidance_count
    FROM public.micro_decision_flags
    WHERE term_id IS NOT NULL
    GROUP BY user_id, term_id
  ),
  most_skipped AS (
    -- Most-skipped layer per (user, term) inferred from micro_decision_events action='skipped'
    SELECT user_id, term_id,
           (mode() WITHIN GROUP (ORDER BY surface)) AS most_skipped_layer
    FROM public.micro_decision_events
    WHERE term_id IS NOT NULL AND action = 'skipped' AND surface <> ''
    GROUP BY user_id, term_id
  ),
  status AS (
    SELECT user_id, term_id, status, last_reviewed_at
    FROM public.term_learning_status
  )
  SELECT
    b.user_id,
    COALESCE(p.name, 'Learner') AS user_name,
    b.term_id,
    t.term AS term_name,
    t.section_id,
    s.name AS section_name,
    t.block_number,
    (COALESCE(s.name, 'Section') || ' · Block ' || t.block_number::text) AS chapter_label,
    conf.confidence_rating,
    conf.understanding_status,
    thinking.preferred_thinking_path,
    err.error_type,
    sc.second_chance_behavior,
    sc.recovery_pattern,
    most_skipped.most_skipped_layer,
    bp.breakdown_point,
    cl.cognitive_load,
    lm.preferred_mode,
    COALESCE(ad.mastery_status, status.status, 'New') AS mastery_status,
    COALESCE(status.last_reviewed_at, ad.updated_at) AS last_reviewed_at,
    CASE
      WHEN COALESCE(ad.mastery_status, status.status, '') ILIKE 'master%' THEN NULL
      ELSE COALESCE(status.last_reviewed_at, ad.updated_at) + INTERVAL '7 days'
    END AS review_due_at,
    COALESCE(ts.incorrect_attempts, 0) AS incorrect_attempts,
    COALESCE(flag_counts.reflection_skips, 0) AS reflection_skips,
    COALESCE(flag_counts.memory_anchor_skips, 0) AS memory_anchor_skips,
    COALESCE(flag_counts.quiz_avoidance_count, 0) AS quiz_avoidance_count
  FROM base b
  LEFT JOIN public.terms t ON t.id = b.term_id
  LEFT JOIN public.sections s ON s.id = t.section_id
  LEFT JOIN public.profiles p ON p.id = b.user_id
  LEFT JOIN public.term_struggle ts ON ts.user_id = b.user_id AND ts.term_id = b.term_id
  LEFT JOIN public.assessment_dna ad ON ad.user_id = b.user_id AND ad.term_id = b.term_id
  LEFT JOIN conf ON conf.user_id = b.user_id AND conf.term_id = b.term_id
  LEFT JOIN thinking ON thinking.user_id = b.user_id AND thinking.term_id = b.term_id
  LEFT JOIN err ON err.user_id = b.user_id AND err.term_id = b.term_id
  LEFT JOIN sc ON sc.user_id = b.user_id AND sc.term_id = b.term_id
  LEFT JOIN bp ON bp.user_id = b.user_id AND bp.term_id = b.term_id
  LEFT JOIN cl ON cl.user_id = b.user_id AND cl.term_id = b.term_id
  LEFT JOIN lm ON lm.user_id = b.user_id AND lm.term_id = b.term_id
  LEFT JOIN flag_counts ON flag_counts.user_id = b.user_id AND flag_counts.term_id = b.term_id
  LEFT JOIN most_skipped ON most_skipped.user_id = b.user_id AND most_skipped.term_id = b.term_id
  LEFT JOIN status ON status.user_id = b.user_id AND status.term_id = b.term_id
  WHERE b.term_id IS NOT NULL
  ORDER BY user_name, chapter_label, term_name;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_learner_behavior() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_learner_behavior() TO authenticated;
