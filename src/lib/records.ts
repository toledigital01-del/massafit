/** Recordes pessoais e resumo de treino (módulo puro, testado). */
export type SetRow = { exercise: string; day: string; set_number: number; weight: number; reps: number };

/** Pontuação da série: carga estimada de 1 repetição (Epley); sem carga extra, conta só as repetições. */
export const setScore = (s: { weight: number; reps: number }) => (s.weight > 0 ? s.weight * (1 + s.reps / 30) : s.reps);

const num = (r: SetRow): SetRow => ({ ...r, weight: Number(r.weight) });

/** Melhor série do exercício antes de um dia (ou em todo o histórico, sem `beforeDay`). */
export function personalRecord(logs: SetRow[], exercise: string, beforeDay?: string): SetRow | null {
  let best: SetRow | null = null;
  for (const l of logs.map(num)) {
    if (l.exercise !== exercise || (beforeDay !== undefined && l.day >= beforeDay)) continue;
    if (!best || setScore(l) > setScore(best)) best = l;
  }
  return best;
}

/** Série bateu o recorde? Só vale se já havia histórico anterior (a primeira vez não é "recorde"). */
export function isNewRecord(logs: SetRow[], s: SetRow): boolean {
  const prev = personalRecord(logs, s.exercise, s.day);
  return prev !== null && setScore({ weight: Number(s.weight), reps: s.reps }) > setScore(prev);
}

export type Summary = { sets: number; volume: number; reps: number; records: number; prevVolume: number | null; prevDay: string | null; change: number | null };

/** Resumo do dia: séries, volume (kg × reps), recordes batidos e comparação com o treino anterior dos mesmos exercícios. */
export function sessionSummary(logs: SetRow[], day: string, slugs: string[]): Summary {
  const mine = logs.map(num).filter(l => slugs.includes(l.exercise));
  const today = mine.filter(l => l.day === day);
  const vol = (rows: SetRow[]) => Math.round(rows.reduce((s, l) => s + l.weight * l.reps, 0));
  const prevDay = [...new Set(mine.filter(l => l.day < day).map(l => l.day))].sort().at(-1) ?? null;
  const prevVolume = prevDay ? vol(mine.filter(l => l.day === prevDay)) : null;
  const volume = vol(today);
  return {
    sets: today.length, volume, reps: today.reduce((s, l) => s + l.reps, 0),
    records: today.filter(l => isNewRecord(logs, l)).length,
    prevVolume, prevDay, change: prevVolume && prevVolume > 0 && volume > 0 ? Math.round(((volume - prevVolume) / prevVolume) * 100) : null,
  };
}
