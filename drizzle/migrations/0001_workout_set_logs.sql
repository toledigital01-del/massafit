CREATE TABLE public.set_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise text NOT NULL,
  day date NOT NULL,
  set_number int NOT NULL CHECK (set_number BETWEEN 1 AND 10),
  weight numeric NOT NULL CHECK (weight >= 0 AND weight <= 500),
  reps int NOT NULL CHECK (reps BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise, day, set_number)
);
CREATE INDEX set_logs_user_ex ON public.set_logs(user_id, exercise, day DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.set_logs TO authenticated;
GRANT ALL ON public.set_logs TO service_role;
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.set_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.set_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.set_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.set_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);