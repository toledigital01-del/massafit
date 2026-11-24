export type ProfileInput = { name: string; sex: string; age: number; height: number; weight: number; target_weight: number; activity: number; training_days: number; shifts: boolean };
export const exampleProfile: ProfileInput = { name: 'Fernando', sex: 'male', age: 47, height: 177, weight: 69, target_weight: 75, activity: 1.55, training_days: 4, shifts: false };
export type Objective = 'gain' | 'lose' | 'maintain';
/** Objetivo deduzido do peso-meta: ±0,5 kg ou menos = manter. */
export function objectiveOf(p: Pick<ProfileInput, 'weight' | 'target_weight'>): Objective {
  const d = p.target_weight - p.weight;
  return d > 0.5 ? 'gain' : d < -0.5 ? 'lose' : 'maintain';
}
/** Ajuste diário padrão: +350 (ganho), −400 (emagrecer), 0 (manter). */
export const defaultAdjustment = (o: Objective) => (o === 'gain' ? 350 : o === 'lose' ? -400 : 0);
/** Piso de calorias: abaixo disso o app não monta meta (sexo feminino 1200, masculino 1500). */
export const calorieFloor = (sex: string) => (sex === 'female' ? 1200 : 1500);

/** `adj` > 0: superávit (250–500); `adj` < 0: déficit (−750 a −150); 0: manutenção. */
export function calculateGoals(p: ProfileInput, adj = 350) {
  const safe = adj < 0 ? Math.max(-750, Math.min(-150, adj)) : adj === 0 ? 0 : Math.max(250, Math.min(500, adj));
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const expenditure = bmr * p.activity;
  const calories = Math.max(calorieFloor(p.sex), Math.round(expenditure + safe));
  const protein = Math.round(p.weight * 2);
  const fat = Math.round(p.weight * (safe < 0 ? 0.8 : 0.95));
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { bmr: Math.round(bmr), expenditure: Math.round(expenditure), surplus: safe, calories, protein, fat, carbs, water: 3000 };
}
/** Semanas até o peso-meta: ganho 0,25–0,35 kg/sem; perda 0,25–0,75 kg/sem. */
export function projectionWeeks(current: number, target: number) {
  const gap = Math.abs(target - current);
  const [lo, hi] = target < current ? [0.25, 0.75] : [0.25, 0.35];
  return { fastest: Math.ceil(gap / hi), slowest: Math.ceil(gap / lo) };
}
export function localDay(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function portionMacros(food: { calories: number; protein: number; fat: number; carbs: number }, grams: number) {
  return { calories: Math.round(food.calories * grams / 100), protein: Math.round(food.protein * grams / 100 * 10)/10, fat: Math.round(food.fat * grams / 100 * 10)/10, carbs: Math.round(food.carbs * grams / 100 * 10)/10 };
}