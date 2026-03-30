ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS tj_dna_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selected_program text DEFAULT 'cosmetology',
  ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dna_layer_strength text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dna_engagement integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dna_retention text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dna_confidence text DEFAULT NULL;