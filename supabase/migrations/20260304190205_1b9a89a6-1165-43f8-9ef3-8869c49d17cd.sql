
CREATE TABLE public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  candidate_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  interview_type text NOT NULL DEFAULT 'Technical',
  questions jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'Pending',
  scheduled_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interviews" ON public.interviews FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all interviews" ON public.interviews FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
