import { describe, expect, it } from 'vitest';
import { buildDay, NO_PREFS, EMPTY_STATE } from '@/lib/plan-engine';

// O motor foi calibrado primeiro para metas altas (~2800 kcal); aqui garantimos
// que metas menores (perda de peso, perfis leves) também fecham perto do alvo.
describe('plano do dia com metas de poucas calorias', () => {
  const goalFor = (kcal: number) => {
    const protein = Math.round((kcal < 1800 ? 60 : 75) * 2);
    const fat = Math.round((kcal * 0.28) / 9);
    return { calories: kcal, protein, fat, carbs: Math.round((kcal - protein * 4 - fat * 9) / 4), water: 2500 };
  };
  for (const kcal of [1200, 1300, 1400, 1500, 1600, 1700, 1800, 2000]) {
    it(`fica perto da meta de ${kcal} kcal em qualquer dia`, () => {
      const limit = kcal <= 1200 ? 0.15 : 0.09;
      for (const meals of [4, 5, 6] as const)
        for (const training of [true, false])
          for (let i = 0; i < 7; i++) {
            const d = buildDay(goalFor(kcal) as never, { meals, training, shift: false, prefs: NO_PREFS, state: EMPTY_STATE, dayIndex: i, objective: 'lose' });
            expect(Math.abs(d.kcal / kcal - 1)).toBeLessThan(limit);
          }
    });
  }
});
