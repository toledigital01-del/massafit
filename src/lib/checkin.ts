/** Check-in semanal: média móvel de 7 dias, ritmo semanal e ajuste de calorias (módulo puro, testado). */
export type WeightPoint = { day: string; weight: number };
export type TrendPoint = { day: string; weight: number; avg: number };

const dayMs = (d: string) => Date.parse(`${d}T12:00:00Z`);
const DAY = 86_400_000;

/** Média dos pesos registrados nos 7 dias que terminam em cada registro. */
export function movingAverage(points: WeightPoint[]): TrendPoint[] {
  const sorted = [...points].sort((a, b) => a.day.localeCompare(b.day));
  return sorted.map(p => {
    const t = dayMs(p.day);
    const win = sorted.filter(q => dayMs(q.day) <= t && dayMs(q.day) > t - 7 * DAY);
    const avg = win.reduce((s, q) => s + q.weight, 0) / win.length;
    return { day: p.day, weight: p.weight, avg: Math.round(avg * 100) / 100 };
  });
}

/** Ritmo em kg/semana: média da última semana menos a da semana anterior (precisa de ≥2 registros em cada). */
export function weeklyRate(points: WeightPoint[], today: string): { rate: number; current: number } | null {
  const t = dayMs(today);
  const inRange = (from: number, to: number) => points.filter(p => dayMs(p.day) > t - to * DAY && dayMs(p.day) <= t - from * DAY).map(p => p.weight);
  const cur = inRange(0, 7), prev = inRange(7, 14);
  if (cur.length < 2 || prev.length < 2) return null;
  const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  return { rate: Math.round((mean(cur) - mean(prev)) * 100) / 100, current: Math.round(mean(cur) * 10) / 10 };
}

export type Advice = { kind: 'up' | 'keep' | 'down'; delta: number; title: string; text: string };

/** Regra: <0,2 kg/sem → +150–200 kcal; 0,2–0,5 → manter; >0,5 → −150 kcal. */
export function advise(rate: number, objective: 'gain' | 'lose' | 'maintain' = 'gain'): Advice {
  if (objective === 'lose') return adviseLoss(rate);
  if (objective === 'maintain') return adviseMaintain(rate);
  if (rate < 0.2) return { kind: 'up', delta: 175, title: 'Aumente um pouco a comida', text: `Você ganhou ${rate.toLocaleString('pt-BR')} kg na semana, abaixo da meta de 0,2–0,5 kg. Some cerca de 150–200 kcal por dia (ex.: mais uma porção de arroz e feijão ou uma banana com pasta de amendoim).` };
  if (rate <= 0.5) return { kind: 'keep', delta: 0, title: 'Ritmo perfeito', text: `Ganho de ${rate.toLocaleString('pt-BR')} kg na semana, dentro da faixa ideal de 0,2–0,5 kg. Mantenha as calorias.` };
  return { kind: 'down', delta: -150, title: 'Ganhando rápido demais', text: `Ganho de ${rate.toLocaleString('pt-BR')} kg na semana, acima de 0,5 kg: parte tende a ser gordura. Reduza cerca de 150 kcal por dia.` };
}

const kg = (n: number) => n.toLocaleString('pt-BR');
/** Emagrecer: ritmo saudável de perda 0,25–0,75 kg/sem (rate negativo = perdeu). */
function adviseLoss(rate: number): Advice {
  if (rate > -0.25) return { kind: 'down', delta: -150, title: 'Perda lenta: reduza um pouco', text: `Variação de ${kg(rate)} kg na semana, menos que os 0,25–0,75 kg de perda desejados. Reduza cerca de 150 kcal por dia (ex.: menos uma porção de carboidrato) e confira se está pesando e registrando tudo.` };
  if (rate >= -0.75) return { kind: 'keep', delta: 0, title: 'Ritmo perfeito', text: `Perda de ${kg(Math.abs(rate))} kg na semana, dentro da faixa de 0,25–0,75 kg. Mantenha as calorias.` };
  return { kind: 'up', delta: 150, title: 'Perdendo rápido demais', text: `Perda de ${kg(Math.abs(rate))} kg na semana, acima de 0,75 kg: há risco de perder músculo. Some cerca de 150 kcal por dia.` };
}
/** Manter: variação de até 0,2 kg/sem. */
function adviseMaintain(rate: number): Advice {
  if (rate > 0.2) return { kind: 'down', delta: -100, title: 'Peso subindo', text: `Variação de +${kg(rate)} kg na semana. Reduza cerca de 100 kcal por dia se quiser manter o peso.` };
  if (rate < -0.2) return { kind: 'up', delta: 100, title: 'Peso caindo', text: `Variação de ${kg(rate)} kg na semana. Some cerca de 100 kcal por dia para manter o peso.` };
  return { kind: 'keep', delta: 0, title: 'Peso estável', text: 'Variação dentro de ±0,2 kg na semana. Mantenha as calorias.' };
}
