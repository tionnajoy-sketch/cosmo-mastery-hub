ALTER TABLE public.terms
ADD COLUMN IF NOT EXISTS deep_dive_content jsonb;

COMMENT ON COLUMN public.terms.deep_dive_content IS 'Optional Deep Dive with TJ section: hook, expanded_breakdown, analogy, challenge, memory_cue, why_it_matters, mentor_check_in. Generated on-demand and cached.';