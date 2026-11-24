import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Dumbbell, Scale, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { PACES, answersFrom, defaultPace, preview, stepError, suggestedTarget, toProfile, type Answers } from '@/lib/onboarding';
import { projectionWeeks, type Objective, type ProfileInput } from '@/lib/nutrition';

const OBJECTIVES: { key: Objective; title: string; text: string; Icon: typeof Dumbbell }[] = [
  { key: 'gain', title: 'Ganhar massa', text: 'Comer um pouco acima do gasto e treinar para ganhar peso com músculo.', Icon: Dumbbell },
  { key: 'lose', title: 'Emagrecer', text: 'Déficit moderado, com proteína alta para preservar a massa magra.', Icon: Scale },
  { key: 'maintain', title: 'Manter o peso', text: 'Comer no ponto de equilíbrio e manter a forma.', Icon: Target },
];
const STEPS = 5;
const num = (s: string) => (s.trim() === '' ? Number.NaN : Number(s.replace(',', '.')));

/** Passo a passo de primeiro acesso: uma pergunta por tela, termina mostrando as metas calculadas. */
export function OnboardingWizard({ initial, submitLabel, onFinish, onSkip }: { initial?: Partial<ProfileInput> | undefined; submitLabel: string; onFinish: (profile: ProfileInput, adj: number) => Promise<void>; onSkip?: (() => void) | undefined }) {
  const [step, setStep] = useState(0); const [a, setA] = useState<Answers>(() => answersFrom(initial));
  const [adj, setAdj] = useState(defaultPace('gain')); const [busy, setBusy] = useState(false); const [fail, setFail] = useState('');
  const touched = useRef(false);
  const [raw, setRaw] = useState({ age: String(a.age), height: String(a.height), weight: String(a.weight), target: String(a.target_weight) });
  const sync = (r: typeof raw): Answers => ({ ...a, age: num(r.age), height: num(r.height), weight: num(r.weight), target_weight: num(r.target) });
  const cur = step >= 1 && step <= 2 ? sync(raw) : a;
  const error = step >= 1 && step <= 3 ? stepError(step, cur) : null;
  const choose = (o: Objective) => { setA({ ...a, objective: o }); setAdj(defaultPace(o)); setRaw(r => { const w = num(r.weight); return Number.isFinite(w) ? { ...r, target: String(suggestedTarget(o, w)) } : r; }); setStep(1); };
  const next = () => { if (error) return; if (step === 1 || step === 2) setA(cur); setStep(s => s + 1); };
  const result = step === 4 ? preview(cur, adj) : null;
  const weeks = result ? projectionWeeks(result.profile.weight, result.profile.target_weight) : null;
  async function finish() { if (!result) return; setBusy(true); setFail(''); try { await onFinish(toProfile(cur), a.objective === 'maintain' ? 0 : adj); } catch { setFail('Não foi possível salvar agora. Tente de novo.'); } finally { setBusy(false); } }
  const field = (k: keyof typeof raw, label: string, unit: string) => <label className="field">{label}<span className="flex items-center gap-2"><input type="text" inputMode="decimal" className="flex-1" value={raw[k]} onChange={e => { const v = e.target.value; if (k === 'target') touched.current = true; setRaw(r => { const n = { ...r, [k]: v }; if (k === 'weight' && !touched.current && a.objective !== 'maintain') { const w = num(v); if (Number.isFinite(w)) n.target = String(suggestedTarget(a.objective, w)); } return n; }); }}/><span className="text-xs">{unit}</span></span></label>;
  const chip = (on: boolean, label: string, onClick: () => void) => <button type="button" aria-pressed={on} onClick={onClick} className={`flex-1 rounded-md px-3 py-3 text-sm font-semibold transition ${on ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>{label}</button>;
  return <Dialog open onOpenChange={v => { if (!v && onSkip) onSkip(); }}><DialogContent className="max-w-md max-h-[92dvh] overflow-y-auto p-6 gap-5" aria-describedby={undefined} showCloseButton={Boolean(onSkip)}>
    <div className={`flex items-center gap-2 ${onSkip ? 'pr-7' : ''}`} aria-hidden="true">{Array.from({ length: STEPS }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`}/>)}</div>
    {step === 0 && <><DialogTitle className="text-2xl">Qual é o seu objetivo?</DialogTitle>
      <div className="space-y-2">{OBJECTIVES.map(({ key, title, text, Icon }) => <button type="button" key={key} onClick={() => choose(key)} className="w-full text-left rounded-md border border-border bg-card p-4 flex gap-3 items-start hover:border-primary transition"><span className="size-10 shrink-0 rounded-lg bg-primary/15 text-primary grid place-items-center"><Icon size={20}/></span><span><span className="block font-semibold">{title}</span><span className="block text-xs text-muted-foreground mt-0.5">{text}</span></span></button>)}</div>
      {onSkip && <Button variant="ghost" className="text-xs text-muted-foreground" onClick={onSkip}>Pular e ver um exemplo</Button>}</>}
    {step === 1 && <><DialogTitle className="text-2xl">Sobre você</DialogTitle>
      <label className="field">Como quer ser chamado?<input type="text" maxLength={60} value={a.name} onChange={e => setA({ ...a, name: e.target.value })}/></label>
      <div><p className="text-xs text-muted-foreground mb-2">Sexo (usado só no cálculo do gasto calórico)</p><div className="flex gap-2">{chip(a.sex === 'male', 'Masculino', () => setA({ ...a, sex: 'male' }))}{chip(a.sex === 'female', 'Feminino', () => setA({ ...a, sex: 'female' }))}</div></div>
      {field('age', 'Idade', 'anos')}</>}
    {step === 2 && <><DialogTitle className="text-2xl">Seu corpo hoje</DialogTitle>
      <div className="grid grid-cols-2 gap-3">{field('height', 'Altura', 'cm')}{field('weight', 'Peso atual', 'kg')}</div>
      {a.objective !== 'maintain' ? field('target', 'Peso-meta', 'kg') : <p className="text-xs text-muted-foreground">Vamos manter o peso atual como meta.</p>}</>}
    {step === 3 && <><DialogTitle className="text-2xl">Sua rotina</DialogTitle>
      <div><p className="text-xs text-muted-foreground mb-2">Quantos dias por semana você pretende treinar?</p><div className="grid grid-cols-6 gap-2">{[2, 3, 4, 5, 6, 0].map(n => <button type="button" key={n} aria-pressed={a.trainingDays === n} onClick={() => setA({ ...a, trainingDays: n })} className={`rounded-md py-3 text-sm font-semibold ${a.trainingDays === n ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>{n === 0 ? '0–1' : n}</button>)}</div></div>
      <label className="flex gap-3 text-sm items-center"><input type="checkbox" className="size-5 accent-[var(--primary)]" checked={a.activeJob} onChange={e => setA({ ...a, activeJob: e.target.checked })}/>Meu trabalho exige esforço físico ou ficar em pé o dia todo</label>
      <label className="flex gap-3 text-sm items-center"><input type="checkbox" className="size-5 accent-[var(--primary)]" checked={a.shifts} onChange={e => setA({ ...a, shifts: e.target.checked })}/>Trabalho em escala de plantão</label></>}
    {step === 4 && result && weeks && <><DialogTitle className="text-2xl">{a.name.trim() ? `${a.name.trim()}, esse é o seu plano` : 'Esse é o seu plano'}</DialogTitle>
      <div className="rounded-md bg-secondary p-4 space-y-1"><p className="text-3xl font-bold text-primary tabular-nums">{result.goals.calories.toLocaleString('pt-BR')} <span className="text-sm font-medium text-muted-foreground">kcal por dia</span></p>
        <p className="text-sm">{result.goals.protein} g proteína · {result.goals.carbs} g carboidrato · {result.goals.fat} g gordura</p>
        {a.objective !== 'maintain' && <p className="text-xs text-muted-foreground pt-1">Meta de {result.profile.target_weight.toLocaleString('pt-BR')} kg em cerca de {weeks.fastest} a {weeks.slowest} semanas.</p>}</div>
      {a.objective !== 'maintain' && <div><p className="text-xs text-muted-foreground mb-2">Ritmo</p><div className="flex gap-2">{PACES[a.objective].map(p => chip(adj === p.adj, p.label, () => setAdj(p.adj)))}</div></div>}
      {result.atFloor && <p className="text-xs text-muted-foreground">Ajustamos para o mínimo seguro de calorias.</p>}
      <p className="text-[11px] text-muted-foreground">Estimativa pela fórmula de Mifflin-St Jeor (fator de atividade {result.profile.activity.toLocaleString('pt-BR')}). Não substitui orientação de nutricionista ou médico. Você pode ajustar tudo depois no perfil.</p>
      {fail && <p role="alert" className="text-sm text-destructive">{fail}</p>}</>}
    {step > 0 && <div className="flex gap-2">
      <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={busy}><ArrowLeft/>Voltar</Button>
      {step < 4 ? <Button className="flex-1" disabled={Boolean(error)} onClick={next}>Continuar<ArrowRight/></Button> : <Button className="flex-1" disabled={busy} onClick={() => void finish()}>{busy ? 'Salvando…' : submitLabel}<ArrowRight/></Button>}
    </div>}
    {step > 0 && step < 4 && error && <p className="text-xs text-muted-foreground -mt-2" role="status">{error}</p>}
  </DialogContent></Dialog>;
}
