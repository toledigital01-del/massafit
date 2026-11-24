/** Combos ("meu café padrão"): guardados neste aparelho; aplicados pelo registro de refeição personalizada. */
export type ComboItem = { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number };
export type Combo = { id: string; name: string; meal: string; items: ComboItem[] };
const KEY = 'massafit-combos';

export function parseCombos(raw: string | null): Combo[] {
  try {
    const v = JSON.parse(raw ?? '[]');
    if (!Array.isArray(v)) return [];
    return v.filter((c): c is Combo => typeof c?.id === 'string' && typeof c?.name === 'string' && Array.isArray(c?.items) && c.items.length > 0 && c.items.every((i: ComboItem) => typeof i?.name === 'string' && [i.grams, i.calories, i.protein, i.carbs, i.fat].every(n => Number.isFinite(n))));
  } catch { return []; }
}
export const loadCombos = (): Combo[] => { try { return parseCombos(localStorage.getItem(KEY)); } catch { return []; } };
export function saveCombos(list: Combo[]) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30))); } catch { /* sem armazenamento */ } }

export function makeCombo(name: string, meal: string, logs: { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }[]): Combo | null {
  const n = name.trim().slice(0, 40);
  if (!n || !logs.length) return null;
  return { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: n, meal, items: logs.map(l => ({ name: l.name, grams: l.grams, calories: l.calories, protein: l.protein, carbs: l.carbs, fat: l.fat })) };
}
