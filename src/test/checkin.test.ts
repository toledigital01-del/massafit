import { describe, expect, it } from 'vitest';
import { advise, movingAverage, weeklyRate } from '@/lib/checkin';

const pts = [['2026-11-10', 69], ['2026-11-12', 69.2], ['2026-11-14', 69.1], ['2026-11-17', 69.5], ['2026-11-19', 69.7], ['2026-11-21', 69.6]].map(([day, weight]) => ({ day: day as string, weight: weight as number }));
describe('check-in semanal', () => {
  it('média móvel usa só os últimos 7 dias', () => {
    const m = movingAverage(pts);
    expect(m[0]!.avg).toBe(69);
    expect(m[5]!.avg).toBeCloseTo((69.5 + 69.7 + 69.6) / 3, 1);
  });
  it('ritmo semanal compara semana atual com a anterior', () => {
    const r = weeklyRate(pts, '2026-11-22')!;
    expect(r.rate).toBeCloseTo(0.5, 1);
  });
  it('sem dados suficientes retorna null', () => {
    expect(weeklyRate(pts.slice(0, 2), '2026-11-22')).toBeNull();
  });
  it('conselho segue a regra das faixas', () => {
    expect(advise(0.1).kind).toBe('up');
    expect(advise(0.2).kind).toBe('keep');
    expect(advise(0.5).kind).toBe('keep');
    expect(advise(0.6)).toMatchObject({ kind: 'down', delta: -150 });
  });
});
