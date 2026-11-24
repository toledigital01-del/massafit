/** Busca de produtos pelo código de barras no Open Food Facts (base aberta, com muitos produtos brasileiros). */
export type LabelValues = { name: string; kcal: number; p: number; c: number; f: number }; // por 100 g

/** Confere o dígito verificador de EAN-8, UPC-A (12) e EAN-13 (e GTIN-14). */
export function isValidBarcode(code: string): boolean {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((a, d, i) => a + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);

/** Lê a resposta do Open Food Facts. Devolve null quando faltam os valores essenciais. */
export function parseOffProduct(json: unknown): LabelValues | null {
  const prod = (json as { product?: Record<string, unknown> } | null)?.product;
  if (!prod) return null;
  const n = (prod['nutriments'] ?? {}) as Record<string, unknown>;
  let kcal = num(n['energy-kcal_100g']);
  if (kcal === null) { const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g']); kcal = kj === null ? null : Math.round(kj / 4.184); }
  const p = num(n['proteins_100g']); const c = num(n['carbohydrates_100g']); const f = num(n['fat_100g']);
  if (kcal === null || p === null || c === null || f === null) return null;
  const str = (k: string) => (typeof prod[k] === 'string' ? (prod[k] as string).trim() : '');
  const base = str('product_name_pt') || str('product_name');
  const brand = str('brands').split(',')[0]?.trim() ?? '';
  const name = base && brand && !base.toLocaleLowerCase('pt-BR').includes(brand.toLocaleLowerCase('pt-BR')) ? `${base} (${brand})` : base || brand;
  if (!name) return null;
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return { name: name.slice(0, 80), kcal: Math.round(kcal), p: r1(p), c: r1(c), f: r1(f) };
}

export type Lookup = { ok: true; values: LabelValues } | { ok: false; reason: 'invalid' | 'notfound' | 'incomplete' | 'network' };

export async function lookupBarcode(code: string, fetchFn: typeof fetch = fetch): Promise<Lookup> {
  const clean = code.replace(/\D/g, '');
  if (!isValidBarcode(clean)) return { ok: false, reason: 'invalid' };
  try {
    const res = await fetchFn(`https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=product_name,product_name_pt,brands,nutriments`, { signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return { ok: false, reason: 'notfound' };
    if (!res.ok) return { ok: false, reason: 'network' };
    const json: unknown = await res.json();
    if (!(json as { product?: unknown })?.product) return { ok: false, reason: 'notfound' };
    const values = parseOffProduct(json);
    return values ? { ok: true, values } : { ok: false, reason: 'incomplete' };
  } catch { return { ok: false, reason: 'network' }; }
}

export const LOOKUP_MESSAGE: Record<Exclude<Lookup, { ok: true }>['reason'], string> = {
  invalid: 'Código inválido. Confira os números abaixo das barras (8, 12 ou 13 dígitos).',
  notfound: 'Produto não encontrado na base. Tente a foto do rótulo ou digite os valores.',
  incomplete: 'Achei o produto, mas sem a tabela nutricional completa. Tente a foto do rótulo ou digite os valores.',
  network: 'Não consegui consultar agora. Verifique a internet ou digite os valores.',
};
