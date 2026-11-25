/** Motor do plano alimentar: monta o dia pelas metas, ajusta quantidades, respeita preferências e calcula trocas equivalentes. */
import { FOODS, foodById, macrosOf, mustFood, portionText, roundGrams, type Food, type Tag } from './plan-foods';
import { MEAL_LABEL, MEAL_TIME, OPTIONS, type Goal, type MealOption, type MealType, type Slot } from './plan-templates';

export type Goals = { calories: number; protein: number; carbs: number; fat: number };
export type Prefs = { avoid: Tag[]; vegetarian: boolean; economic: boolean; exclude: string[] };
export const NO_PREFS: Prefs = { avoid: [], vegetarian: false, economic: false, exclude: [] };
export type PlanState = { opt: Partial<Record<MealType, number>>; swap: Record<string, string> };
export const EMPTY_STATE: PlanState = { opt: {}, swap: {} };
export type Ctx = { meals: 4 | 5 | 6; training: boolean; shift: boolean; prefs: Prefs; state: PlanState; dayIndex: number; objective?: Goal };

export const MEAL_SETS: Record<4 | 5 | 6, MealType[]> = {
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
export type Meal = { type: MealType; label: string; time: string; option: MealOption; optionIndex: number; optionCount: number; items: Item[]; kcal: number; p: number; c: number; f: number; target: { kcal: number; p: number; f?: number } };
/** `effective`: metas que o plano conseguiu usar; `warnings`: avisos para mostrar à pessoa (nunca esconder um ajuste). */
export type Day = { meals: Meal[]; kcal: number; p: number; c: number; f: number; goals: Goals; effective: Goals; mealsUsed: 4 | 5 | 6; warnings: string[] };

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Gramas do alimento novo que equivalem ao antigo: mesma proteína (grupo proteína) ou mesmas calorias (demais). */
export function equivalentGrams(from: Food, grams: number, to: Food): number {
  const key = from.group === 'proteina' && to.p > 0 && from.p > 0 ? 'p' : 'kcal';
  const have = (from[key] * grams) / 100;
  return (have / to[key]) * 100;
}

type Work = { food: Food; role: Slot['role']; g: number; lo: number; hi: number };

function solveMeal(slots: Work[], target: { kcal: number; p: number; f?: number }): void {
  for (let it = 0; it < 40; it++) {
    // gordura: entre os alimentos de energia, troca peso de gordurosos por carboidratos (ou o contrário) para chegar perto da meta de gordura
    if (target.f !== undefined) {
      const en = slots.filter(s => s.role === 'energy');
      const fatty = en.filter(s => s.food.f * 9 > s.food.c * 4), carby = en.filter(s => s.food.f * 9 <= s.food.c * 4);
      if (fatty.length && carby.length) {
        const curF = slots.reduce((a, s) => a + macrosOf(s.food, s.g).f, 0), fatF = fatty.reduce((a, s) => a + macrosOf(s.food, s.g).f, 0);
        if (fatF > 0) { const r = clamp((target.f - (curF - fatF)) / fatF, 0.7, 1.4); for (const s of fatty) s.g = clamp(s.g * r, s.lo, s.hi); }
      }
    }
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

/** `relax` (0 a 1) afrouxa os limites de porção quando as metas fogem muito do tamanho padrão dos cardápios (ex.: 1.200 kcal). */
function buildMeal(type: MealType, opt: MealOption, optionIndex: number, optionCount: number, target: { kcal: number; p: number; f?: number }, state: PlanState, prefs: Prefs, relax = 0): Meal {
  const work: Work[] = opt.slots.map((s, i) => {
    const orig = mustFood(s.food);
    // troca salva só vale se o alimento ainda existe e respeita as preferências atuais
    const swapped = foodById(state.swap[`${type}:${i}`] ?? '');
    const swapId = swapped && usable(swapped, prefs) ? swapped.id : undefined;
    const food = swapped && swapId ? swapped : orig;
    const g0 = swapId ? equivalentGrams(orig, s.g, food) : s.g;
    // gorduras "fixas" (azeite, pasta, castanha) escalam um pouco com as calorias da refeição
    if (s.role === 'fixed' && food.group === 'gordura') return { food, role: 'energy' as const, g: g0, lo: (1 - 0.8 * relax) * 0.5 * g0, hi: (1 + relax) * 2 * g0 };
    const lo = (s.min ?? (s.role === 'protein' ? 0.85 : 0.5)) * g0, hi = (s.max ?? (s.role === 'protein' ? 2.2 : 1.8)) * g0;
    return { food, role: s.role, g: g0, lo: s.role === 'fixed' ? g0 : (1 - 0.7 * relax) * lo, hi: s.role === 'fixed' ? g0 : (1 + relax) * hi };
  });
  solveMeal(work, target);
  const items: Item[] = work.map((w, i) => {
    const grams = roundGrams(w.food, w.g, relax > 0);
    const m = macrosOf(w.food, grams);
    return { slot: i, food: w.food, grams, ...m, text: portionText(w.food, grams) };
  });
  const sum = (k: 'kcal' | 'p' | 'c' | 'f') => Math.round(items.reduce((a, i) => a + i[k], 0));
  return { type, label: MEAL_LABEL[type], time: MEAL_TIME[type], option: opt, optionIndex, optionCount, items, kcal: sum('kcal'), p: sum('p'), c: sum('c'), f: sum('f'), target };
}

export function buildDay(goalsIn: Goals, ctx0: Ctx): Day {
  const warnings: string[] = [];
  // metas muito baixas não comportam 5 ou 6 refeições com porções mínimas: usa 4 e avisa.
  const ctx = goalsIn.calories < 1700 && ctx0.meals > 4 ? { ...ctx0, meals: 4 as const } : ctx0;
  if (ctx.meals !== ctx0.meals) warnings.push(`Com menos de 1.700 kcal o plano usa 4 refeições (você escolheu ${ctx0.meals}) para manter porções que dá para medir.`);
  const capP = Math.round(goalsIn.calories * 0.35 / 4);
  const goals = { ...goalsIn, protein: Math.min(goalsIn.protein, capP) };
  if (goals.protein < goalsIn.protein) warnings.push(`Proteína limitada a ${capP} g (35% das calorias); sua meta é ${goalsIn.protein} g.`);
  const types = MEAL_SETS[ctx.meals];
  const wAll = (ctx.training ? WEIGHTS[ctx.meals].train : WEIGHTS[ctx.meals].rest);
  const obj = ctx.objective ?? 'gain';
  const chosen: { type: MealType; opt: MealOption; idx: number; count: number; w: number }[] = [];
  const skipped: MealType[] = [];
  types.forEach((type, i) => {
    let opts = optionsFor(type, ctx.prefs, ctx.shift, obj);
    if (!opts.length) opts = optionsFor(type, ctx.prefs, false, obj);
    if (!opts.length) { skipped.push(type); return; } // nunca fura as restrições
    const idx = (ctx.state.opt[type] ?? ctx.dayIndex) % opts.length;
    chosen.push({ type, opt: opts[idx]!, idx, count: opts.length, w: wAll[i] ?? 0 });
  });
  if (skipped.length) warnings.push(`Nenhum cardápio de ${skipped.map(t => MEAL_LABEL[t].toLowerCase()).join(', ')} respeita suas restrições; as outras refeições cobrem a meta. Afrouxe alguma restrição para voltar.`);
  const wSum = chosen.reduce((a, c) => a + c.w, 0) || 1;
  let kcalK = 1, pK = 1;
  let day!: Day; let best: Day | undefined; let bestErr = Infinity;
  let relax = 0;
  for (let pass = 0; pass < 9; pass++) {
    const meals = chosen.map(c => { const share = c.w / wSum; return buildMeal(c.type, c.opt, c.idx, c.count, { kcal: goals.calories * share * kcalK, p: goals.protein * share * pK, f: goals.fat * share }, ctx.state, ctx.prefs, relax); });
    const sum = (k: 'kcal' | 'p' | 'c' | 'f') => Math.round(meals.reduce((a, m) => a + m[k], 0));
    day = { meals, kcal: sum('kcal'), p: sum('p'), c: sum('c'), f: sum('f'), goals: goalsIn, effective: goals, mealsUsed: ctx.meals, warnings };
    if (!meals.length) return day;
    const dk = goals.calories / day.kcal, dp = goals.protein / day.p;
    const err = Math.abs(dk - 1) + 0.3 * Math.abs(dp - 1) + 0.1 * Math.abs(goals.fat / Math.max(1, day.f) - 1);
    if (err < bestErr) { best = day; bestErr = err; }
    if (Math.abs(dk - 1) < 0.02 && Math.abs(dp - 1) < 0.04) break;
    if (pass >= 2 && Math.abs(dk - 1) > 0.03) relax = 1;
    kcalK *= dk; pK *= dp;
  }
  return best ?? day;
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

/** Dias de treino (seg=0 … dom=6) pelo número de treinos do perfil, espalhados na semana. */
export function trainingWeekdays(n = 4): number[] {
  const MAP: Record<number, number[]> = { 0: [], 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  return MAP[clamp(Math.round(n), 0, 7)] ?? MAP[4]!;
}
export const isTrainingWeekday = (i: number, days: number[] = trainingWeekdays(4)) => days.includes(i);
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

export type WeekOpts = { states?: Record<string, PlanState>; shiftDays?: number[]; trainingDays?: number[] };
/** Contexto de um dia da semana: o mesmo para a aba Semana, o dia selecionado e a lista de compras. */
export function dayCtx(base: Omit<Ctx, 'dayIndex' | 'training' | 'state' | 'shift'> & { shift?: boolean }, d: number, o: WeekOpts = {}): Ctx {
  return { ...base, shift: o.shiftDays ? o.shiftDays.includes(d) : !!base.shift, training: isTrainingWeekday(d, o.trainingDays), dayIndex: d, state: o.states?.[String(d)] ?? EMPTY_STATE };
}
export function buildWeek(goals: Goals, base: Omit<Ctx, 'dayIndex' | 'training' | 'state' | 'shift'> & { shift?: boolean }, o: WeekOpts = {}): Day[] {
  return Array.from({ length: 7 }, (_, d) => buildDay(goals, dayCtx(base, d, o)));
}

export type ShopLine = { food: Food; grams: number; text: string };
/** Soma de uma semana de plano em lista de compras (peso preparado; medida caseira quando existir). */
export function shoppingFromWeek(week: Day[]): ShopLine[] {
  const total = new Map<string, number>();
  for (const day of week) for (const m of day.meals) for (const i of m.items) total.set(i.food.id, (total.get(i.food.id) ?? 0) + i.grams);
  return [...total].map(([id, grams]) => { const food = mustFood(id); return { food, grams, text: portionText(food, grams) }; })
    .sort((a, b) => a.food.group.localeCompare(b.food.group) || a.food.name.localeCompare(b.food.name));
}
