import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { Copy, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataBoundary } from '@/components/dashboard-data';
import { calculateGoals } from '@/lib/nutrition';
import { loadPrefs, loadSettings, DEFAULT_SETTINGS } from '@/lib/plan-storage';
import { NO_PREFS } from '@/lib/plan-engine';
import { formatQty, planShoppingList } from '@/lib/shopping';

export const Route = createFileRoute('/compras')({
  head: () => ({ meta: [
    { title: 'Lista de compras da semana · MassaFit' },
    { name: 'description', content: 'Lista de compras semanal gerada a partir do seu plano alimentar, com quantidades somadas.' },
    { property: 'og:title', content: 'Lista de compras · MassaFit' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Shopping,
});
const KEY = 'massafit-shopping-checked';

function Shopping() { return <DataBoundary>{data => <ShoppingBody goals={data.goals ?? calculateGoals(data.profile!)} />}</DataBoundary>; }

function ShoppingBody({ goals }: { goals: { calories: number; protein: number; carbs: number; fat: number } }) {
  const [shiftDays, setShiftDays] = useState(0);
  const [cfg, setCfg] = useState({ prefs: NO_PREFS, meals: DEFAULT_SETTINGS.meals });
  const [checked, setChecked] = useState<string[]>([]);
  useEffect(() => { setCfg({ prefs: loadPrefs(), meals: loadSettings().meals }); try { setChecked(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { /* ignora */ } }, []);
  const toggle = (n: string) => setChecked(c => { const next = c.includes(n) ? c.filter(x => x !== n) : [...c, n]; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignora */ } return next; });
  const items = useMemo(() => planShoppingList({ calories: goals.calories, protein: goals.protein, carbs: goals.carbs, fat: goals.fat }, { meals: cfg.meals, prefs: cfg.prefs, shiftDays }), [goals.calories, goals.protein, goals.carbs, goals.fat, cfg, shiftDays]);
  const groups = useMemo(() => [...new Set(items.map(i => i.category))].map(c => ({ c, list: items.filter(i => i.category === c) })), [items]);
  const text = groups.map(g => `${g.c}\n${g.list.map(i => `- ${i.name}: ${formatQty(i.grams)}`).join('\n')}`).join('\n\n');
  return <div className="fade-in">
    <div className="dashboard-heading"><div><p className="eyebrow mb-2">SEMANA SEM IMPROVISO</p><h1>Lista de compras<span className="text-primary">.</span></h1><p className="text-xs text-muted-foreground mt-2">Quantidades em peso cozido/pronto, somadas de 7 dias do plano. Ajuste ao que já tem em casa.</p></div>
      <Button variant="secondary" onClick={async () => { await navigator.clipboard.writeText(text); toast.success('Lista copiada!'); }}><Copy/>Copiar</Button></div>
    <div className="panel p-4 mb-5 flex items-center gap-3 text-sm"><ShoppingCart size={18} className="text-primary"/><label className="flex-1">Dias de plantão na semana (marmita)</label>
      <select className="bg-secondary rounded-md px-2 py-1" value={shiftDays} onChange={e => setShiftDays(Number(e.target.value))}>{[0, 1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
    <div className="nutrition-grid">{groups.map(g => <section className="panel p-6" key={g.c}><h2 className="section-title mb-3">{g.c}</h2>{g.list.map(i => <label key={i.name} className={`py-2.5 border-b border-border flex items-center gap-3 text-sm cursor-pointer ${checked.includes(i.name) ? 'opacity-50 line-through' : ''}`}><input type="checkbox" checked={checked.includes(i.name)} onChange={() => toggle(i.name)}/><span className="flex-1">{i.name}</span><span className="text-muted-foreground tabular-nums">{formatQty(i.grams)}</span></label>)}</section>)}</div>
  </div>;
}
