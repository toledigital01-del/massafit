import { describe, expect, it } from 'vitest';
import { parseSteps, productMacros, recipeTotals, validateProduct } from '@/lib/my-items';

describe('produtos e receitas próprios', () => {
  it('calcula os valores pela quantidade', () => {
    expect(productMacros({ kcal: 400, p: 20, c: 50, f: 10 }, 30)).toEqual({ calories: 120, protein: 6, carbs: 15, fat: 3 });
  });
  it('valida o rótulo', () => {
    expect(validateProduct({ name: ' ', kcal: 1, p: 0, c: 0, f: 0 })).toMatch(/nome/);
    expect(validateProduct({ name: 'X', kcal: 950, p: 0, c: 0, f: 0 })).toMatch(/900/);
    expect(validateProduct({ name: 'X', kcal: 400, p: 60, c: 40, f: 20 })).toMatch(/100 g/);
    expect(validateProduct({ name: 'X', kcal: Number.NaN, p: 0, c: 0, f: 0 })).toMatch(/rótulo/);
    expect(validateProduct({ name: 'Barra', kcal: 420, p: 30, c: 40, f: 12 })).toBeNull();
  });
  it('soma a receita e separa os passos', () => {
    expect(recipeTotals({ ingredients: [{ name: 'a', grams: 100, kcal: 100.4, p: 10, c: 5, f: 1 }, { name: 'b', grams: 50, kcal: 50.4, p: 2, c: 3, f: 0 }] })).toEqual({ kcal: 151, p: 12, c: 8, f: 1 });
    expect(parseSteps('1. Misture\n\n- Asse\n  3) Sirva ')).toEqual(['Misture', 'Asse', 'Sirva']);
  });
});
