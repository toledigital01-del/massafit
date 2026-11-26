import { buildWeek, shoppingFromWeek, type Goals, type PlanState, type Prefs } from './plan-engine';
import { GROUP_LABEL, type Food } from './plan-foods';
import { planOptions } from './meal-plan';

export type ShopItem = { name: string; grams: number; category: string; food?: Food };

export type PurchaseQuantity = { label: string; detail: string; requiredGrams: number; suppliedGrams: number };
const PACKS: Record<string, number> = {
  'pao-integral': 500, 'pao-forma': 500, 'pao-sem-gluten': 500,
  aveia: 500, 'farinha-aveia': 500, tapioca: 500, granola: 250,
  chia: 100, linhaca: 100, amendoim: 200, 'castanha-para': 100,
  'castanha-caju': 100, nozes: 100, amendoa: 100, whey: 900,
};
// Rendimento aproximado: peso preparado / peso seco. Água e modo de preparo variam.
const DRY_YIELD: Record<string, number> = {
  arroz: 2.5, 'arroz-integral': 2.5, 'arroz-parboilizado': 2.5,
  macarrao: 2.5, 'macarrao-integral': 2.5, cuscuz: 2,
  'feijao-carioca': 2.5, 'feijao-preto': 2.5, 'feijao-branco': 2.5,
  'feijao-fradinho': 2.5, lentilha: 2.5, 'grao-de-bico': 2.5, quinoa: 2.5,
};

/** Compra nunca altera as gramas do plano; embalagens e unidades são arredondadas para cima. */
export function purchaseQuantity(item: ShopItem): PurchaseQuantity {
  const { food, grams } = item;
  const base = `No plano: ${formatQty(grams)}`;
  if (!food || grams <= 0) return { label: formatQty(grams), detail: base, requiredGrams: grams, suppliedGrams: grams };
  const pack = (size: number, singular: string, plural: string, required = grams, note = ''): PurchaseQuantity => {
    const n = Math.ceil(required / size);
    return { label: `${n} ${n === 1 ? singular : plural}`, detail: `${base} · ${note || `embalagem de referência: ${formatQty(size)}`}`, requiredGrams: required, suppliedGrams: n * size };
  };
  if (food.id === 'ovo' || food.id === 'ovo-mexido' || food.id === 'clara') {
    const size = food.id === 'clara' ? 33 : 50;
    const n = Math.ceil(grams / size), dozens = Math.floor(n / 12), rest = n % 12;
    const label = dozens ? `${dozens} ${dozens === 1 ? 'dúzia' : 'dúzias'}${rest ? ` + ${rest} ${rest === 1 ? 'ovo' : 'ovos'}` : ''}` : `${n} ${n === 1 ? 'ovo' : 'ovos'}`;
    return { label, detail: `${base} · ${size} g por ${food.id === 'clara' ? 'clara; separar a gema' : 'ovo, sem casca'}`, requiredGrams: grams, suppliedGrams: n * size };
  }
  const yieldFactor = DRY_YIELD[food.id];
  if (yieldFactor) return pack(500, 'pacote de 500 g (seco)', 'pacotes de 500 g (secos)', grams / yieldFactor, `≈ ${formatQty(grams / yieldFactor)} seco; rendimento estimado de ${yieldFactor.toLocaleString('pt-BR')}×`);
  if (food.unit && ((food.group === 'fruta' && food.whole) || ['tomate', 'pepino', 'pimentao', 'pao-frances', 'pao-queijo', 'tangerina', 'pera', 'pessego', 'caqui'].includes(food.id))) {
    const n = Math.ceil(grams / food.unit.grams);
    return { label: `${n} ${n === 1 ? food.unit.s : food.unit.p}`, detail: `${base} · ≈ ${formatQty(food.unit.grams)} comestíveis por unidade`, requiredGrams: grams, suppliedGrams: n * food.unit.grams };
  }
  if (food.unit && ['lata', 'pote'].includes(food.unit.s)) return pack(food.unit.grams, food.unit.s, food.unit.p, grams, `${formatQty(food.unit.grams)} por ${food.unit.s}${food.unit.s === 'lata' ? ' (peso escorrido)' : ''}`);
  if (/^leite-(?!po)|^leite-integral$|^leite-desnatado$/.test(food.id)) return pack(1000, 'caixa de 1 L', 'caixas de 1 L', grams, '≈ 1 g por ml; confira a embalagem');
  const packSize = PACKS[food.id];
  if (packSize) return pack(packSize, `pacote de ${formatQty(packSize)}`, `pacotes de ${formatQty(packSize)}`);
  // Sem rendimento confiável não converter alimento pronto em ingrediente cru.
  return { label: formatQty(grams), detail: `${base}${/cozid|grelhad|assad|refogad/i.test(food.name) ? ' · peso preparado, não cru' : ''}`, requiredGrams: grams, suppliedGrams: grams };
}

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
export function planShoppingList(goals: Goals, opts: { meals: 4 | 5 | 6; prefs: Prefs; shiftDays: number; days?: 7 | 14 | 30; objective?: 'gain' | 'lose' | 'maintain'; states?: Record<string, PlanState> }): ShopItem[] {
  const shiftN = Math.min(Math.max(opts.shiftDays, 0), 7);
  const week = buildWeek(goals, { meals: opts.meals, prefs: opts.prefs, ...(opts.objective ? { objective: opts.objective } : {}) }, { states: opts.states ?? {}, shiftDays: Array.from({ length: shiftN }, (_, d) => d) });
  const period = Array.from({ length: opts.days ?? 7 }, (_, d) => week[d % 7]).filter((d): d is NonNullable<typeof d> => !!d);
  return shoppingFromWeek(period).filter(l => l.grams > 0).map(l => ({ name: l.food.name, grams: l.grams, category: GROUP_LABEL[l.food.group], food: l.food }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
