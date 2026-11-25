import { describe, expect, it } from 'vitest';
import { DEFAULT_REMINDERS, nextReminder, remindersForDay } from '@/lib/reminders';

const on = { ...DEFAULT_REMINDERS, enabled: true };
describe('lembretes', () => {
  it('gera água, refeições do plano e treino no dia de treino (segunda)', () => {
    const r = remindersForDay(new Date(2026, 10, 23, 0, 0), on, 5); // segunda
    expect(r.filter(x => x.id.startsWith('ref-'))).toHaveLength(5);
    expect(r.some(x => x.id === 'treino')).toBe(true);
    expect(r.filter(x => x.id.startsWith('agua-')).length).toBeGreaterThan(3);
  });
  it('sem treino na quarta-feira', () => {
    expect(remindersForDay(new Date(2026, 10, 25), on, 5).some(x => x.id === 'treino')).toBe(false);
  });
  it('antecedência de refeição', () => {
    const r = remindersForDay(new Date(2026, 10, 24), { ...on, water: false, training: false, mealLead: 15 }, 4);
    expect(r[0]!.at.getHours() * 60 + r[0]!.at.getMinutes()).toBe(6 * 60 + 45);
  });
  it('próximo lembrete depois das 22h cai no dia seguinte', () => {
    const n = nextReminder(new Date(2026, 10, 24, 23, 0), on, 5)!;
    expect(n.at.getDate()).toBe(25);
  });
  it('tudo desligado não gera nada', () => {
    expect(nextReminder(new Date(), { ...on, water: false, meals: false, training: false }, 5)).toBeNull();
  });
});
