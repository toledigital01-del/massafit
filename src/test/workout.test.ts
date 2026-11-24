import { describe, expect, it } from 'vitest';
import { planForMode, suggestNext, workoutForDate, workoutPlan } from '@/lib/workout';
import { homePlan } from '@/lib/workout-home';
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
describe('treino em casa (sem equipamentos de academia)', () => {
  const exercises = homePlan.flatMap(d => d.exercises);
  it('tem os mesmos 4 treinos ABCD e a mesma agenda da academia', () => {
    expect(homePlan.map(d => d.key)).toEqual(['A', 'B', 'C', 'D']);
    expect(workoutForDate(new Date(2026, 10, 16), 'home')?.key).toBe('A');
    expect(workoutForDate(new Date(2026, 10, 17), 'home')?.key).toBe('B');
    expect(workoutForDate(new Date(2026, 10, 18), 'home')).toBeNull();
  });
  it('planForMode escolhe o plano certo e a academia continua o padrão', () => {
    expect(planForMode('home')).toBe(homePlan);
    expect(planForMode('gym')).toBe(workoutPlan);
    expect(workoutForDate(new Date(2026, 10, 16))?.exercises[0]?.slug).toBe('supino-reto');
  });
  it('não repete exercício dentro do plano de casa', () => {
    const slugs = exercises.map(e => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it('só compartilha com a academia a prancha (mesmo registro e foto)', () => {
    const gym = new Set(workoutPlan.flatMap(d => d.exercises.map(e => e.slug)));
    expect(exercises.map(e => e.slug).filter(s => gym.has(s))).toEqual(['prancha']);
  });
  it('todo exercício tem material, execução, erros comuns e variações', () => {
    for (const e of exercises) {
      expect(e.equip, e.slug).toBeTruthy();
      expect(e.cues.length, e.slug).toBeGreaterThanOrEqual(3);
      expect(e.mistakes.length, e.slug).toBeGreaterThanOrEqual(2);
      expect(e.easier, e.slug).toBeTruthy();
      expect(e.harder, e.slug).toBeTruthy();
      expect(e.repMin, e.slug).toBeLessThan(e.repMax);
    }
  });
  it('cabe nas regras do banco (séries 1–10, reps 1–100)', () => {
    for (const e of exercises) { expect(e.sets).toBeLessThanOrEqual(10); expect(e.repMax).toBeLessThanOrEqual(100); expect(e.repMin).toBeGreaterThanOrEqual(1); }
  });
  it('flexão: sem carga, ao bater o topo sugere progredir com +2 kg na mochila', () => {
    const flexao = exercises.find(e => e.slug === 'flexao')!;
    expect(suggestNext(flexao, Array(4).fill({ weight: 0, reps: 20 }))).toEqual({ weight: 2, reps: 8, increase: true });
    expect(suggestNext(flexao, [{ weight: 0, reps: 12 }, { weight: 0, reps: 10 }, { weight: 0, reps: 9 }, { weight: 0, reps: 8 }])).toEqual({ weight: 0, reps: 9, increase: false });
  });
  it('prancha de casa é por tempo e não pede carga', () => {
    const prancha = exercises.find(e => e.slug === 'prancha')!;
    expect(prancha.timed).toBe(true);
    expect(suggestNext(prancha, Array(3).fill({ weight: 0, reps: 60 }))).toEqual({ weight: 0, reps: 70, increase: false });
  });
});
