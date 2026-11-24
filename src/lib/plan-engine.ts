/** Motor do plano alimentar: monta o dia pelas metas, ajusta quantidades, respeita preferências e calcula trocas equivalentes. */
import { FOODS, macrosOf, mustFood, portionText, roundGrams, type Food, type Tag } from './plan-foods';
import { MEAL_LABEL, MEAL_TIME, OPTIONS, type Goal, type MealOption, type MealType, type Slot } from './plan-templates';

export type Goals = { calories: number; protein: number; carbs: number; fat: number };
export type Prefs = { avoid: Tag[]; vegetarian: boolean; economic: boolean; exclude: string[] };
export const NO_PREFS: Prefs = { avoid: [], vegetarian: false, economic: false, exclude: [] };
export type PlanState = { opt: Partial<Record<MealType, number>>; swap: Record<string, string> };
export const EMPTY_STATE: PlanState = { opt: {}, swap: {} };
export type Ctx = { meals: 4 | 5 | 6; training: boolean; shift: boolean; prefs: Prefs; state: PlanState; dayIndex: number; objective?: Goal };

const MEAL_SETS: Record<4 | 5 | 6, MealType[]> = {
  4: ['cafe', 'almoco', 'pre', 'jantar'],
  5: ['cafe', 'lanche', 'almoco', 'pre', 'jantar'],
  6: ['cafe', 'lanche', 'almoco', 'pre', 'jantar', 'ceia'],
};
/** Peso de cada refeição no dia (soma 1). Dia de treino puxa mais energia para o pré-treino. */
const WEIGHTS: Record<4 | 5 | 6, { rest: number[]; train: number[] }> = {
  4: { rest: [0.25, 0.3, 0.15, 0.3], train: [0.23, 0.28, 0.2, 0.29] },
  5: { rest: [0.23, 0.1, 0.28, 0.1, 0.29], train: [0.21, 0.09, 0.26, 0.16, 0.28] },
  6: { rest: [0.22, 0.1, 0.27, 0.08, 0.22, 0.11], train: [0.2, 0.08, 0.25, 0.15, 0.22, 0.1] },
};

export function usable(f: Food, prefs: Prefs): boolean {
  if (prefs.exclude.includes(f.id)) return false;
  const avoid = new Set<Tag>(prefs.avoid);
  if (prefs.vegetarian) { avoid.add('meat'); avoid.add('redmeat'); avoid.add('fish'); }
  return !f.tags.some(t => avoid.has(t));
}
const optionUsable = (o: MealOption, prefs: Prefs) => o.slots.every(s => usable(mustFood(s.food), prefs));
const optionCost = (o: MealOption) => o.slots.reduce((s, x) => s + mustFood(x.food).cost, 0) / o.slots.length;

/** Cardápios disponíveis para a refeição, já filtrados pelas preferências (econômico: mais baratos primeiro). */
export function optionsFor(type: MealType, prefs: Prefs, shift = false, objective: Goal = 'gain'): MealOption[] {
  let list = OPTIONS[type].filter(o => optionUsable(o, prefs) && (!o.goals || o.goals.includes(objective)));
  if (shift) { const portable = list.filter(o => o.portable); if (portable.length) list = portable; }
  if (prefs.economic) list = [...list].sort((a, b) => optionCost(a) - optionCost(b));
  return list;
}

export type Item = { slot: number; food: Food; grams: number; kcal: number; p: number; c: number; f: number; text: string };
export type Meal = { type: MealType; label: string; time: string; option: MealOption; optionIndex: number; optionCount: number; items: Item[]; kcal: number; p: number; c: number; f: number; target: { kcal: number; p: number } };
export type Day = { meals: Meal[]; kcal: number; p: number; c: number; f: number; goals: Goals };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Gramas do alimento novo que equivalem ao antigo: mesma proteína (grupo proteína) ou mesmas calorias (demais). */
export function equivalentGrams(from: Food, grams: number, to: Food): number {
  const key = from.group === 'proteina' && to.p > 0 && from.p > 0 ? 'p' : 'kcal';
  const have = (from[key] * grams) / 100;
  return (have / to[key]) * 100;
}

type Work = { food: Food; role: Slot['role']; g: number; lo: number; hi: number };

function solveMeal(slots: Work[], target: { kcal: number; p: number }): void {
  for (let it = 0; it < 40; it++) {
    const prot = slots.filter(s => s.role === 'protein');
    if (prot.length) {
      const other = slots.filter(s => s.role !== 'protein').reduce((a, s) => a + macrosOf(s.food, s.g).p, 0);
      const cur = prot.reduce((a, s) => a + macrosOf(s.food, s.g).p, 0);
      if (cur > 0) { const r = (target.p - other) / cur; for (const s of prot) s.g = clamp(s.g * clamp(r, 0.2, 5), s.lo, s.hi); }
    }
    const en = slots.filter(s => s.role === 'energy');
    if (en.length) {
      const non = slots.filter(s => s.role !== 'energy').reduce((a, s) => a + macrosOf(s.food, s.g).kcal, 0);
      const cur = en.reduce((a, s) => a + macrosOf(s.food, s.g).kcal, 0);
      if (cur > 0) { const r = (target.kcal - non) / cur; for (const s of en) s.g = clamp(s.g * clamp(r, 0.2, 5), s.lo, s.hi); }
    }
  }
}

