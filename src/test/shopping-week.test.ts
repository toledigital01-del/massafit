import { describe, expect, it } from 'vitest';
import { buildDay, NO_PREFS, EMPTY_STATE, isTrainingWeekday } from '@/lib/plan-engine';
import { planShoppingList } from '@/lib/shopping';

const goals = { calories: 2200, protein: 140, carbs: 250, fat: 70 };
describe('lista de compras segue o plano da semana', () => {
  it('soma exatamente os alimentos dos 7 dias do plano', () => {
    const list = planShoppingList(goals, { meals: 5, prefs: NO_PREFS, shiftDays: 0 });
    const total = Array.from({ length: 7 }, (_, d) => buildDay(goals, { meals: 5, shift: false, prefs: NO_PREFS, training: isTrainingWeekday(d), dayIndex: d, state: EMPTY_STATE })).flatMap(d => d.meals).reduce((s, m) => s + m.items.reduce((a, i) => a + i.grams, 0), 0);
    expect(Math.abs(list.reduce((s, i) => s + i.grams, 0) - total)).toBeLessThan(1);
  });
  it('muda quando o usuário troca opção de uma refeição', () => {
    const base = planShoppingList(goals, { meals: 5, prefs: NO_PREFS, shiftDays: 0 });
    const day0 = buildDay(goals, { meals: 5, shift: false, prefs: NO_PREFS, training: true, dayIndex: 0, state: EMPTY_STATE });
    const m = day0.meals.find(x => x.optionCount > 1)!;
    const swapped = planShoppingList(goals, { meals: 5, prefs: NO_PREFS, shiftDays: 0, states: { '0': { opt: { [m.type]: (m.optionIndex + 1) % m.optionCount }, swap: {} } } });
    expect(JSON.stringify(swapped)).not.toBe(JSON.stringify(base));
  });
});
