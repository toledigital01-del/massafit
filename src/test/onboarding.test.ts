import { describe, expect, it } from 'vitest';
import { activityFactor, answersFrom, defaultPace, preview, stepError, suggestedTarget } from '@/lib/onboarding';

const base = { ...answersFrom({ name: 'Ana', age: 30, height: 165, weight: 70, sex: 'female' }), objective: 'lose' as const, target_weight: 64 };

describe('primeiro acesso', () => {
  it('estima o nível de atividade pela rotina', () => {
    expect(activityFactor(0, false)).toBe(1.2);
    expect(activityFactor(3, false)).toBe(1.375);
    expect(activityFactor(4, false)).toBe(1.55);
    expect(activityFactor(4, true)).toBe(1.725);
    expect(activityFactor(7, true)).toBe(1.9);
  });
  it('sugere o peso-meta por objetivo', () => {
    expect(suggestedTarget('gain', 70)).toBe(75);
    expect(suggestedTarget('lose', 80)).toBe(73.5);
    expect(suggestedTarget('maintain', 70)).toBe(70);
  });
  it('valida cada passo', () => {
    expect(stepError(1, { ...base, name: '' })).toMatch(/chamar/);
    expect(stepError(1, { ...base, age: 17 })).toMatch(/18/);
    expect(stepError(2, { ...base, target_weight: 72 })).toMatch(/menor/);
    expect(stepError(2, { ...base, objective: 'gain', target_weight: 60 })).toMatch(/maior/);
    expect(stepError(2, { ...base, height: 190, weight: 70, target_weight: 60 })).toMatch(/IMC/);
    expect(stepError(2, base)).toBeNull();
    expect(stepError(3, { ...base, trainingDays: 9 })).toMatch(/0 a 7/);
  });
  it('monta metas coerentes com o objetivo', () => {
    const lose = preview(base, defaultPace('lose'));
    expect(lose.goals.calories).toBeLessThan(lose.goals.expenditure);
    const gain = preview({ ...base, objective: 'gain', target_weight: 75 }, defaultPace('gain'));
    expect(gain.goals.calories).toBeGreaterThan(gain.goals.expenditure);
    const keep = preview({ ...base, objective: 'maintain', target_weight: 70 }, 0);
    expect(keep.goals.calories).toBe(keep.goals.expenditure);
  });
});
