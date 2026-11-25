import { buildDay, EMPTY_STATE, isTrainingWeekday, shoppingFromWeek, type Goals, type PlanState, type Prefs } from './plan-engine';
import { GROUP_LABEL } from './plan-foods';
import { planOptions } from './meal-plan';

export type ShopItem = { name: string; grams: number; category: string };

const CATEGORY: [RegExp, string][] = [
  [/ovo|frango|patinho|til[aá]pia|whey/i, 'Proteínas'],
  [/leite|iogurte/i, 'Laticínios'],
  [/arroz|feij[aã]o|aveia|p[aã]o|tapioca|batata/i, 'Grãos, pães e tubérculos'],
  [/banana|castanha|amendoim|azeite/i, 'Frutas, gorduras e outros'],
];
export const categoryOf = (name: string) => CATEGORY.find(([r]) => r.test(name))?.[1] ?? 'Outros';

/** Soma de gramas por alimento na semana: `shiftDays` dias de plantão (marmita) + o resto de folga. */
export function weeklyShoppingList(shiftDays = 0, days = 7): ShopItem[] {
  const total = new Map<string, number>();
  const shift = Math.min(Math.max(shiftDays, 0), days), off = days - shift;
  for (const opt of Object.values(planOptions)) {
    for (const [name, g] of opt.normal) total.set(name, (total.get(name) ?? 0) + g * off);
    for (const [name, g] of opt.shift) total.set(name, (total.get(name) ?? 0) + g * shift);
  }
  return [...total].filter(([, g]) => g > 0).map(([name, grams]) => ({ name, grams, category: categoryOf(name) })).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export const formatQty = (g: number) => (g >= 1000 ? `${(g / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg` : `${Math.round(g)} g`);

/** Lista de compras = soma do mesmo plano que aparece em /plano: cada dia da semana com as trocas e opções escolhidas, e os dias de plantão em marmita. */
export function planShoppingList(goals: Goals, opts: { meals: 4 | 5 | 6; prefs: Prefs; shiftDays: number; objective?: 'gain' | 'lose' | 'maintain'; states?: Record<string, PlanState> }): ShopItem[] {
  const shiftN = Math.min(Math.max(opts.shiftDays, 0), 7);
  const week = Array.from({ length: 7 }, (_, d) => buildDay(goals, { meals: opts.meals, shift: d < shiftN, prefs: opts.prefs, training: isTrainingWeekday(d), dayIndex: d, state: opts.states?.[String(d)] ?? EMPTY_STATE, ...(opts.objective ? { objective: opts.objective } : {}) }));
  return shoppingFromWeek(week).filter(l => l.grams > 0).map(l => ({ name: l.food.name, grams: l.grams, category: GROUP_LABEL[l.food.group] }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
