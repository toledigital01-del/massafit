import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Copy, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataBoundary } from '@/components/dashboard-data';
import { calculateGoals, objectiveOf, type Objective } from '@/lib/nutrition';
import { loadPrefs, loadSettings, DEFAULT_SETTINGS } from '@/lib/plan-storage';
import { NO_PREFS } from '@/lib/plan-engine';
import { formatQty, planShoppingList } from '@/lib/shopping';

export const Route = createFileRoute('/compras')({
  head: () => ({ meta: [
    { title: 'Lista de compras · MassaFit' },
    { name: 'description', content: 'Lista de compras para 1 semana, 2 semanas ou 1 mês, gerada a partir do seu plano alimentar, com quantidades somadas.' },
    { property: 'og:title', content: 'Lista de compras · MassaFit' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Shopping,
});
const KEY = 'massafit-shopping-checked';

function Shopping() { return <DataBoundary>{data => <ShoppingBody objective={objectiveOf(data.profile!)} goals={data.goals ?? calculateGoals(data.profile!)} />}</DataBoundary>; }

function ShoppingBody({ goals, objective }: { objective: Objective; goals: { calories: number; protein: number; carbs: number; fat: number } }) {
  const [shiftDays, setShiftDays] = useState(0);
  const [days, setDays] = useState<7 | 14 | 30>(7);
  const [cfg, setCfg] = useState({ prefs: NO_PREFS, meals: DEFAULT_SETTINGS.meals });
  const [checked, setChecked] = useState<string[]>([]);
  useEffect(() => { setCfg({ prefs: loadPrefs(), meals: loadSettings().meals }); try { setChecked(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { /* ignora */ } }, []);
  const toggle = (n: string) => setChecked(c => { const next = c.includes(n) ? c.filter(x => x !== n) : [...c, n]; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignora */ } return next; });
  const items = useMemo(() => planShoppingList({ calories: goals.calories, protein: goals.protein, carbs: goals.carbs, fat: goals.fat }, { meals: cfg.meals, prefs: cfg.prefs, shiftDays, objective }).map(i => ({ ...i, grams: i.grams * days / 7 })), [objective, goals.calories, goals.protein, goals.carbs, goals.fat, cfg, shiftDays, days]);
  const groups = useMemo(() => [...new Set(items.map(i => i.category))].map(c => ({ c, list: items.filter(i => i.category === c) })), [items]);
  const text = groups.map(g => `${g.c}\n${g.list.map(i => `- ${i.name}: ${formatQty(i.grams)}`).join('\n')}`).join('\n\n');
  return <div className="fade-in">
    <div className="dashboard-heading"><div><p className="eyebrow mb-2">SEM IMPROVISO</p><h1>Lista de compras<span className="text-primary">.</span></h1><p className="text-sm font-semibold mt-2">Para {days === 7 ? '1 semana (7 dias)' : days === 14 ? '2 semanas (14 dias)' : '1 mês (30 dias)'}</p><p className="text-xs text-muted-foreground mt-1">Soma tudo o que o seu plano pede nesse período, em peso já cozido/pronto. Desconte o que já tem em casa.</p></div>
      <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(text); toast.success('Lista copiada!'); }}><Copy/>Copiar</Button></div>
    <div role="group" aria-label="Período da lista" className="grid grid-cols-3 gap-1 rounded-md border border-border bg-card p-1 mb-3">{([[7, '1 semana'], [14, '2 semanas'], [30, '1 mês']] as const).map(([d, l]) => <button type="button" key={d} aria-pressed={days === d} onClick={() => setDays(d)} className={`rounded py-2.5 text-sm font-semibold transition ${days === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{l}</button>)}</div>
    <div className="panel p-4 mb-5 flex items-center gap-3 text-sm"><ShoppingCart size={18} className="text-primary"/><label className="flex-1">Dias de plantão por semana (levar marmita)</label>
      <select className="bg-secondary rounded-md px-2 py-1" value={shiftDays} onChange={e => setShiftDays(Number(e.target.value))}>{[0, 1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
    <div className="nutrition-grid">{groups.map(g => <section className="panel p-6" key={g.c}><h2 className="section-title mb-3">{g.c}</h2>{g.list.map(i => <label key={i.name} className={`py-2.5 border-b border-border flex items-center gap-3 text-sm cursor-pointer ${checked.includes(i.name) ? 'opacity-50 line-through' : ''}`}><input type="checkbox" checked={checked.includes(i.name)} onChange={() => toggle(i.name)}/><span className="flex-1">{i.name}</span><span className="text-muted-foreground tabular-nums">{formatQty(i.grams)}</span></label>)}</section>)}</div>
  </div>;
}
