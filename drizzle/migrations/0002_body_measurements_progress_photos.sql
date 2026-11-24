CREATE TABLE public.body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day date NOT NULL,
  waist numeric CHECK (waist BETWEEN 10 AND 250),
  chest numeric CHECK (chest BETWEEN 10 AND 250),
  hip numeric CHECK (hip BETWEEN 10 AND 250),
  arm numeric CHECK (arm BETWEEN 10 AND 250),
  thigh numeric CHECK (thigh BETWEEN 10 AND 250),
  calf numeric CHECK (calf BETWEEN 10 AND 250),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX body_measurements_user_day_key ON public.body_measurements (user_id, day);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_measurements TO authenticated;
GRANT ALL ON public.body_measurements TO service_role;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.body_measurements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.body_measurements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.body_measurements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.body_measurements FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day date NOT NULL,
  pose text NOT NULL CHECK (pose IN ('frente','lado','costas')),
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX progress_photos_user_day_pose_key ON public.progress_photos (user_id, day, pose);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_photos TO authenticated;
GRANT ALL ON public.progress_photos TO service_role;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.progress_photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.progress_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.progress_photos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.progress_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "progress photos own select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "progress photos own insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "progress photos own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "progress photos own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);