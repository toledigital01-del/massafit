import { useMemo } from 'react';
import { CalendarCheck } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { advise, movingAverage, weeklyRate, type WeightPoint } from '@/lib/checkin';
import { localDay } from '@/lib/nutrition';

export function CheckinCard({ weights, calories, target }: { weights: WeightPoint[]; calories?: number | undefined; target: number }) {
  const trend = useMemo(() => movingAverage(weights).slice(-30).map(p => ({ ...p, label: p.day.slice(8, 10) + '/' + p.day.slice(5, 7) })), [weights]);
  const wk = useMemo(() => weeklyRate(weights, localDay()), [weights]);
  const advice = wk ? advise(wk.rate) : null;
  const last = trend.at(-1);
  return <section className="panel p-5 mt-5">
    <div className="flex items-center gap-3 mb-3"><span className="size-11 bg-secondary rounded-md grid place-items-center text-primary"><CalendarCheck size={21}/></span><div className="flex-1"><p className="text-[10px] text-muted-foreground">CHECK-IN SEMANAL</p><p className="font-bold text-lg">{last ? `Média de 7 dias: ${last.avg.toLocaleString('pt-BR')} kg` : 'Registre o peso para começar'}</p></div>{last && <p className="text-xs text-muted-foreground text-right">faltam <span className="font-bold text-foreground">{Math.max(0, Math.round((target - last.avg) * 10) / 10).toLocaleString('pt-BR')} kg</span><br/>para {target} kg</p>}</div>
    {trend.length >= 2 && <div className="h-40"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1}/><XAxis dataKey="label" tick={{ fontSize: 10 }} /><YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 10 }} /><Tooltip formatter={(v: number, n: string) => [`${v.toLocaleString('pt-BR')} kg`, n === 'avg' ? 'Média 7 dias' : 'Peso']}/><Line type="monotone" dataKey="weight" stroke="currentColor" strokeOpacity={0.35} dot={{ r: 2 }} strokeWidth={1}/><Line type="monotone" dataKey="avg" stroke="var(--color-primary, #22c55e)" strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer></div>}
    {advice && wk ? <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs"><p className="font-semibold">{advice.title} <span className="text-muted-foreground font-normal">· {wk.rate > 0 ? '+' : ''}{wk.rate.toLocaleString('pt-BR')} kg vs. semana passada</span></p><p className="text-muted-foreground mt-1">{advice.text}{calories && advice.delta !== 0 ? ` Meta sugerida: ${calories + advice.delta} kcal/dia.` : ''}</p></div>
      : <p className="text-xs text-muted-foreground mt-3">Pese-se pelo menos 2 vezes por semana, sempre de manhã em jejum, por 2 semanas. Aí o app compara as médias e sugere o ajuste de calorias.</p>}
  </section>;
}
