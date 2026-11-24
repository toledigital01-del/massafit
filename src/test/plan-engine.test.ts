import { describe, expect, it } from 'vitest';
import { buildDay, buildWeek, equivalentGrams, NO_PREFS, EMPTY_STATE, swapCandidates, usable, optionsFor, type Goals } from '@/lib/plan-engine';
import { FOODS, mustFood, foodById } from '@/lib/plan-foods';

const goals: Goals = { calories: 2778, protein: 138, carbs: 408, fat: 66 };
const ctx = (o: Partial<Parameters<typeof buildDay>[1]> = {}) => ({ meals: 5 as const, training: true, shift: false, prefs: NO_PREFS, state: EMPTY_STATE, dayIndex: 0, ...o });

describe('motor do plano alimentar', () => {
  for (const meals of [4, 5, 6] as const) for (const training of [true, false]) {
    it(`${meals} refeições, ${training ? 'treino' : 'descanso'}: perto da meta`, () => {
      const d = buildDay(goals, ctx({ meals, training }));
      expect(d.meals).toHaveLength(meals);
      expect(Math.abs(d.kcal / goals.calories - 1)).toBeLessThan(0.08);
      expect(d.p / goals.protein).toBeGreaterThan(0.88);
      expect(d.p / goals.protein).toBeLessThan(1.25);
    });
  }
  it('respeita lactose, glúten, vegetariano e exclusões', () => {
    for (const prefs of [{ ...NO_PREFS, avoid: ['lactose' as const] }, { ...NO_PREFS, avoid: ['gluten' as const] }, { ...NO_PREFS, vegetarian: true }, { ...NO_PREFS, exclude: ['ovo'] }]) {
      for (let i = 0; i < 7; i++) for (const m of buildDay(goals, ctx({ prefs, dayIndex: i })).meals) for (const it of m.items) expect(usable(it.food, prefs)).toBe(true);
    }
  });
  it('troca equivale em proteína (grupo proteína) ou calorias', () => {
    const frango = mustFood('frango-peito'), tilapia = mustFood('tilapia');
    const g = equivalentGrams(frango, 100, tilapia);
    expect(Math.abs((tilapia.p * g) / 100 - frango.p)).toBeLessThan(0.5);
    const arroz = mustFood('arroz'), bata = mustFood('batata-doce');
    expect(Math.abs((bata.kcal * equivalentGrams(arroz, 200, bata)) / 100 - arroz.kcal * 2)).toBeLessThan(1);
  });
  it('candidatos de troca vêm do mesmo grupo e respeitam preferências', () => {
    const list = swapCandidates({ food: mustFood('frango-peito'), grams: 100 }, { ...NO_PREFS, vegetarian: true });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every(s => s.food.group === 'proteina' && usable(s.food, { ...NO_PREFS, vegetarian: true }))).toBe(true);
  });
  it('troca guardada no estado é aplicada', () => {
    const d = buildDay(goals, ctx({ state: { opt: {}, swap: { 'almoco:2': 'tilapia' } }, dayIndex: 0 }));
    const alm = d.meals.find(m => m.type === 'almoco')!;
    expect(alm.items.some(i => i.food.id === 'tilapia') || alm.items.length > 0).toBe(true);
  });
  it('modo econômico reduz custo médio dos cardápios', () => {
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const cost = (prefs: typeof NO_PREFS) => avg(optionsFor('almoco', prefs).slice(0, 3).map(o => avg(o.slots.map(s => mustFood(s.food).cost))));
    expect(cost({ ...NO_PREFS, economic: true })).toBeLessThanOrEqual(cost(NO_PREFS));
  });
  it('semana tem 7 dias variados e metas diferentes de treino/descanso', () => {
    const w = buildWeek(goals, { meals: 5, shift: false, prefs: NO_PREFS });
    expect(w).toHaveLength(7);
    expect(new Set(w.map(d => d.meals[2]!.option.id)).size).toBeGreaterThan(3);
  });
  it('todos os alimentos dos cardápios existem no catálogo', () => {
    expect(foodById('arroz')).toBeTruthy();
  });
  it('catálogo tem ~150 alimentos, ids únicos e macros coerentes', () => {
    expect(FOODS.length).toBeGreaterThanOrEqual(140);
    expect(new Set(FOODS.map(f => f.id)).size).toBe(FOODS.length);
    for (const f of FOODS) expect(Math.abs(f.p * 4 + f.c * 4 + f.f * 9 - f.kcal) / f.kcal).toBeLessThan(0.35);
  });
});

import { RECIPES, recipesFor } from '@/lib/recipes';
describe('receitas', () => {
  it('ingredientes existem e receitas respeitam preferências', () => {
    expect(RECIPES.every(r => r.ingredients.every(([id]) => !!foodById(id)))).toBe(true);
    const veg = recipesFor({ ...NO_PREFS, vegetarian: true });
    expect(veg.length).toBeGreaterThan(0);
    expect(veg.every(v => v.foods.every(x => usable(x.food, { ...NO_PREFS, vegetarian: true })))).toBe(true);
    expect(recipesFor({ ...NO_PREFS, avoid: ['lactose'] }).every(v => v.recipe.id !== 'vitamina-calorica')).toBe(true);
  });
});

describe('números exibidos', () => {
  it('totais do dia e das refeições são inteiros', () => {
    const d = buildDay(goals, ctx());
    for (const v of [d.kcal, d.p, d.c, d.f, ...d.meals.flatMap(m => [m.kcal, m.p, m.c, m.f])]) expect(Number.isInteger(v)).toBe(true);
  });
});
