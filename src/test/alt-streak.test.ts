import { describe, expect, it } from 'vitest';
import { ALTERNATIVES, alternativesFor, exerciseBySlug } from '@/lib/workout-alt';
import { streakInfo, weekStart } from '@/lib/streak';
import { homePlan } from '@/lib/workout-home';
import { workoutPlan } from '@/lib/workout';

describe('troca de exercício', () => {
  const slugs = [...workoutPlan, ...homePlan].flatMap(d => d.exercises.map(e => e.slug));
  it('todo exercício tem ao menos uma alternativa válida e diferente dele', () => {
    for (const s of new Set(slugs)) {
      const alts = ALTERNATIVES[s] ?? [];
      expect(alts.length, s).toBeGreaterThan(0);
      for (const a of alts) { expect(a).not.toBe(s); expect(exerciseBySlug(a), `${s} → ${a}`).toBeDefined(); }
    }
    expect(alternativesFor('agachamento').map(e => e.slug)).toEqual(['leg-press', 'agachamento-mochila']);
  });
});
describe('sequência de treino', () => {
  it('semana começa na segunda', () => { expect(weekStart('2026-11-24')).toBe('2026-11-23'); expect(weekStart('2026-11-22')).toBe('2026-11-16'); });
  it('conta semanas seguidas com 3+ dias, sem quebrar pela semana em andamento', () => {
    const days = ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09', '2026-11-11', '2026-11-13', '2026-11-16', '2026-11-18', '2026-11-20', '2026-11-23'];
    expect(streakInfo(days, '2026-11-24')).toEqual({ weeks: 3, thisWeek: 1 });
    expect(streakInfo([...days, '2026-11-25', '2026-11-26'], '2026-11-26')).toEqual({ weeks: 4, thisWeek: 3 });
  });
  it('semana fraca quebra a sequência', () => {
    expect(streakInfo(['2026-11-16', '2026-11-17', '2026-11-23'], '2026-11-24').weeks).toBe(0);
  });
});
