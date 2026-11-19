export type ProfileInput = { name: string; sex: string; age: number; height: number; weight: number; target_weight: number; activity: number; training_days: number; shifts: boolean };
export const exampleProfile: ProfileInput = { name: 'Fernando', sex: 'male', age: 47, height: 177, weight: 69, target_weight: 75, activity: 1.55, training_days: 4, shifts: false };
export function calculateGoals(p: ProfileInput, surplus = 350) {
  const safeSurplus = Math.max(250, Math.min(500, surplus));
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const expenditure = bmr * p.activity;
  const calories = Math.round(expenditure + safeSurplus);
  const protein = Math.round(p.weight * 2);
  const fat = Math.round(p.weight * 0.95);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { bmr: Math.round(bmr), expenditure: Math.round(expenditure), surplus: safeSurplus, calories, protein, fat, carbs, water: 3000 };
}
export function projectionWeeks(current: number, target: number) {
  const gap = Math.max(0, target - current);
  return { fastest: Math.ceil(gap / 0.35), slowest: Math.ceil(gap / 0.25) };
}
export function localDay(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function portionMacros(food: { calories: number; protein: number; fat: number; carbs: number }, grams: number) {
  return { calories: Math.round(food.calories * grams / 100), protein: Math.round(food.protein * grams / 100 * 10)/10, fat: Math.round(food.fat * grams / 100 * 10)/10, carbs: Math.round(food.carbs * grams / 100 * 10)/10 };
}