function buildMeal(type: MealType, opt: MealOption, optionIndex: number, optionCount: number, target: { kcal: number; p: number }, state: PlanState): Meal {
  const work: Work[] = opt.slots.map((s, i) => {
    const swapId = state.swap[`${type}:${i}`];
    const orig = mustFood(s.food);
    const food = swapId ? mustFood(swapId) : orig;
    const g0 = swapId ? equivalentGrams(orig, s.g, food) : s.g;
    // gorduras "fixas" (azeite, pasta, castanha) escalam um pouco com as calorias da refeição
    if (s.role === 'fixed' && food.group === 'gordura') return { food, role: 'energy' as const, g: g0, lo: 0.5 * g0, hi: 2 * g0 };
    const lo = (s.min ?? (s.role === 'protein' ? 0.85 : 0.5)) * g0, hi = (s.max ?? (s.role === 'protein' ? 2.2 : 1.8)) * g0;
    return { food, role: s.role, g: g0, lo: s.role === 'fixed' ? g0 : lo, hi: s.role === 'fixed' ? g0 : hi };
  });
  solveMeal(work, target);
  const items: Item[] = work.map((w, i) => {
    const grams = roundGrams(w.food, w.g);
    const m = macrosOf(w.food, grams);
    return { slot: i, food: w.food, grams, ...m, text: portionText(w.food, grams) };
  });
  const sum = (k: 'kcal' | 'p' | 'c' | 'f') => Math.round(items.reduce((a, i) => a + i[k], 0));
  return { type, label: MEAL_LABEL[type], time: MEAL_TIME[type], option: opt, optionIndex, optionCount, items, kcal: sum('kcal'), p: sum('p'), c: sum('c'), f: sum('f'), target };
}

export function buildDay(goals: Goals, ctx: Ctx): Day {
  const types = MEAL_SETS[ctx.meals];
  const w = (ctx.training ? WEIGHTS[ctx.meals].train : WEIGHTS[ctx.meals].rest);
  const chosen = types.map(type => {
    const obj = ctx.objective ?? 'gain';
    let opts = optionsFor(type, ctx.prefs, ctx.shift, obj);
    if (!opts.length) opts = optionsFor(type, ctx.prefs, false, obj);
    if (!opts.length) opts = OPTIONS[type]; // preferências restritivas demais: não deixa a refeição vazia
    const idx = (ctx.state.opt[type] ?? ctx.dayIndex) % opts.length;
    return { type, opt: opts[idx]!, idx, count: opts.length };
  });
  // Refeições com mínimos/máximos (ex.: meio copo de leite) desviam do alvo; 3 passadas redistribuem a diferença.
  let kcalK = 1, pK = 1;
  let day!: Day;
  for (let pass = 0; pass < 4; pass++) {
    const meals = chosen.map((c, i) => buildMeal(c.type, c.opt, c.idx, c.count, { kcal: goals.calories * (w[i] ?? 0) * kcalK, p: goals.protein * (w[i] ?? 0) * pK }, ctx.state));
    const sum = (k: 'kcal' | 'p' | 'c' | 'f') => Math.round(meals.reduce((a, m) => a + m[k], 0));
    day = { meals, kcal: sum('kcal'), p: sum('p'), c: sum('c'), f: sum('f'), goals };
    const dk = goals.calories / day.kcal, dp = goals.protein / day.p;
    if (Math.abs(dk - 1) < 0.02 && Math.abs(dp - 1) < 0.04) break;
    kcalK *= dk; pK *= dp;
  }
  return day;
}

export type Swap = { food: Food; grams: number; text: string; kcal: number; p: number };
/** Substitutos do mesmo grupo, já com a quantidade equivalente (mesma proteína ou mesmas calorias). */
export function swapCandidates(item: Pick<Item, 'food' | 'grams'>, prefs: Prefs, limit = 8): Swap[] {
  const list = FOODS.filter(f => f.group === item.food.group && f.id !== item.food.id && usable(f, prefs));
  if (prefs.economic) list.sort((a, b) => a.cost - b.cost);
  return list.slice(0, limit * 2).map(food => {
    const grams = roundGrams(food, equivalentGrams(item.food, item.grams, food));
    const m = macrosOf(food, grams);
    return { food, grams, text: portionText(food, grams), kcal: m.kcal, p: m.p };
  }).slice(0, limit);
}

/** Dias de treino da semana (seg=0 … dom=6): Seg, Ter, Qui, Sex. */
export const isTrainingWeekday = (i: number) => [0, 1, 3, 4].includes(i);
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

export function buildWeek(goals: Goals, base: Omit<Ctx, 'dayIndex' | 'training' | 'state'>): Day[] {
  return Array.from({ length: 7 }, (_, d) => buildDay(goals, { ...base, training: isTrainingWeekday(d), dayIndex: d, state: EMPTY_STATE }));
}

export type ShopLine = { food: Food; grams: number; text: string };
/** Soma de uma semana de plano em lista de compras (peso preparado; medida caseira quando existir). */
export function shoppingFromWeek(week: Day[]): ShopLine[] {
  const total = new Map<string, number>();
  for (const day of week) for (const m of day.meals) for (const i of m.items) total.set(i.food.id, (total.get(i.food.id) ?? 0) + i.grams);
  return [...total].map(([id, grams]) => { const food = mustFood(id); return { food, grams, text: portionText(food, grams) }; })
    .sort((a, b) => a.food.group.localeCompare(b.food.group) || a.food.name.localeCompare(b.food.name));
}
