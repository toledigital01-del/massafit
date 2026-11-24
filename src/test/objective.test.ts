import { describe, expect, it } from 'vitest';
import { calculateGoals, calorieFloor, exampleProfile, objectiveOf, projectionWeeks } from '@/lib/nutrition';
import { advise } from '@/lib/checkin';
import { buildDay, EMPTY_STATE, NO_PREFS } from '@/lib/plan-engine';

const loser = { ...exampleProfile, weight: 85, target_weight: 78 };
describe('objetivo: emagrecer / manter / ganhar', () => {
  it('deduz o objetivo do peso-meta', () => {
    expect(objectiveOf(exampleProfile)).toBe('gain');
    expect(objectiveOf(loser)).toBe('lose');
    expect(objectiveOf({ weight: 70, target_weight: 70.3 })).toBe('maintain');
  });
  it('déficit reduz calorias, mantém proteína e respeita o piso', () => {
    const g = calculateGoals(loser, -400), m = calculateGoals(loser, 0);
    expect(g.calories).toBe(m.expenditure - 400);
    expect(m.calories).toBe(m.expenditure);
    expect(g.protein).toBe(170);
    expect(calculateGoals({ ...loser, weight: 45, age: 80, activity: 1.2 }, -750).calories).toBeGreaterThanOrEqual(calorieFloor('male'));
  });
  it('ganho continua igual', () => { expect(calculateGoals(exampleProfile).calories).toBe(2778); });
  it('projeção de perda usa 0,25–0,75 kg/sem', () => { expect(projectionWeeks(85, 78)).toEqual({ fastest: 10, slowest: 28 }); });
  it('check-in de perda: lento reduz, ideal mantém, rápido demais aumenta', () => {
    expect(advise(-0.1, 'lose').delta).toBe(-150);
    expect(advise(-0.5, 'lose').delta).toBe(0);
    expect(advise(-1, 'lose').delta).toBe(150);
    expect(advise(0.1, 'maintain').delta).toBe(0);
    expect(advise(0.3, 'gain').delta).toBe(0);
  });
  it('plano alimentar acompanha a meta de emagrecimento', () => {
    const g = calculateGoals(loser, -400);
    const d = buildDay(g, { meals: 4, training: false, shift: false, prefs: NO_PREFS, state: EMPTY_STATE, dayIndex: 0 });
    expect(Math.abs(d.kcal / g.calories - 1)).toBeLessThan(0.1);
  });
});
