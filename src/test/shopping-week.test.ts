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

describe('aba Semana e lista de compras usam a mesma semana', () => {
  it('uma troca de alimento aparece na Semana e na lista com as mesmas gramas', async () => {
    const { buildWeek, shoppingFromWeek, swapCandidates } = await import('@/lib/plan-engine');
    const d0 = buildWeek(goals, { meals: 5, prefs: NO_PREFS })[0]!;
    const m = d0.meals[0]!; const it0 = m.items[0]!;
    const to = swapCandidates(it0, NO_PREFS, 1)[0]!.food;
    const states = { '0': { opt: {}, swap: { [`${m.type}:${it0.slot}`]: to.id } } };
    const week = buildWeek(goals, { meals: 5, prefs: NO_PREFS }, { states, shiftDays: [] });
    expect(week[0]!.meals[0]!.items[0]!.food.id).toBe(to.id);
    const fromWeek = shoppingFromWeek(week).map(l => [l.food.name, l.grams]);
    const list = planShoppingList(goals, { meals: 5, prefs: NO_PREFS, shiftDays: 0, states }).map(l => [l.name, l.grams]);
    expect(list.sort()).toEqual(fromWeek.sort());
  });
});
