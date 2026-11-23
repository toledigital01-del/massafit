import { describe, expect, it } from 'vitest';
import { suggestNext, workoutForDate, workoutPlan } from '@/lib/workout';
const supino = { sets: 4, repMin: 6, repMax: 10, step: 2.5 };
describe('dupla progressão', () => {
  it('sobe 2,5 kg quando todas as séries batem o topo', () => {
    expect(suggestNext(supino, Array(4).fill({ weight: 60, reps: 10 }))).toEqual({ weight: 62.5, reps: 6, increase: true });
  });
  it('mantém a carga e pede +1 repetição quando não bateu o topo', () => {
    expect(suggestNext(supino, [{ weight: 60, reps: 10 }, { weight: 60, reps: 8 }, { weight: 60, reps: 8 }, { weight: 60, reps: 7 }])).toEqual({ weight: 60, reps: 8, increase: false });
  });
  it('não sobe carga com menos séries que o planejado', () => {
    expect(suggestNext(supino, [{ weight: 60, reps: 10 }])?.increase).toBe(false);
  });
});
describe('divisão ABCD', () => {
  it('tem 4 treinos', () => expect(workoutPlan.map(d => d.key)).toEqual(['A', 'B', 'C', 'D']));
  it('segunda é treino A e quarta é descanso', () => {
    expect(workoutForDate(new Date(2026, 10, 16))?.key).toBe('A');
    expect(workoutForDate(new Date(2026, 10, 18))).toBeNull();
  });
});
