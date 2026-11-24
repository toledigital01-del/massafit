import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { calculateGoals, portionMacros } from './nutrition';

const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const getDashboard = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({day:daySchema})).handler(async ({data,context}) => {
  const db = context.supabase;
  const results = await Promise.all([
    db.from('profiles').select('*').eq('id',context.userId).single(),
    db.from('goals').select('*').eq('user_id',context.userId).maybeSingle(),
    db.from('food_items').select('*').order('name'),
    db.from('meal_logs').select('*').eq('user_id',context.userId).eq('day',data.day).order('created_at'),
    db.from('water_logs').select('*').eq('user_id',context.userId).eq('day',data.day),
    db.from('weight_logs').select('*').eq('user_id',context.userId).order('day',{ascending:false}).limit(60),
    db.from('supplement_logs').select('*').eq('user_id',context.userId).eq('day',data.day),
    db.from('food_favorites').select('food_id').eq('user_id',context.userId),
    db.from('meal_logs').select('*').eq('user_id',context.userId).order('created_at',{ascending:false}).limit(30),
  ]);
  for(const result of results) if(result.error) throw new Error('Não foi possível carregar seus registros. Tente novamente.');
  return {profile:results[0].data,goals:results[1].data,foods:results[2].data ?? [],meals:results[3].data ?? [],water:results[4].data ?? [],weights:results[5].data ?? [],supplements:results[6].data ?? [],favorites:results[7].data ?? [],recent:results[8].data ?? []};
});
const profileSchema = z.object({name:z.string().min(1).max(60),sex:z.enum(['male','female']),age:z.number().int().min(18).max(100),height:z.number().min(100).max(230),weight:z.number().min(30).max(300),target_weight:z.number().min(30).max(300),activity:z.number().min(1.2).max(1.9),training_days:z.number().int().min(0).max(7),shifts:z.boolean()});
const goalSchema = z.object({calories:z.number().int().min(1000).max(7000),protein:z.number().min(30).max(600),fat:z.number().min(20).max(300),carbs:z.number().min(0).max(1200),water:z.number().int().min(500).max(8000)});
export const saveProfile = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(z.object({profile:profileSchema,surplus:z.number().int().min(-750).max(500),overrides:goalSchema.optional()})).handler(async ({data,context}) => {
  const {bmr:_bmr,expenditure:_expenditure,...calculated} = calculateGoals(data.profile,data.surplus);
  // coluna `surplus` do banco só aceita o intervalo de ganho; déficit/manutenção ficam representados pelas calorias
  calculated.surplus = Math.max(250,calculated.surplus);
  const {error} = await context.supabase.from('profiles').update({...data.profile,onboarded:true}).eq('id',context.userId);
  if(error) throw new Error('Não foi possível salvar o perfil.');
  const goalResult = await context.supabase.from('goals').upsert({...calculated,...data.overrides,user_id:context.userId});
  if(goalResult.error) throw new Error('Não foi possível salvar as metas.');
  return true;
});
const actionSchema = z.discriminatedUnion('kind',[
  z.object({kind:z.literal('food'),day:daySchema,foodId:z.string().uuid(),grams:z.number().min(1).max(3000),meal:z.enum(['Café da manhã','Lanche','Almoço','Pré-treino','Jantar','Ceia'])}),
  z.object({kind:z.literal('water'),day:daySchema,amount:z.number().int().min(50).max(3000)}),
  z.object({kind:z.literal('weight'),day:daySchema,weight:z.number().min(30).max(300)}),
  z.object({kind:z.literal('supplement'),day:daySchema,taken:z.boolean(),dose:z.number().min(3).max(5)}),
  z.object({kind:z.literal('custom'),day:daySchema,meal:z.enum(['Café da manhã','Lanche','Almoço','Pré-treino','Jantar','Ceia']),items:z.array(z.object({name:z.string().min(1).max(80),grams:z.number().min(1).max(3000),calories:z.number().min(0).max(5000),protein:z.number().min(0).max(500),carbs:z.number().min(0).max(1000),fat:z.number().min(0).max(500)})).min(1).max(20)}),
  z.object({kind:z.literal('deleteMeal'),id:z.string().uuid()}),
  z.object({kind:z.literal('copyMeal'),from:daySchema,day:daySchema,meal:z.enum(['Café da manhã','Lanche','Almoço','Pré-treino','Jantar','Ceia'])}),
  z.object({kind:z.literal('favorite'),foodId:z.string().uuid(),favorite:z.boolean()}),
]);
export const recordAction = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(actionSchema).handler(async ({data,context}) => {
  const db = context.supabase; const user_id = context.userId;
  let result;
  switch(data.kind) {
    case 'food': {
      const foodResult = await db.from('food_items').select('*').eq('id',data.foodId).single();
      if(foodResult.error || !foodResult.data) throw new Error('Alimento não encontrado.');
      const food = foodResult.data;
      result = await db.from('meal_logs').insert({user_id,food_id:food.id,name:food.name,meal:data.meal,grams:data.grams,day:data.day,...portionMacros(food,data.grams)}); break;
    }
    case 'custom': result = await db.from('meal_logs').insert(data.items.map(i=>({...i,user_id,food_id:null,meal:data.meal,day:data.day}))); break;
    case 'water': result = await db.from('water_logs').insert({user_id,day:data.day,amount:data.amount}); break;
    case 'weight': result = await db.from('weight_logs').upsert({user_id,day:data.day,weight:data.weight},{onConflict:'user_id,day'}); break;
    case 'supplement': result = data.taken ? await db.from('supplement_logs').upsert({user_id,day:data.day,name:'Creatina',dose:data.dose},{onConflict:'user_id,name,day'}) : await db.from('supplement_logs').delete().eq('user_id',user_id).eq('day',data.day).eq('name','Creatina'); break;
    case 'copyMeal': {
      if(data.from===data.day) throw new Error('Escolha outro dia para copiar.');
      const src = await db.from('meal_logs').select('*').eq('user_id',user_id).eq('day',data.from).eq('meal',data.meal);
      if(src.error) throw new Error('Não foi possível ler a refeição de origem.');
      if(!src.data?.length) throw new Error('Não há registros dessa refeição no dia escolhido.');
      result = await db.from('meal_logs').insert(src.data.map(({id:_id,created_at:_c,...r})=>({...r,day:data.day}))); break;
    }
    case 'deleteMeal': result = await db.from('meal_logs').delete().eq('id',data.id).eq('user_id',user_id); break;
    case 'favorite': result = data.favorite ? await db.from('food_favorites').upsert({user_id,food_id:data.foodId}) : await db.from('food_favorites').delete().eq('user_id',user_id).eq('food_id',data.foodId); break;
  }
  if(result.error) throw new Error('Não foi possível salvar o registro. Tente novamente.');
  return true;
});