import { describe, expect, it } from 'vitest';
import { makeCombo, parseCombos } from '@/lib/combos';
const log = { name: 'Ovo cozido', grams: 100, calories: 155, protein: 13, carbs: 1, fat: 11 };
describe('combos', () => {
  it('cria combo só com nome e itens', () => {
    expect(makeCombo('  ', 'Almoço', [log])).toBeNull();
    expect(makeCombo('Meu café', 'Café da manhã', [])).toBeNull();
    const c = makeCombo('Meu café', 'Café da manhã', [log])!;
    expect(c.items).toEqual([log]);
  });
  it('ignora dados corrompidos no armazenamento', () => {
    expect(parseCombos('lixo')).toEqual([]);
    expect(parseCombos('[{"id":1}]')).toEqual([]);
    const c = makeCombo('x', 'Ceia', [log])!;
    expect(parseCombos(JSON.stringify([c]))).toEqual([c]);
  });
});
