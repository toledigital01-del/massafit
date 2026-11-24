/** Sequência de semanas (seg–dom) com treino suficiente, a partir dos dias com séries registradas. */
const dayMs = (d: string) => Date.parse(`${d}T12:00:00Z`);
const DAY = 86_400_000;

/** Segunda-feira da semana de `d`, como "AAAA-MM-DD". */
export function weekStart(d: string): string {
  const t = new Date(dayMs(d)); const dow = (t.getUTCDay() + 6) % 7;
  return new Date(dayMs(d) - dow * DAY).toISOString().slice(0, 10);
}

export function streakInfo(trainedDays: string[], today: string, goalPerWeek = 3): { weeks: number; thisWeek: number } {
  const byWeek = new Map<string, Set<string>>();
  for (const d of trainedDays) { const w = weekStart(d); byWeek.set(w, (byWeek.get(w) ?? new Set()).add(d)); }
  const cur = weekStart(today);
  const thisWeek = byWeek.get(cur)?.size ?? 0;
  let weeks = thisWeek >= goalPerWeek ? 1 : 0;
  // semana atual ainda em andamento não quebra a sequência: conta a partir da anterior
  for (let w = dayMs(cur) - 7 * DAY; ; w -= 7 * DAY) {
    const n = byWeek.get(new Date(w).toISOString().slice(0, 10))?.size ?? 0;
    if (n >= goalPerWeek) weeks++; else break;
  }
  return { weeks, thisWeek };
}
