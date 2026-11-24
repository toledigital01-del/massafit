ALTER TABLE public.food_items ADD COLUMN food_group text NOT NULL DEFAULT 'outros';
ALTER TABLE public.food_items ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
CREATE TABLE public.meal_plan_settings (
  user_id uuid PRIMARY KEY,
  meal_count int NOT NULL DEFAULT 6 CHECK (meal_count BETWEEN 4 AND 6),
  excluded text[] NOT NULL DEFAULT '{}',
  restrictions text[] NOT NULL DEFAULT '{}',
  economic boolean NOT NULL DEFAULT false,
  swaps jsonb NOT NULL DEFAULT '{}',
  menus jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plan_settings TO authenticated;
GRANT ALL ON public.meal_plan_settings TO service_role;
ALTER TABLE public.meal_plan_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.meal_plan_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.meal_plan_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.meal_plan_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.meal_plan_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);