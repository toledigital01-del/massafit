import { describe, expect, it } from 'vitest';
import { measurementDeltas, photoPath } from '@/lib/progress';
describe('progresso', () => {
  it('variação entre primeira e última medida de cada região', () => {
    const d = measurementDeltas([{ day: '2026-12-01', waist: 86, arm: null }, { day: '2026-11-01', waist: 88, arm: 32 }, { day: '2026-12-20', waist: 84.5, arm: 33.5 }]);
    expect(d.waist).toEqual({ first: 88, last: 84.5, delta: -3.5 });
    expect(d.arm).toEqual({ first: 32, last: 33.5, delta: 1.5 }); // ignora o dia sem braço
  });
  it('caminho da foto fica na pasta do usuário', () => { expect(photoPath('u1', '2026-11-24', 'lado')).toBe('u1/2026-11-24-lado.jpg'); });
});
