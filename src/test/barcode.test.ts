import { describe, expect, it } from 'vitest';
import { isValidBarcode, lookupBarcode, parseOffProduct } from '@/lib/barcode';

describe('código de barras', () => {
  it('valida o dígito verificador', () => {
    expect(isValidBarcode('7891000100103')).toBe(true);
    expect(isValidBarcode('7891000100104')).toBe(false);
    expect(isValidBarcode('12345')).toBe(false);
    expect(isValidBarcode('78910001001a3')).toBe(false);
    expect(isValidBarcode('96385074')).toBe(true);
  });
  it('lê o Open Food Facts', () => {
    const json = { product: { product_name: 'Leite condensado', brands: 'Nestlé, Moça', nutriments: { 'energy-kcal_100g': 325, proteins_100g: 6.8, carbohydrates_100g: 55, fat_100g: 7.04 } } };
    expect(parseOffProduct(json)).toEqual({ name: 'Leite condensado (Nestlé)', kcal: 325, p: 6.8, c: 55, f: 7 });
    expect(parseOffProduct({ product: { product_name: 'X', nutriments: { 'energy-kj_100g': 1000, proteins_100g: 1, carbohydrates_100g: 1, fat_100g: 1 } } })?.kcal).toBe(239);
    expect(parseOffProduct({ product: { product_name: 'X', nutriments: { proteins_100g: 1 } } })).toBeNull();
    expect(parseOffProduct({})).toBeNull();
  });
  it('trata erros de rede e produto ausente', async () => {
    expect((await lookupBarcode('123')).ok).toBe(false);
    const notFound = (async () => new Response('{}', { status: 404 })) as unknown as typeof fetch;
    expect(await lookupBarcode('7891000100103', notFound)).toEqual({ ok: false, reason: 'notfound' });
    const boom = (async () => { throw new Error('x'); }) as unknown as typeof fetch;
    expect(await lookupBarcode('7891000100103', boom)).toEqual({ ok: false, reason: 'network' });
    const ok = (async () => new Response(JSON.stringify({ product: { product_name: 'A', nutriments: { 'energy-kcal_100g': 100, proteins_100g: 1, carbohydrates_100g: 2, fat_100g: 3 } } }))) as unknown as typeof fetch;
    expect(await lookupBarcode('7891000100103', ok)).toEqual({ ok: true, values: { name: 'A', kcal: 100, p: 1, c: 2, f: 3 } });
  });
});
