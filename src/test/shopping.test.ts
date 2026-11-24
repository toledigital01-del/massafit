import { describe, expect, it } from 'vitest';
import { toCsv } from '@/lib/csv';
import { formatQty, weeklyShoppingList } from '@/lib/shopping';

describe('lista de compras e CSV', () => {
  it('soma 7 dias do plano (arroz: almoço 250 g × 7 + jantar de folga não usa arroz)', () => {
    const arroz = weeklyShoppingList(0).find(i => i.name === 'Arroz branco cozido')!;
    expect(arroz.grams).toBe(250 * 7);
  });
  it('plantão troca o jantar por arroz e frango', () => {
    const a = weeklyShoppingList(7).find(i => i.name === 'Arroz branco cozido')!;
    expect(a.grams).toBe((250 + 180) * 7);
    expect(weeklyShoppingList(7).some(i => i.name === 'Batata-doce cozida')).toBe(false);
  });
  it('todo item tem categoria conhecida', () => {
    expect(weeklyShoppingList(2).filter(i => i.category === 'Outros')).toEqual([]);
  });
  it('formata quantidades', () => { expect(formatQty(450)).toBe('450 g'); expect(formatQty(1750)).toBe('1,75 kg'); });
  it('CSV usa ; vírgula decimal, BOM e escapa aspas', () => {
    const c = toCsv(['a', 'b'], [['x;y', 1.5], ['"q"', 2]]);
    expect(c.startsWith('﻿')).toBe(true);
    expect(c).toContain('"x;y";1,5');
    expect(c).toContain('"""q""";2');
  });
});
