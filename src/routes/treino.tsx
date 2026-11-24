import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Flame, Repeat, Trophy, Check, ChevronRight, Clock, Dumbbell, House, Package, Pause, Play, Timer, TrendingUp, X, AlertTriangle, CircleCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/components/auth-context';
import { AuthDialog } from '@/components/auth-dialog';
import { planForMode, workoutForDate, suggestNext, type Exercise, type WorkoutMode } from '@/lib/workout';
import { alternativesFor } from '@/lib/workout-alt';
import { streakInfo } from '@/lib/streak';
import { isNewRecord, personalRecord, sessionSummary } from '@/lib/records';
import { exerciseImages } from '@/lib/exercise-images';
import { hasFigure } from '@/lib/exercise-figures';
import { FigureAnimated, FigureFrame } from '@/components/exercise-figure';
import { getSetLogs, saveSet } from '@/lib/workout.functions';
import { localDay } from '@/lib/nutrition';

export const Route = createFileRoute('/treino')({
  head: () => ({ meta: [
    { title: 'Treino ABCD na academia ou em casa · MassaFit' },
    { name: 'description', content: 'Treino ABCD 4x por semana na academia ou em casa, sem equipamentos, com execução guiada, registro de carga, progressão e cronômetro de descanso.' },
    { property: 'og:title', content: 'Treino ABCD · MassaFit' },
    { property: 'og:description', content: 'Execução correta, cargas registradas e progressão automática.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Workout,
});
type SetLog = Awaited<ReturnType<typeof getSetLogs>>[number];
const fmt = (s:number)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const MODE_KEY = 'massafit-workout-mode';

/** Foto de execução quando existe; nos exercícios de casa (sem foto ainda) mostra um bloco ilustrado. */
function ExerciseVisual({ slug, name, className, compact = false }: { slug: string; name: string; className: string; compact?: boolean }) {
  const src = exerciseImages[slug]; const [broken, setBroken] = useState(false);
  if (src && !broken) return <img src={src} alt={`Execução correta: ${name}`} loading="lazy" onError={() => setBroken(true)} ref={el => { if (el?.complete && el.naturalWidth === 0) setBroken(true); }} className={`${className} object-cover ${compact ? '' : 'object-[center_25%]'}`}/>;
  if (hasFigure(slug)) return <FigureFrame slug={slug} e={1} label={`Execução: ${name}`} className={`${className} bg-muted`}/>;
  return <div role="img" aria-label={name} className={`${className} grid place-items-center bg-gradient-to-br from-primary/20 via-muted to-background`}><Dumbbell className="text-primary/70" size={compact ? 28 : 56}/></div>;
}

function RestTimer({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [left, setLeft] = useState(seconds); const [paused, setPaused] = useState(false);
  useEffect(() => { setLeft(seconds); setPaused(false); }, [seconds]);
  useEffect(() => { if (paused || left <= 0) return; const t = setTimeout(() => setLeft(l => l - 1), 1000); return () => clearTimeout(t); }, [left, paused]);
  useEffect(() => { if (left === 0) { navigator.vibrate?.([300, 150, 300]); toast.success('Descanso concluído · Próxima série!'); } }, [left]);
  const pct = Math.max(0, left / seconds) * 100;
  return <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[min(92vw,380px)] panel p-4 shadow-2xl">
    <div className="flex items-center gap-3"><Timer className="text-primary"/><div className="flex-1"><p className="eyebrow">Descanso</p><p className="text-3xl font-bold tabular-nums">{left > 0 ? fmt(left) : 'Bora!'}</p></div>
    <Button variant="secondary" size="icon" title="+15 segundos" onClick={() => setLeft(l => l + 15)}>+15</Button>
    <Button variant="secondary" size="icon" title={paused ? 'Continuar' : 'Pausar'} onClick={() => setPaused(p => !p)}>{paused ? <Play/> : <Pause/>}</Button>
    <Button variant="ghost" size="icon" title="Fechar cronômetro" onClick={onClose}><X/></Button></div>
    <div className="h-1.5 bg-muted rounded-full mt-3 overflow-hidden"><div className="h-full bg-primary transition-all duration-1000 ease-linear" style={{ width: `${pct}%` }}/></div>
  </div>;
}

function ExerciseDialog({ ex, logs, day, onClose, onRest, requireAuth, onSwap }: { onSwap: (e: Exercise) => void; ex: Exercise; logs: SetLog[]; day: string; onClose: () => void; onRest: (s: number) => void; requireAuth: () => boolean }) {
  const save = useServerFn(saveSet); const qc = useQueryClient();
  const mine = logs.filter(l => l.exercise === ex.slug);
  const today = mine.filter(l => l.day === day);
  const lastDay = [...new Set(mine.filter(l => l.day < day).map(l => l.day))].pop();
  const last = mine.filter(l => l.day === lastDay).map(l => ({ weight: Number(l.weight), reps: l.reps }));
  const suggestion = suggestNext(ex, last);
  const [rows, setRows] = useState(() => Array.from({ length: ex.sets }, (_, i) => { const t = today.find(l => l.set_number === i + 1); return { weight: t ? Number(t.weight) : suggestion?.weight ?? 0, reps: t ? t.reps : suggestion?.reps ?? ex.repMin, done: Boolean(t) }; }));
  const [busy, setBusy] = useState<number | null>(null);
  const [view, setView] = useState<'exec' | 'foto'>('exec');
  const chart = useMemo(() => [...new Set(mine.map(l => l.day))].map(d => ({ day: d.slice(8, 10) + '/' + d.slice(5, 7), carga: Math.max(...mine.filter(l => l.day === d).map(l => Number(l.weight))) })), [mine]);
  async function toggle(i: number) {
    if (!requireAuth()) return; const r = rows[i]!; setBusy(i);
    try {
      if (r.done) await save({ data: { exercise: ex.slug, day, set_number: i + 1, remove: true } });
      else { await save({ data: { exercise: ex.slug, day, set_number: i + 1, weight: r.weight, reps: r.reps, remove: false } }); if (i < ex.sets - 1) onRest(ex.rest); }
      setRows(rs => rs.map((x, j) => j === i ? { ...x, done: !x.done } : x)); await qc.invalidateQueries({ queryKey: ['massafit-sets'] });
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao salvar'); } finally { setBusy(null); }
  }
  const unit = (ex.timed ? 's' : 'reps') + (ex.perSide ? ' por lado' : '');
  return <Dialog open onOpenChange={v => { if (!v) onClose(); }}><DialogContent className="max-w-lg max-h-[92dvh] overflow-y-auto p-0 gap-0" aria-describedby={undefined}>
    <div className="relative">{view === 'foto' && exerciseImages[ex.slug] ? <ExerciseVisual slug={ex.slug} name={ex.name} className="w-full aspect-[4/3]"/> : hasFigure(ex.slug) ? <FigureAnimated slug={ex.slug} label={`Execução animada: ${ex.name}`} className="w-full aspect-[250/219] bg-[#111827]"/> : <ExerciseVisual slug={ex.slug} name={ex.name} className="w-full aspect-[4/3]"/>}<div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-background via-background/80 to-transparent"><p className="eyebrow text-primary">{ex.muscles}</p><DialogTitle className="text-2xl mt-1">{ex.name}</DialogTitle></div>{exerciseImages[ex.slug] && hasFigure(ex.slug) && <div className="absolute top-3 left-3 flex rounded-md bg-background/80 backdrop-blur p-0.5 text-xs">{([['exec', 'Execução'], ['foto', 'Foto']] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setView(k)} className={`px-2.5 py-1 rounded ${view === k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{l}</button>)}</div>}</div>
    {hasFigure(ex.slug) && <div className="grid grid-cols-2 gap-px bg-border border-b border-border">{[[0, 'Início'], [1, 'Fim']].map(([e, l]) => <div key={l} className="relative bg-[#111827]"><FigureFrame slug={ex.slug} e={e as number} label={`${l}: ${ex.name}`} className="w-full aspect-[250/219]"/><span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide text-white/80">{l}</span></div>)}</div>}
    <div className="p-5 space-y-6">
      <div className="grid grid-cols-3 text-center border-y border-border py-3">{[[`${ex.sets}`, 'séries'], [`${ex.repMin}–${ex.repMax}`, unit], [fmt(ex.rest), 'descanso']].map(([v, l]) => <div key={l}><p className="font-bold text-lg">{v}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>)}</div>
      {ex.equip && <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1.5"><p className="flex gap-2 items-start"><Package size={14} className="text-primary shrink-0 mt-0.5"/><span><span className="font-semibold">Material:</span> {ex.equip}</span></p>{ex.easier && <p><span className="font-semibold">Mais fácil:</span> <span className="text-muted-foreground">{ex.easier}</span></p>}{ex.harder && <p><span className="font-semibold">Mais difícil:</span> <span className="text-muted-foreground">{ex.harder}</span></p>}</div>}
      <section><h3 className="section-title flex gap-2 items-center"><CircleCheck size={18} className="text-primary"/>Execução correta</h3><ol className="mt-3 space-y-2">{ex.cues.map((c, i) => <li key={c} className="flex gap-3 text-sm"><span className="size-6 shrink-0 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold">{i + 1}</span><span>{c}</span></li>)}</ol>
      <div className="mt-4 rounded-md bg-destructive/10 p-3"><p className="text-xs font-semibold flex gap-2 items-center text-destructive"><AlertTriangle size={14}/>Evite</p><ul className="mt-1 text-xs text-muted-foreground list-disc pl-5 space-y-0.5">{ex.mistakes.map(m => <li key={m}>{m}</li>)}</ul></div></section>
      {suggestion && <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm"><p className="flex gap-2 items-center font-semibold"><TrendingUp size={16} className="text-primary"/>{suggestion.increase ? (ex.bodyweight ? 'Hora de progredir!' : 'Hora de subir a carga!') : 'Meta de hoje'}</p><p className="text-xs text-muted-foreground mt-1">{ex.timed ? `Segure ${suggestion.reps} s em cada série.` : ex.bodyweight ? `${suggestion.increase ? `Escolha uma variação mais difícil ou coloque ${suggestion.weight} kg na mochila · ` : ''}${suggestion.weight > 0 ? `${suggestion.weight} kg extra` : 'Peso do corpo'} × ${suggestion.reps} reps · última vez: ${last.map(s => `${s.weight > 0 ? `+${s.weight}kg ` : ''}${s.reps}`).join(', ')}` : `${suggestion.weight} kg × ${suggestion.reps} reps · última vez: ${last.map(s => `${s.weight}×${s.reps}`).join(', ')}`}</p></div>}
      {(() => { const pr = personalRecord(logs.map(l => ({ ...l, weight: Number(l.weight) })), ex.slug, day); return pr && <p className="text-xs flex items-center gap-2 rounded-md bg-muted/40 p-3"><Trophy size={14} className="text-primary shrink-0"/><span><span className="font-semibold">Seu recorde:</span> {pr.weight > 0 ? `${pr.weight} kg × ${pr.reps}` : `${pr.reps} reps`} <span className="text-muted-foreground">· {pr.day.split('-').reverse().join('/')}</span></span></p>; })()}
      {alternativesFor(ex.slug).length > 0 && <div className="text-xs"><p className="flex items-center gap-2 font-semibold mb-2"><Repeat size={14} className="text-primary"/>Aparelho ocupado? Troque por:</p><div className="flex flex-wrap gap-2">{alternativesFor(ex.slug).map(a => <Button key={a.slug} type="button" size="sm" variant="secondary" onClick={() => onSwap(a)}>{a.name}</Button>)}</div></div>}
      <section><h3 className="section-title">Registrar séries</h3><div className="mt-3 space-y-2">{rows.map((r, i) => <div key={i} className={`flex items-center gap-2 rounded-md p-2 ${r.done ? 'bg-primary/10' : 'bg-muted/40'}`}><span className="w-8 text-center text-xs text-muted-foreground font-bold">{i + 1}ª</span>{r.done && isNewRecord(logs.map(l => ({ ...l, weight: Number(l.weight) })), { exercise: ex.slug, day, set_number: i + 1, weight: r.weight, reps: r.reps }) && <Trophy size={14} className="text-primary shrink-0" aria-label="Novo recorde"/>}
        {!ex.timed && <label className="flex-1 text-[10px] text-muted-foreground">{ex.bodyweight ? '+ kg (mochila)' : 'kg'}<input type="number" inputMode="decimal" min="0" step="0.5" disabled={r.done} className="w-full rounded bg-background px-2 py-2.5 text-base text-foreground" value={r.weight} onChange={e => setRows(rs => rs.map((x, j) => j === i ? { ...x, weight: Number(e.target.value) } : x))}/></label>}
        <label className="flex-1 text-[10px] text-muted-foreground">{unit}<input type="number" inputMode="numeric" min="1" disabled={r.done} className="w-full rounded bg-background px-2 py-2.5 text-base text-foreground" value={r.reps} onChange={e => setRows(rs => rs.map((x, j) => j === i ? { ...x, reps: Number(e.target.value) } : x))}/></label>
        <Button size="icon" className="size-12 mt-3" variant={r.done ? 'default' : 'secondary'} disabled={busy !== null || r.reps < 1} title={r.done ? 'Desfazer série' : 'Concluir série'} onClick={() => void toggle(i)}><Check/></Button></div>)}</div>
        <Button variant="outline" className="w-full mt-3" onClick={() => onRest(ex.rest)}><Clock/>Iniciar descanso de {fmt(ex.rest)}</Button></section>
      {chart.length > 1 && !ex.timed && <section><h3 className="section-title flex gap-2 items-center"><TrendingUp size={18} className="text-primary"/>Evolução da carga</h3><div className="h-40 mt-3"><ResponsiveContainer><LineChart data={chart}><XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} stroke="var(--border)"/><YAxis width={32} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} stroke="var(--border)" domain={['dataMin - 5', 'dataMax + 5']}/><Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)' }}/><Line type="monotone" dataKey="carga" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }}/></LineChart></ResponsiveContainer></div></section>}
    </div></DialogContent></Dialog>;
}

function Workout() {
  const { user, loading } = useAuth(); const fetchLogs = useServerFn(getSetLogs);
  const [mode, setModeState] = useState<WorkoutMode>('gym');
  useEffect(() => { try { if (localStorage.getItem(MODE_KEY) === 'home') setModeState('home'); } catch { /* sem armazenamento: segue na academia */ } }, []);
  const setMode = (m: WorkoutMode) => { setModeState(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* ignora */ } };
  const todayPlan = workoutForDate(new Date(), mode); const [key, setKey] = useState(todayPlan?.key ?? 'A');
  const [open, setOpen] = useState<Exercise | null>(null); const [rest, setRest] = useState<{ s: number; id: number } | null>(null); const [auth, setAuth] = useState(false);
  const day = localDay(); const since = localDay(new Date(Date.now() - 90 * 864e5));
  const q = useQuery({ queryKey: ['massafit-sets', user?.id, since], queryFn: () => fetchLogs({ data: { since } }), enabled: !loading && Boolean(user) });
  const logs = q.data ?? []; const plan = planForMode(mode).find(d => d.key === key)!;
  const doneSets = (slug: string) => logs.filter(l => l.exercise === slug && l.day === day).length;
  const total = plan.exercises.reduce((s, e) => s + e.sets, 0); const done = plan.exercises.reduce((s, e) => s + Math.min(e.sets, doneSets(e.slug)), 0);
  return <div className="fade-in pb-28">
    <div className="dashboard-heading"><div><p className="eyebrow mb-2">{todayPlan ? `HOJE · ${todayPlan.title.toUpperCase()}` : 'HOJE É DIA DE DESCANSO'}</p><h1>Treino ABCD<span className="text-primary">.</span></h1><p className="text-xs text-muted-foreground mt-2">Seg A · Ter B · Qui C · Sex D · Toque no exercício para ver a execução.</p></div></div>
    <div role="group" aria-label="Onde você vai treinar" className="grid grid-cols-2 gap-1 rounded-md border border-border bg-card p-1 mb-5">{([['gym', 'Academia', Dumbbell], ['home', 'Em casa', House]] as const).map(([m, label, Icon]) => <button type="button" key={m} aria-pressed={mode === m} onClick={() => setMode(m)} className={`flex items-center justify-center gap-2 rounded py-2.5 text-sm font-semibold transition ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Icon size={16}/>{label}</button>)}</div>
    {mode === 'home' && <p className="text-xs text-muted-foreground mb-4 -mt-2">Sem equipamentos de academia: só seu corpo, uma cadeira firme, uma mesa resistente, uma mochila com peso e garrafas ou galões de água. Se sentir dor, pare e procure um profissional.</p>}
    {!user && !loading && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 mb-4 text-xs text-muted-foreground"><span>Prévia do treino · Entre para registrar suas cargas.</span><Button variant="link" className="h-8 p-0 text-xs" onClick={() => setAuth(true)}>Criar minha conta →</Button></div>}
    <div className="grid grid-cols-4 gap-2 mb-5">{planForMode(mode).map(d => <button type="button" key={d.key} onClick={() => setKey(d.key)} className={`rounded-md border p-3 text-left transition ${key === d.key ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}><span className="block text-2xl font-bold">{d.key}</span><span className="block text-[10px] text-muted-foreground leading-tight mt-1">{d.focus}</span></button>)}</div>
    <div className="panel p-4 mb-5 flex items-center gap-4"><Dumbbell className="text-primary shrink-0"/><div className="flex-1"><p className="text-sm font-semibold">{plan.title} · {plan.focus}</p><div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${total ? done / total * 100 : 0}%` }}/></div></div><span className="text-xs text-muted-foreground tabular-nums">{done}/{total} séries</span></div>
    {user && (() => { const st = streakInfo([...new Set(logs.map(l => l.day))], day, 3); return <p className="flex items-center gap-2 text-xs mb-3"><Flame size={16} className={st.weeks > 0 ? 'text-primary' : 'text-muted-foreground'}/><span><span className="font-semibold">{st.weeks > 0 ? `${st.weeks} ${st.weeks === 1 ? 'semana seguida' : 'semanas seguidas'}` : 'Comece sua sequência'}</span> <span className="text-muted-foreground">· {st.thisWeek}/3 treinos esta semana</span></span></p>; })()}
    {user && done > 0 && (() => { const sm = sessionSummary(logs.map(l => ({ ...l, weight: Number(l.weight) })), day, plan.exercises.map(e => e.slug)); const bw = sm.volume === 0; return <div className="panel p-4 mb-5 grid grid-cols-3 gap-2 text-center"><div><p className="font-bold text-lg">{sm.sets}</p><p className="text-[10px] text-muted-foreground">séries feitas</p></div><div><p className="font-bold text-lg">{bw ? sm.reps : sm.volume.toLocaleString('pt-BR')}</p><p className="text-[10px] text-muted-foreground">{bw ? 'repetições' : 'kg de volume'}{sm.change !== null ? ` · ${sm.change > 0 ? '+' : ''}${sm.change}% vs. último` : ''}</p></div><div><p className="font-bold text-lg flex items-center justify-center gap-1">{sm.records > 0 && <Trophy size={16} className="text-primary"/>}{sm.records}</p><p className="text-[10px] text-muted-foreground">{sm.records === 1 ? 'novo recorde' : 'novos recordes'}</p></div></div>; })()}
    {user && q.isPending ? <div className="space-y-3 animate-pulse">{[0, 1, 2].map(i => <div key={i} className="h-28 bg-muted rounded-md"/>)}</div> : q.isError ? <div className="py-10 text-center"><p className="text-sm text-muted-foreground mb-4">Não foi possível carregar seus treinos.</p><Button onClick={() => void q.refetch()}>Tentar novamente</Button></div> :
    <div className="grid gap-3 md:grid-cols-2">{plan.exercises.map((e, i) => { const n = doneSets(e.slug); return <button type="button" key={e.slug} onClick={() => setOpen(e)} className="panel overflow-hidden flex text-left hover:border-primary/60 transition">
      <ExerciseVisual slug={e.slug} name={e.name} className="w-28 h-28 shrink-0" compact/>
      <div className="flex-1 p-3 min-w-0"><p className="text-[10px] text-muted-foreground">{i + 1} · {e.muscles}</p><p className="font-semibold text-sm mt-1 leading-tight">{e.name}</p><p className="text-xs text-muted-foreground mt-2">{e.sets} × {e.repMin}–{e.repMax}{e.timed ? ' s' : ''}{e.perSide ? ' por lado' : ''} · {fmt(e.rest)}</p>{n > 0 && <p className={`text-[11px] mt-1 font-semibold ${n >= e.sets ? 'text-primary' : ''}`}>{n >= e.sets ? '✓ Concluído' : `${n}/${e.sets} séries feitas`}</p>}</div>
      <ChevronRight className="self-center mr-2 text-muted-foreground shrink-0"/></button>; })}</div>}
    {open && <ExerciseDialog key={open.slug} onSwap={setOpen} ex={open} logs={logs} day={day} onClose={() => setOpen(null)} onRest={s => setRest({ s, id: Date.now() })} requireAuth={() => { if (!user) { setAuth(true); return false; } return true; }}/>}
    {rest && <RestTimer key={rest.id} seconds={rest.s} onClose={() => setRest(null)}/>}
    <AuthDialog open={auth} onClose={() => setAuth(false)}/>
  </div>;
}
