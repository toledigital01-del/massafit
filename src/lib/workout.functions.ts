import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getSetLogs = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({since:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)})).handler(async ({data,context}) => {
  const {data:rows,error} = await context.supabase.from('set_logs').select('*').eq('user_id',context.userId).gte('day',data.since).order('day',{ascending:true}).order('set_number');
  if(error) throw new Error('Não foi possível carregar seus treinos.');
  return rows ?? [];
});
const setSchema = z.object({exercise:z.string().min(1).max(60),day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),set_number:z.number().int().min(1).max(10),weight:z.number().min(0).max(500),reps:z.number().int().min(1).max(100)});
export const saveSet = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.union([setSchema.extend({remove:z.literal(false)}),setSchema.pick({exercise:true,day:true,set_number:true}).extend({remove:z.literal(true)})])).handler(async ({data,context}) => {
  const db = context.supabase; const user_id = context.userId;
  const result = data.remove
    ? await db.from('set_logs').delete().eq('user_id',user_id).eq('exercise',data.exercise).eq('day',data.day).eq('set_number',data.set_number)
    : await db.from('set_logs').upsert({user_id,exercise:data.exercise,day:data.day,set_number:data.set_number,weight:data.weight,reps:data.reps},{onConflict:'user_id,exercise,day,set_number'});
  if(result.error) throw new Error('Não foi possível salvar a série.');
  return true;
});
