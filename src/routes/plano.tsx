import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { BookmarkPlus, BriefcaseBusiness, Check, Dumbbell, Moon, RefreshCw, Settings2, Shuffle, Sun, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataBoundary } from '@/components/dashboard-data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { calculateGoals, localDay } from '@/lib/nutrition';
import { buildDay, buildWeek, isTrainingWeekday, optionsFor, swapCandidates, weekdayIndex, type Day, type Goals, type Item, type Meal, type PlanState, type Prefs } from '@/lib/plan-engine';
import { DEFAULT_SETTINGS, loadFavorites, loadPrefs, loadSettings, loadStates, saveFavorites, savePrefs, saveSettings, saveStates, stateFor, type Favorite, type PlanSettings } from '@/lib/plan-storage';
import type { Tag } from '@/lib/plan-foods';
import type { MealType } from '@/lib/plan-templates';
import { NO_PREFS } from '@/lib/plan-engine';

export const Route = createFileRoute('/plano')({
  head: () => ({ meta: [
    { title: 'Plano alimentar flexível · MassaFit' },
    { name: 'description', content: 'Plano gerado pelas suas metas, com trocas equivalentes, preferências, registro em um toque e plano da semana.' },
    { property: 'og:title', content: 'Plano alimentar · MassaFit' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Plan,
});

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const AVOID: { tag: Tag; label: string }[] = [
  { tag: 'lactose', label: 'Lactose' }, { tag: 'gluten', label: 'Glúten' }, { tag: 'redmeat', label: 'Carne vermelha' },
  { tag: 'fish', label: 'Peixe' }, { tag: 'egg', label: 'Ovo' },
];
const diff = (v: number, goal: number, unit: string) => { const d = Math.round(v - goal); return `${d >= 0 ? 'sobra' : 'falta'} ${Math.abs(d)} ${unit}`; };

function Plan() {
  const [settings, setSettings] = useState<PlanSettings>(DEFAULT_SETTINGS);
  const [prefs, setPrefs] = useState<Prefs>(NO_PREFS);
  const [states, setStates] = useState<Record<string, PlanState>>({});
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [weekday, setWeekday] = useState(() => weekdayIndex(new Date()));
  const [tab, setTab] = useState<'dia' | 'semana'>('dia');
  const [swapFor, setSwapFor] = useState<{ meal: Meal; item: Item } | null>(null);
  const [prefOpen, setPrefOpen] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { setSettings(loadSettings()); setPrefs(loadPrefs()); setStates(loadStates()); setFavs(loadFavorites()); }, []);

  const training = isTrainingWeekday(weekday);
  const state = stateFor(states, weekday);
  const patchState = (fn: (s: PlanState) => PlanState) => setStates(all => { const next = { ...all, [String(weekday)]: fn(stateFor(all, weekday)) }; saveStates(next); return next; });
  const patchSettings = (s: PlanSettings) => { setSettings(s); saveSettings(s); };
  const patchPrefs = (p: Prefs) => { setPrefs(p); savePrefs(p); };

  return <DataBoundary>{(data, act, busy) => {
    const g = data.goals ?? calculateGoals(data.profile ?? { name: '', sex: 'male', age: 47, height: 177, weight: 69, target_weight: 75, activity: 1.55, training_days: 4, shifts: false });
    const goals: Goals = { calories: g.calories, protein: g.protein, carbs: g.carbs, fat: g.fat };
    return <PlanBody {...{ goals, settings, prefs, state, weekday, setWeekday, training, tab, setTab, patchState, patchSettings, patchPrefs, favs, setFavs, swapFor, setSwapFor, prefOpen, setPrefOpen, done, setDone, act, busy }} />;
  }}</DataBoundary>;
}

type Act = (d: never) => Promise<boolean>;
function PlanBody(p: {
  goals: Goals; settings: PlanSettings; prefs: Prefs; state: PlanState; weekday: number; setWeekday: (n: number) => void; training: boolean;
  tab: 'dia' | 'semana'; setTab: (t: 'dia' | 'semana') => void; patchState: (fn: (s: PlanState) => PlanState) => void;
  patchSettings: (s: PlanSettings) => void; patchPrefs: (p: Prefs) => void; favs: Favorite[]; setFavs: (f: Favorite[]) => void;
  swapFor: { meal: Meal; item: Item } | null; setSwapFor: (v: { meal: Meal; item: Item } | null) => void; prefOpen: boolean; setPrefOpen: (b: boolean) => void;
  done: string[]; setDone: (d: string[]) => void; act: Act; busy: boolean;
}) {
  const { goals, settings, prefs, state, weekday, training } = p;
  const day: Day = useMemo(() => buildDay(goals, { meals: settings.meals, training, shift: settings.shift, prefs, state, dayIndex: weekday }), [goals, settings, training, prefs, state, weekday]);
  const week: Day[] = useMemo(() => p.tab === 'semana' ? buildWeek(goals, { meals: settings.meals, shift: settings.shift, prefs }) : [], [p.tab, goals, settings, prefs]);
  const today = weekday === weekdayIndex(new Date());

  const logMeal = async (m: Meal) => {
    const items = m.items.map(i => ({ name: i.food.name, grams: i.grams, calories: i.kcal, protein: i.p, carbs: i.c, fat: i.f }));
    const ok = await p.act({ kind: 'custom', day: localDay(), meal: m.label, items } as never);
    if (ok) p.setDone([...p.done, `${localDay()}:${m.type}`]);
  };
  const logDay = async () => { for (const m of day.meals) { if (p.done.includes(`${localDay()}:${m.type}`)) continue; await logMeal(m); } };
  const saveFav = (m: Meal) => {
    const f: Favorite = { id: `${Date.now()}`, name: m.option.name, meal: m.label, items: m.items.map(i => ({ name: i.food.name, grams: i.grams, calories: i.kcal, protein: i.p, carbs: i.c, fat: i.f })) };
    const next = [f, ...p.favs]; p.setFavs(next); saveFavorites(next); toast.success('Cardápio favorito salvo neste aparelho');
  };
  const cycle = (m: Meal) => p.patchState(s => ({ ...s, swap: Object.fromEntries(Object.entries(s.swap).filter(([k]) => !k.startsWith(`${m.type}:`))), opt: { ...s.opt, [m.type]: (m.optionIndex + 1) % m.optionCount } }));

  return <div className="fade-in">
    <div className="dashboard-heading"><div><p className="eyebrow mb-2">COMIDA DE VERDADE</p><h1>Seu plano alimentar<span className="text-primary">.</span></h1>
      <p className="text-xs text-muted-foreground mt-2">Gerado pela sua meta de {goals.calories} kcal e {goals.protein} g de proteína. Se o check-in mudar a meta, o plano acompanha. Referência geral: ajuste com seu nutricionista.</p></div>
      <Button variant="secondary" onClick={() => p.setPrefOpen(true)}><Settings2/>Preferências</Button></div>

    <div className="flex flex-wrap gap-2 mb-4 items-center">
      <div className="flex bg-secondary p-1 rounded-md">{(['dia', 'semana'] as const).map(t => <Button key={t} size="sm" variant={p.tab === t ? 'default' : 'ghost'} onClick={() => p.setTab(t)}>{t === 'dia' ? 'Dia' : 'Semana'}</Button>)}</div>
      <div className="flex bg-secondary p-1 rounded-md"><Button size="sm" variant={settings.shift ? 'ghost' : 'default'} onClick={() => p.patchSettings({ ...settings, shift: false })}><Sun/>Folga</Button><Button size="sm" variant={settings.shift ? 'default' : 'ghost'} onClick={() => p.patchSettings({ ...settings, shift: true })}><BriefcaseBusiness/>Plantão</Button></div>
      <div className="flex bg-secondary p-1 rounded-md">{([4, 5, 6] as const).map(n => <Button key={n} size="sm" variant={settings.meals === n ? 'default' : 'ghost'} onClick={() => p.patchSettings({ ...settings, meals: n })}>{n} refeições</Button>)}</div>
    </div>

    {p.tab === 'dia' ? <>
      <div className="flex gap-1 mb-4 overflow-x-auto">{DAYS.map((d, i) => <Button key={d} size="sm" variant={weekday === i ? 'default' : 'secondary'} onClick={() => p.setWeekday(i)}>{d}{isTrainingWeekday(i) ? ' •' : ''}</Button>)}</div>
      <div className="panel p-4 mb-5 text-sm">
        <div className="flex items-center gap-2 mb-2">{training ? <Dumbbell size={16} className="text-primary"/> : <Moon size={16} className="text-primary"/>}<b>{training ? 'Dia de treino: mais carboidrato perto do treino' : 'Dia de descanso: um pouco mais de proteína e gordura boa'}</b></div>
        <p><span className="text-primary font-bold">{day.kcal} kcal</span> · {day.p} g proteína · {day.c} g carbo · {day.f} g gordura</p>
        <p className="text-xs text-muted-foreground mt-1">Meta: {diff(day.kcal, goals.calories, 'kcal')} · {diff(day.p, goals.protein, 'g de proteína')} · {diff(day.c, goals.carbs, 'g de carbo')}</p>
        {today && <Button className="mt-3" size="sm" disabled={p.busy} onClick={() => void logDay()}><Check/>Comi o plano de hoje</Button>}
      </div>
      <div className="nutrition-grid">{day.meals.map(m => {
        const logged = p.done.includes(`${localDay()}:${m.type}`);
        return <section className="panel p-5" key={m.type}>
          <div className="flex items-start justify-between mb-1"><div><span className="eyebrow">{m.time}{settings.shift ? ' · TRANSPORTÁVEL' : ''}</span><h2 className="section-title mt-1">{m.label}</h2><p className="text-xs text-muted-foreground mt-1">{m.option.name} · {m.optionIndex + 1}/{m.optionCount}</p></div>
            <div className="flex"><Button variant="ghost" size="icon" title="Trocar a refeição inteira por outro cardápio" onClick={() => cycle(m)}><Shuffle/></Button><Button variant="ghost" size="icon" title="Salvar como favorito" onClick={() => saveFav(m)}><BookmarkPlus/></Button></div></div>
          <p className="text-xs text-muted-foreground mb-2">{m.option.tip}</p>
          {m.items.map(i => <div key={i.slot} className="py-2.5 border-t border-border flex items-center justify-between gap-2 text-xs">
            <span>{i.food.name}</span><span className="flex items-center gap-1 text-muted-foreground text-right">{i.text}<Button variant="ghost" size="icon" title={`Trocar ${i.food.name}`} onClick={() => p.setSwapFor({ meal: m, item: i })}><RefreshCw/></Button></span></div>)}
          <p className="text-xs mt-3 mb-3"><span className="text-primary font-bold">{m.kcal} kcal</span><span className="text-muted-foreground"> · {m.p} g proteína · alvo {Math.round(m.target.kcal)} kcal</span></p>
          {today && <Button variant={logged ? 'ghost' : 'secondary'} className="w-full text-xs" disabled={p.busy || logged} onClick={() => void logMeal(m)}><Check/>{logged ? 'Registrado' : 'Comi'}</Button>}
        </section>;
      })}</div>
      {p.favs.length > 0 && <section className="panel p-5 mt-5"><h2 className="section-title mb-2">Cardápios favoritos</h2>{p.favs.map(f => <div key={f.id} className="flex items-center gap-2 mt-2"><Button size="sm" variant="secondary" className="flex-1 justify-start text-xs" disabled={p.busy} onClick={() => void p.act({ kind: 'custom', day: localDay(), meal: f.meal, items: f.items } as never)}>{f.name} · {Math.round(f.items.reduce((s, i) => s + i.calories, 0))} kcal</Button><Button size="icon" variant="ghost" title="Apagar" onClick={() => { const n = p.favs.filter(x => x.id !== f.id); p.setFavs(n); saveFavorites(n); }}><Trash2 className="text-muted-foreground"/></Button></div>)}</section>}
    </> : <WeekView week={week} goals={goals} />}

    <SwapDialog target={p.swapFor} prefs={prefs} onClose={() => p.setSwapFor(null)} onPick={foodId => { const t = p.swapFor; if (!t) return; p.patchState(s => ({ ...s, swap: { ...s.swap, [`${t.meal.type}:${t.item.slot}`]: foodId } })); p.setSwapFor(null); }} onReset={() => { const t = p.swapFor; if (!t) return; p.patchState(s => { const swap = { ...s.swap }; delete swap[`${t.meal.type}:${t.item.slot}`]; return { ...s, swap }; }); p.setSwapFor(null); }} />
    <PrefsDialog open={p.prefOpen} prefs={prefs} onChange={p.patchPrefs} onClose={() => p.setPrefOpen(false)} />
  </div>;
}

function WeekView({ week, goals }: { week: Day[]; goals: Goals }) {
  return <div>
    <p className="text-xs text-muted-foreground mb-3">Sete dias com cardápios variados, já seguindo suas preferências. A <a className="text-primary underline" href="/compras">lista de compras</a> usa esta mesma semana.</p>
    <div className="nutrition-grid">{week.map((d, i) => <section className="panel p-5" key={i}>
      <div className="flex justify-between items-center mb-2"><h2 className="section-title">{DAYS[i]}{isTrainingWeekday(i) ? ' · treino' : ' · descanso'}</h2><span className="text-xs text-primary font-bold">{d.kcal} kcal</span></div>
      {d.meals.map(m => <p key={m.type} className="text-xs py-1.5 border-t border-border"><b>{m.label}:</b> <span className="text-muted-foreground">{m.option.name}</span></p>)}
      <p className="text-[11px] text-muted-foreground mt-2">{d.p} g proteína · meta {goals.calories} kcal</p></section>)}</div></div>;
}

function SwapDialog({ target, prefs, onClose, onPick, onReset }: { target: { meal: Meal; item: Item } | null; prefs: Prefs; onClose: () => void; onPick: (id: string) => void; onReset: () => void }) {
  const list = target ? swapCandidates(target.item, prefs, 10) : [];
  return <Dialog open={!!target} onOpenChange={o => !o && onClose()}><DialogContent><DialogHeader><DialogTitle>Trocar {target?.item.food.name}</DialogTitle></DialogHeader>
    <p className="text-xs text-muted-foreground">Quantidades equivalentes ({target?.item.food.group === 'proteina' ? 'mesma proteína' : 'mesmas calorias'}) a {target?.item.text}.</p>
    <div className="max-h-80 overflow-y-auto">{list.map(s => <button key={s.food.id} className="w-full flex justify-between text-left text-sm py-2.5 border-b border-border" onClick={() => onPick(s.food.id)}><span>{s.food.name}</span><span className="text-muted-foreground text-xs text-right">{s.text}<br/>{s.kcal} kcal · {s.p} g prot.</span></button>)}{!list.length && <p className="text-sm py-4">Nenhuma alternativa com suas preferências.</p>}</div>
    <Button variant="outline" onClick={onReset}>Voltar ao original</Button></DialogContent></Dialog>;
}

function PrefsDialog({ open, prefs, onChange, onClose }: { open: boolean; prefs: Prefs; onChange: (p: Prefs) => void; onClose: () => void }) {
  const toggleTag = (t: Tag) => onChange({ ...prefs, avoid: prefs.avoid.includes(t) ? prefs.avoid.filter(x => x !== t) : [...prefs.avoid, t] });
  const Row = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => <label className="flex items-center gap-3 py-2 text-sm cursor-pointer"><input type="checkbox" checked={on} onChange={onClick}/>{label}</label>;
  return <Dialog open={open} onOpenChange={o => !o && onClose()}><DialogContent><DialogHeader><DialogTitle>Preferências e restrições</DialogTitle></DialogHeader>
    <p className="text-xs text-muted-foreground">Os cardápios e as trocas deixam de usar o que você marcar. Alergia grave: confirme sempre com seu médico.</p>
    {AVOID.map(a => <Row key={a.tag} on={prefs.avoid.includes(a.tag)} label={`Evitar: ${a.label}`} onClick={() => toggleTag(a.tag)} />)}
    <Row on={prefs.vegetarian} label="Vegetariano (sem carnes e peixe)" onClick={() => onChange({ ...prefs, vegetarian: !prefs.vegetarian })} />
    <Row on={prefs.economic} label="Modo econômico (prioriza opções mais baratas)" onClick={() => onChange({ ...prefs, economic: !prefs.economic })} />
    <Button onClick={onClose}>Pronto</Button></DialogContent></Dialog>;
}
