import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { BookmarkPlus, BriefcaseBusiness, Check, RefreshCw, Undo2, Settings2, Shuffle, Sun, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DataBoundary } from '@/components/dashboard-data';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { calculateGoals, localDay, objectiveOf, type Objective } from '@/lib/nutrition';
import { ObjectiveCard } from '@/components/objective-card';
import { buildDay, buildWeek, isTrainingWeekday, optionsFor, swapCandidates, weekdayIndex, type Day, type Goals, type Item, type Meal, type PlanState, type Prefs } from '@/lib/plan-engine';
import { DEFAULT_SETTINGS, loadFavorites, loadPrefs, loadSettings, loadStates, saveFavorites, savePrefs, saveSettings, saveStates, stateFor, type Favorite, type PlanSettings } from '@/lib/plan-storage';
import { macrosOf, type Tag } from '@/lib/plan-foods';
import type { MealType } from '@/lib/plan-templates';
import { NO_PREFS } from '@/lib/plan-engine';
import { recipesFor } from '@/lib/recipes';

export const Route = createFileRoute('/plano')({
  head: () => ({ meta: [
    { title: 'Plano alimentar flexível · MassaFit' },
    { name: 'description', content: 'Plano gerado pelas suas metas, com trocas equivalentes, preferências, registro em um toque e plano da semana.' },
    { property: 'og:title', content: 'Plano alimentar · MassaFit' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Plan,
});

const LOGGED_KEY = 'massafit-plan-logged';
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
  const [tab, setTab] = useState<'dia' | 'semana' | 'receitas'>('dia');
  const [swapFor, setSwapFor] = useState<{ meal: Meal; item: Item } | null>(null);
  const [prefOpen, setPrefOpen] = useState(false);
  const [done, setDoneState] = useState<Record<string, string[]>>({});
  const setDone: Dispatch<SetStateAction<Record<string, string[]>>> = fn => setDoneState(prev => { const next = typeof fn === 'function' ? fn(prev) : fn; try { localStorage.setItem(LOGGED_KEY, JSON.stringify(next)); } catch { /* ignora */ } return next; });
  useEffect(() => { try { const all = JSON.parse(localStorage.getItem(LOGGED_KEY) ?? '{}') as Record<string, string[]>; const t = localDay(); setDoneState(Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith(t)))); } catch { /* ignora */ } }, []);
  useEffect(() => { setSettings(loadSettings()); setPrefs(loadPrefs()); setStates(loadStates()); setFavs(loadFavorites()); }, []);

  const training = isTrainingWeekday(weekday);
  const state = stateFor(states, weekday);
  const patchState = (fn: (s: PlanState) => PlanState) => setStates(all => { const next = { ...all, [String(weekday)]: fn(stateFor(all, weekday)) }; saveStates(next); return next; });
  const patchSettings = (s: PlanSettings) => { setSettings(s); saveSettings(s); };
  const patchPrefs = (p: Prefs) => { setPrefs(p); savePrefs(p); };

  return <DataBoundary>{(data, act, busy) => {
    const g = data.goals ?? calculateGoals(data.profile ?? { name: '', sex: 'male', age: 47, height: 177, weight: 69, target_weight: 75, activity: 1.55, training_days: 4, shifts: false });
    const goals: Goals = { calories: g.calories, protein: g.protein, carbs: g.carbs, fat: g.fat };
    const objective = objectiveOf(data.profile ?? { weight: 69, target_weight: 75 });
    return <PlanBody {...{ objective, goals, settings, prefs, state, weekday, setWeekday, training, tab, setTab, patchState, patchSettings, patchPrefs, favs, setFavs, swapFor, setSwapFor, prefOpen, setPrefOpen, done, setDone, act, busy, meals: data.meals }} />;
  }}</DataBoundary>;
}

type Act = (d: never) => Promise<boolean>;
function PlanBody(p: {
  objective: Objective; goals: Goals; settings: PlanSettings; prefs: Prefs; state: PlanState; weekday: number; setWeekday: (n: number) => void; training: boolean;
  tab: 'dia' | 'semana' | 'receitas'; setTab: (t: 'dia' | 'semana' | 'receitas') => void; patchState: (fn: (s: PlanState) => PlanState) => void;
  patchSettings: (s: PlanSettings) => void; patchPrefs: (p: Prefs) => void; favs: Favorite[]; setFavs: (f: Favorite[]) => void;
  swapFor: { meal: Meal; item: Item } | null; setSwapFor: (v: { meal: Meal; item: Item } | null) => void; prefOpen: boolean; setPrefOpen: (b: boolean) => void;
  done: Record<string, string[]>; setDone: Dispatch<SetStateAction<Record<string, string[]>>>; act: Act; busy: boolean; meals: { id: string; meal: string }[];
}) {
  const { goals, settings, prefs, state, weekday, training } = p;
  const day: Day = useMemo(() => buildDay(goals, { meals: settings.meals, training, shift: settings.shift, prefs, state, dayIndex: weekday, objective: p.objective }), [p.objective, goals, settings, training, prefs, state, weekday]);
  const week: Day[] = useMemo(() => p.tab === 'semana' ? buildWeek(goals, { meals: settings.meals, shift: settings.shift, prefs, objective: p.objective }) : [], [p.objective, p.tab, goals, settings, prefs]);
  const today = weekday === weekdayIndex(new Date());

  const mealsRef = useRef(p.meals); mealsRef.current = p.meals;
  const isLogged = (key: string) => key in p.done;
  /** Registra no diário e guarda os ids criados para poder desfazer só esta ação. */
  const register = async (key: string, label: string, items: { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }[]) => {
    const before = new Set(mealsRef.current.filter(x => x.meal === label).map(x => x.id));
    const ok = await p.act({ kind: 'custom', day: localDay(), meal: label, items } as never);
    if (!ok) return;
    await new Promise(r => setTimeout(r, 250));
    const ids = mealsRef.current.filter(x => x.meal === label && !before.has(x.id)).map(x => x.id);
    p.setDone(d => ({ ...d, [key]: ids }));
  };
  const undo = async (key: string) => {
    for (const id of p.done[key] ?? []) await p.act({ kind: 'deleteMeal', id } as never);
    p.setDone(d => { const n = { ...d }; delete n[key]; return n; });
    toast.success('Registro desfeito');
  };
  const mealKey = (m: Meal) => `${localDay()}:${m.type}`;
  const logMeal = (m: Meal) => register(mealKey(m), m.label, m.items.map(i => ({ name: i.food.name, grams: i.grams, calories: i.kcal, protein: i.p, carbs: i.c, fat: i.f })));
  const logDay = async () => { for (const m of day.meals) { if (!isLogged(mealKey(m))) await logMeal(m); } };
  const undoDay = async () => { for (const m of day.meals) { if (isLogged(mealKey(m))) await undo(mealKey(m)); } };
  const saveFav = (m: Meal) => {
    const f: Favorite = { id: `${Date.now()}`, name: m.option.name, meal: m.label, items: m.items.map(i => ({ name: i.food.name, grams: i.grams, calories: i.kcal, protein: i.p, carbs: i.c, fat: i.f })) };
    const next = [f, ...p.favs]; p.setFavs(next); saveFavorites(next); toast.success('Cardápio favorito salvo neste aparelho');
  };
  const cycle = (m: Meal) => p.patchState(s => ({ ...s, swap: Object.fromEntries(Object.entries(s.swap).filter(([k]) => !k.startsWith(`${m.type}:`))), opt: { ...s.opt, [m.type]: (m.optionIndex + 1) % m.optionCount } }));

  const kcal10 = (n: number) => Math.round(n / 10) * 10;
  const gap = Math.round((day.kcal - goals.calories) / 10) * 10;
  const status = Math.abs(gap) <= goals.calories * 0.04 ? 'Dentro da meta' : gap < 0 ? `Faltam ${Math.abs(gap)} kcal` : `Passa ${gap} kcal`;
  const pct = Math.min(100, Math.round((day.kcal / goals.calories) * 100));
  const loggedCount = day.meals.filter(m => isLogged(mealKey(m))).length;

  return <div className="fade-in pb-8">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div><h1 className="text-2xl font-bold">Plano alimentar<span className="text-primary">.</span></h1>
        <p className="text-xs text-muted-foreground mt-1">Meta: {kcal10(goals.calories).toLocaleString('pt-BR')} kcal · {goals.protein} g de proteína</p></div>
      <Button variant="secondary" size="icon" title="Preferências e restrições" aria-label="Preferências e restrições" onClick={() => p.setPrefOpen(true)}><Settings2/></Button>
    </div>

    <div role="tablist" aria-label="Visão do plano" className="grid grid-cols-3 bg-secondary p-1 rounded-md mb-4">
      {([['dia', 'Hoje'], ['semana', 'Semana'], ['receitas', 'Receitas']] as const).map(([t, label]) =>
        <button key={t} role="tab" aria-selected={p.tab === t} className={`py-2.5 text-sm rounded-sm font-medium ${p.tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`} onClick={() => p.setTab(t)}>{label}</button>)}
    </div>

    {p.tab === 'dia' && <>
      <div className="flex gap-1 mb-3 overflow-x-auto" role="group" aria-label="Dia da semana">{DAYS.map((d, i) =>
        <button key={d} className={`flex-1 min-w-11 py-2 rounded-md text-xs ${weekday === i ? 'bg-primary text-primary-foreground font-semibold' : 'bg-secondary text-muted-foreground'}`} onClick={() => p.setWeekday(i)} aria-pressed={weekday === i}>
          {d}{isTrainingWeekday(i) ? <span className="block text-[9px] leading-none mt-0.5">treino</span> : <span className="block text-[9px] leading-none mt-0.5 opacity-0">.</span>}</button>)}</div>

      <section className="panel p-4 mb-4">
        <div className="flex items-baseline justify-between gap-2"><p className="text-2xl font-bold tabular-nums">{kcal10(day.kcal).toLocaleString('pt-BR')}<span className="text-sm font-normal text-muted-foreground"> kcal</span></p><p className="text-sm text-muted-foreground tabular-nums">{day.p} g proteína</p></div>
        <div className="h-1.5 bg-secondary rounded-full mt-2 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Calorias do plano em relação à meta"><div className="h-full bg-primary" style={{ width: `${pct}%` }}/></div>
        <p className="text-xs text-muted-foreground mt-2">{status} · {training ? 'dia de treino, mais carboidrato antes do treino' : 'dia de descanso'}</p>
        {today && <div className="mt-3 flex gap-2">
          {loggedCount < day.meals.length && <Button className="flex-1" disabled={p.busy} onClick={() => void logDay()}><Check/>Comi o plano de hoje</Button>}
          {loggedCount > 0 && <Button variant="outline" className={loggedCount < day.meals.length ? '' : 'flex-1'} disabled={p.busy} onClick={() => void undoDay()}><Undo2/>{loggedCount < day.meals.length ? 'Desfazer' : 'Desfazer o dia'}</Button>}</div>}
      </section>

      <div className="space-y-3">{day.meals.map(m => {
        const logged = isLogged(mealKey(m));
        return <section className="panel p-4" key={m.type}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0"><h2 className="font-semibold">{m.label} <span className="text-xs font-normal text-muted-foreground">{m.time}</span></h2>
              <p className="text-xs text-muted-foreground mt-0.5">{m.option.name}</p></div>
            <div className="flex shrink-0"><Button variant="ghost" size="icon" title="Outro cardápio para esta refeição" aria-label="Outro cardápio para esta refeição" onClick={() => cycle(m)}><Shuffle/></Button><Button variant="ghost" size="icon" title="Salvar como favorito" aria-label="Salvar como favorito" onClick={() => saveFav(m)}><BookmarkPlus/></Button></div></div>
          <ul className="mt-2">{m.items.map(i => <li key={i.slot} className="py-2 border-t border-border flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0">{i.food.name}<span className="block text-xs text-muted-foreground">{i.text}</span></span>
            <Button variant="ghost" size="icon" title={`Trocar ${i.food.name}`} aria-label={`Trocar ${i.food.name}`} onClick={() => p.setSwapFor({ meal: m, item: i })}><RefreshCw/></Button></li>)}</ul>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground tabular-nums">{kcal10(m.kcal)} kcal · {m.p} g prot.</p>
            {today && (logged
              ? <Button size="sm" variant="outline" disabled={p.busy} onClick={() => void undo(mealKey(m))}><Undo2/>Desfazer</Button>
              : <Button size="sm" variant="secondary" disabled={p.busy} onClick={() => void logMeal(m)}><Check/>Comi</Button>)}</div>
        </section>;
      })}</div>

      {p.favs.length > 0 && <section className="panel p-4 mt-4"><h2 className="font-semibold mb-2">Favoritos</h2>{p.favs.map(f => <div key={f.id} className="flex items-center gap-2 mt-2"><Button size="sm" variant="secondary" className="flex-1 justify-start text-xs" disabled={p.busy} onClick={() => void p.act({ kind: 'custom', day: localDay(), meal: f.meal, items: f.items } as never)}>{f.name} · {kcal10(f.items.reduce((s, i) => s + i.calories, 0))} kcal</Button><Button size="icon" variant="ghost" title="Apagar favorito" aria-label="Apagar favorito" onClick={() => { const n = p.favs.filter(x => x.id !== f.id); p.setFavs(n); saveFavorites(n); }}><Trash2 className="text-muted-foreground"/></Button></div>)}</section>}
    </>}

    {p.tab === 'semana' && <WeekView week={week} />}
    {p.tab === 'receitas' && <RecipesView objective={p.objective} prefs={prefs} busy={p.busy} isLogged={isLogged} register={register} undo={undo} />}

    <details className="panel p-4 mt-5">
      <summary className="cursor-pointer text-sm font-medium">Ajustes do plano</summary>
      <div className="mt-3 space-y-3">
        <div><p className="text-xs text-muted-foreground mb-1">Tipo de dia</p><div className="grid grid-cols-2 bg-secondary p-1 rounded-md">
          <Button size="sm" variant={settings.shift ? 'ghost' : 'default'} onClick={() => p.patchSettings({ ...settings, shift: false })}><Sun/>Folga</Button>
          <Button size="sm" variant={settings.shift ? 'default' : 'ghost'} onClick={() => p.patchSettings({ ...settings, shift: true })}><BriefcaseBusiness/>Plantão (marmita)</Button></div></div>
        <div><p className="text-xs text-muted-foreground mb-1">Refeições por dia</p><div className="grid grid-cols-3 bg-secondary p-1 rounded-md">{([4, 5, 6] as const).map(n => <Button key={n} size="sm" variant={settings.meals === n ? 'default' : 'ghost'} onClick={() => p.patchSettings({ ...settings, meals: n })}>{n}</Button>)}</div></div>
      </div>
    </details>
    <div className="mt-4"><ObjectiveCard objective={p.objective} section="food" /></div>

    <SwapDialog target={p.swapFor} prefs={prefs} onClose={() => p.setSwapFor(null)} onPick={foodId => { const t = p.swapFor; if (!t) return; p.patchState(s => ({ ...s, swap: { ...s.swap, [`${t.meal.type}:${t.item.slot}`]: foodId } })); p.setSwapFor(null); }} onReset={() => { const t = p.swapFor; if (!t) return; p.patchState(s => { const swap = { ...s.swap }; delete swap[`${t.meal.type}:${t.item.slot}`]; return { ...s, swap }; }); p.setSwapFor(null); }} />
    <PrefsDialog open={p.prefOpen} prefs={prefs} onChange={p.patchPrefs} onClose={() => p.setPrefOpen(false)} />
  </div>;
}

function WeekView({ week }: { week: Day[] }) {
  return <div className="space-y-2">
    <p className="text-xs text-muted-foreground">Cardápios variados para a semana. A <a className="text-primary underline" href="/compras">lista de compras</a> usa esta mesma semana.</p>
    {week.map((d, i) => <details key={i} className="panel p-4">
      <summary className="cursor-pointer flex items-center justify-between gap-2 text-sm"><span className="font-semibold">{DAYS[i]}<span className="text-xs font-normal text-muted-foreground"> · {isTrainingWeekday(i) ? 'treino' : 'descanso'}</span></span><span className="text-xs text-muted-foreground tabular-nums">{(Math.round(d.kcal / 10) * 10).toLocaleString('pt-BR')} kcal</span></summary>
      <ul className="mt-2 text-sm">{d.meals.map(m => <li key={m.type} className="py-1.5 border-t border-border flex justify-between gap-3"><span className="text-muted-foreground shrink-0">{m.label}</span><span className="text-right">{m.option.name}</span></li>)}</ul>
    </details>)}
  </div>;
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

type Reg = (key: string, label: string, items: { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }[]) => Promise<void>;
function RecipesView({ objective, prefs, busy, isLogged, register, undo }: { objective: Objective; prefs: Prefs; busy: boolean; isLogged: (k: string) => boolean; register: Reg; undo: (k: string) => Promise<void> }) {
  const list = recipesFor(prefs, undefined, objective);
  return <div className="space-y-2">
    <p className="text-xs text-muted-foreground">Receitas simples com os alimentos do plano, em 1 porção.</p>
    {list.map(v => <details key={v.recipe.id} className="panel p-4">
      <summary className="cursor-pointer"><span className="font-semibold text-sm">{v.recipe.name}</span><span className="block text-xs text-muted-foreground mt-0.5 tabular-nums">{v.recipe.meal} · {v.recipe.minutes} min · {Math.round(v.kcal / 10) * 10} kcal · {v.p} g prot.</span></summary>
      <ul className="text-sm mt-3">{v.foods.map(x => <li key={x.food.id} className="py-1.5 border-t border-border flex justify-between gap-3"><span>{x.food.name}</span><span className="text-muted-foreground text-right">{x.text}</span></li>)}</ul>
      <ol className="text-sm list-decimal pl-5 space-y-1.5 mt-3">{v.recipe.steps.map((st, i) => <li key={i}>{st}</li>)}</ol>
      {v.recipe.tip && <p className="text-xs text-muted-foreground mt-3">Dica: {v.recipe.tip}</p>}
      {isLogged(`${localDay()}:rec:${v.recipe.id}`)
        ? <Button size="sm" variant="outline" className="w-full mt-3" disabled={busy} onClick={() => void undo(`${localDay()}:rec:${v.recipe.id}`)}><Undo2/>Desfazer</Button>
        : <Button size="sm" variant="secondary" className="w-full mt-3" disabled={busy} onClick={() => void register(`${localDay()}:rec:${v.recipe.id}`, v.recipe.meal, v.foods.map(x => { const m = macrosOf(x.food, x.grams); return { name: x.food.name, grams: x.grams, calories: m.kcal, protein: m.p, carbs: m.c, fat: m.f }; }))}><Check/>Comi esta receita</Button>}
    </details>)}
    {!list.length && <p className="text-sm">Nenhuma receita com suas preferências.</p>}
  </div>;
}
