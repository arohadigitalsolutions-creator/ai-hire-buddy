ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS jd_text text,
  ADD COLUMN IF NOT EXISTS resume_text text,
  ADD COLUMN IF NOT EXISTS resume_skill_match integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interview_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_fit_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS confidence_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS suspicion_level text DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS report jsonb,
  ADD COLUMN IF NOT EXISTS current_question_index integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversation jsonb DEFAULT '[]'::jsonb;