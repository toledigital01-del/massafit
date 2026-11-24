/** Produtos e receitas criados pelo próprio usuário. Ficam neste aparelho (localStorage) até existirem tabelas na conta. */
export type MyProduct = { id: string; name: string; kcal: number; p: number; c: number; f: number }; // por 100 g
export type MyIngredient = { name: string; grams: number; kcal: number; p: number; c: number; f: number }; // já para a quantidade usada
export type MyRecipe = { id: string; name: string; meal: string; minutes: number; ingredients: MyIngredient[]; steps: string[] };

const PRODUCTS_KEY = 'massafit-my-products';
const RECIPES_KEY = 'massafit-my-recipes';

function read<T>(key: string, ok: (x: unknown) => x is T): T[] {
  try { const raw = localStorage.getItem(key); const v: unknown = raw ? JSON.parse(raw) : []; return Array.isArray(v) ? v.filter(ok) : []; } catch { return []; }
}
function write(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* sem armazenamento: não salva */ } }

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const isProduct = (x: unknown): x is MyProduct => { const o = x as MyProduct; return !!o && typeof o.id === 'string' && typeof o.name === 'string' && isNum(o.kcal) && isNum(o.p) && isNum(o.c) && isNum(o.f); };
const isIngredient = (x: unknown): x is MyIngredient => { const o = x as MyIngredient; return !!o && typeof o.name === 'string' && isNum(o.grams) && isNum(o.kcal) && isNum(o.p) && isNum(o.c) && isNum(o.f); };
const isRecipe = (x: unknown): x is MyRecipe => { const o = x as MyRecipe; return !!o && typeof o.id === 'string' && typeof o.name === 'string' && typeof o.meal === 'string' && isNum(o.minutes) && Array.isArray(o.ingredients) && o.ingredients.every(isIngredient) && Array.isArray(o.steps) && o.steps.every(s => typeof s === 'string'); };

export const loadProducts = () => read(PRODUCTS_KEY, isProduct);
export const saveProducts = (l: MyProduct[]) => write(PRODUCTS_KEY, l);
export const loadMyRecipes = () => read(RECIPES_KEY, isRecipe);
export const saveMyRecipes = (l: MyRecipe[]) => write(RECIPES_KEY, l);

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Limites do rótulo de um produto (por 100 g). Devolve a mensagem de erro, ou null se estiver tudo certo. */
export function validateProduct(p: { name: string; kcal: number; p: number; c: number; f: number }): string | null {
  if (!p.name.trim()) return 'Informe o nome do produto.';
  if (![p.kcal, p.p, p.c, p.f].every(n => Number.isFinite(n) && n >= 0)) return 'Preencha os valores do rótulo (use 0 quando não tiver).';
  if (p.kcal > 900) return 'Calorias por 100 g acima de 900 não são possíveis. Confira o rótulo.';
  if (p.p + p.c + p.f > 100) return 'Proteína + carboidrato + gordura passam de 100 g em 100 g. Confira o rótulo.';
  return null;
}

/** Valores para uma quantidade, a partir dos valores por 100 g. */
export const productMacros = (p: Pick<MyProduct, 'kcal' | 'p' | 'c' | 'f'>, grams: number) => ({ calories: round1(p.kcal * grams / 100), protein: round1(p.p * grams / 100), carbs: round1(p.c * grams / 100), fat: round1(p.f * grams / 100) });
const round1 = (n: number) => Math.round(n * 10) / 10;

export function recipeTotals(r: Pick<MyRecipe, 'ingredients'>) {
  const sum = (k: 'kcal' | 'p' | 'c' | 'f') => Math.round(r.ingredients.reduce((a, i) => a + i[k], 0));
  return { kcal: sum('kcal'), p: sum('p'), c: sum('c'), f: sum('f') };
}

/** Passos digitados em um campo de texto: um por linha, sem numeração nem linhas vazias. */
export const parseSteps = (text: string) => text.split('\n').map(s => s.replace(/^\s*(\d+[.)-]|[-•*])\s*/, '').trim()).filter(Boolean);
