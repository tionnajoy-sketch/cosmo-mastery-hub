ALTER TABLE public.terms
ADD COLUMN IF NOT EXISTS lesson_narrative jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.terms.lesson_narrative IS
'Structured narrative lesson content: { title, key_point, sections: [{ heading, body }], memory_cue, mentor_check_in, purpose }';