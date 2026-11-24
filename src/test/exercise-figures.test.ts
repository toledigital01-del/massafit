import { describe, expect, it } from 'vitest';
import { FIGURES, cycleE, hasFigure, renderFigure } from '@/lib/exercise-figures';
import { homePlan } from '@/lib/workout-home';
import { workoutPlan } from '@/lib/workout';

describe('figuras de execução', () => {
  const slugs = [...workoutPlan, ...homePlan].flatMap(d => d.exercises.map(e => e.slug));
  it('todo exercício de academia e de casa tem figura', () => {
    expect(slugs.filter(s => !hasFigure(s))).toEqual([]);
  });
  it('renderiza início, meio e fim sem NaN', () => {
    for (const s of Object.keys(FIGURES)) for (const e of [0, 0.5, 1]) {
      const svg = renderFigure(s, e);
      expect(svg.length).toBeGreaterThan(100);
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    }
  });
  it('início e fim são diferentes (exceto isométricos)', () => {
    for (const [s, fig] of Object.entries(FIGURES)) {
      if (fig.view === 'side' && fig.hold) continue;
      expect(renderFigure(s, 0), s).not.toEqual(renderFigure(s, 1));
    }
  });
  it('ciclo começa e termina no início e passa pelo fim', () => {
    expect(cycleE(0)).toBe(0);
    expect(cycleE(3599)).toBeCloseTo(0, 1);
    expect(cycleE(0.55 * 3600)).toBe(1);
  });
});
