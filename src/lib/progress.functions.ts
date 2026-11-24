import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const cm = z.number().min(10).max(250).nullable().default(null);

export const getProgress = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [m, p] = await Promise.all([
    context.supabase.from('body_measurements').select('*').eq('user_id', context.userId).order('day', { ascending: false }).limit(60),
    context.supabase.from('progress_photos').select('*').eq('user_id', context.userId).order('day', { ascending: false }).limit(60),
  ]);
  if (m.error || p.error) throw new Error('Não foi possível carregar seu progresso.');
  return { measurements: m.data ?? [], photos: p.data ?? [] };
});

export const saveMeasurement = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ day, waist: cm, chest: cm, hip: cm, arm: cm, thigh: cm, calf: cm }).refine(v => [v.waist, v.chest, v.hip, v.arm, v.thigh, v.calf].some(x => typeof x === 'number'), 'Informe ao menos uma medida.'))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from('body_measurements').upsert({ ...data, user_id: context.userId }, { onConflict: 'user_id,day' });
    if (error) throw new Error('Não foi possível salvar as medidas.');
    return true;
  });

export const savePhotoRecord = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ day, pose: z.enum(['frente', 'lado', 'costas']), path: z.string().min(5).max(200) }))
  .handler(async ({ data, context }) => {
    if (!data.path.startsWith(`${context.userId}/`)) throw new Error('Caminho de foto inválido.');
    const { error } = await context.supabase.from('progress_photos').upsert({ ...data, user_id: context.userId }, { onConflict: 'user_id,day,pose' });
    if (error) throw new Error('Não foi possível salvar a foto.');
    return true;
  });

/** Aplica o ajuste do check-in: muda as calorias da meta e absorve a diferença nos carboidratos (4 kcal/g). */
export const applyCalorieAdjustment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ delta: z.number().int().min(-300).max(300) }))
  .handler(async ({ data, context }) => {
    const cur = await context.supabase.from('goals').select('*').eq('user_id', context.userId).maybeSingle();
    if (cur.error || !cur.data) throw new Error('Defina seu perfil e metas antes de ajustar.');
    const calories = Math.min(7000, Math.max(1000, cur.data.calories + data.delta));
    const carbs = Math.max(0, Math.round(cur.data.carbs + (calories - cur.data.calories) / 4));
    const { error } = await context.supabase.from('goals').update({ calories, carbs }).eq('user_id', context.userId);
    if (error) throw new Error('Não foi possível atualizar a meta.');
    return { calories, carbs };
  });
