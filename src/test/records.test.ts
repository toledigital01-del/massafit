import { describe, expect, it } from 'vitest';
import { isNewRecord, personalRecord, sessionSummary, setScore, type SetRow } from '@/lib/records';
const r = (day: string, weight: number, reps: number, n = 1, exercise = 'supino-reto'): SetRow => ({ exercise, day, set_number: n, weight, reps });
const hist = [r('2026-11-10', 60, 10), r('2026-11-10', 60, 8, 2), r('2026-11-17', 62.5, 8)];
describe('recordes', () => {
  it('pontua por 1RM estimado e, sem carga, por repetições', () => {
    expect(setScore({ weight: 60, reps: 10 })).toBeCloseTo(80);
    expect(setScore({ weight: 0, reps: 15 })).toBe(15);
  });
  it('recorde anterior ignora o próprio dia', () => {
    expect(personalRecord(hist, 'supino-reto', '2026-11-17')).toMatchObject({ weight: 60, reps: 10 });
    expect(personalRecord(hist, 'agachamento')).toBeNull();
  });
  it('só é recorde se já havia histórico e a série supera', () => {
    expect(isNewRecord(hist, r('2026-11-24', 65, 8))).toBe(true);
    expect(isNewRecord(hist, r('2026-11-24', 50, 8))).toBe(false);
    expect(isNewRecord([r('2026-11-24', 65, 8)], r('2026-11-24', 65, 8))).toBe(false);
  });
  it('resumo compara volume com o treino anterior', () => {
    const logs = [...hist, r('2026-11-24', 65, 8), r('2026-11-24', 65, 8, 2)];
    const s = sessionSummary(logs, '2026-11-24', ['supino-reto']);
    expect(s).toMatchObject({ sets: 2, volume: 1040, prevDay: '2026-11-17', prevVolume: 500, records: 2 });
    expect(s.change).toBe(108);
  });
  it('números vindos do banco como texto funcionam', () => {
    expect(personalRecord([{ ...r('2026-11-01', 0, 5), weight: '40' as unknown as number }], 'supino-reto')?.weight).toBe(40);
  });
});
