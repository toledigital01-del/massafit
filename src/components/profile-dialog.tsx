import { useState, type FormEvent } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Calculator, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { calculateGoals, projectionWeeks, type ProfileInput } from '@/lib/nutrition';
import { saveProfile } from '@/lib/massafit.functions';
type Goals = {calories:number;protein:number;carbs:number;fat:number;water:number;surplus:number};
export function ProfileDialog({profile,goals,onClose,required=false}:{profile:ProfileInput;goals:Goals;onClose:()=>void;required?:boolean}) {
  const [p,setP]=useState(profile);const [surplus,setSurplus]=useState(goals.surplus);const [manual,setManual]=useState(false);const [overrides,setOverrides]=useState(goals);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const save=useServerFn(saveProfile);const qc=useQueryClient();const computed=calculateGoals(p,surplus);const projected=projectionWeeks(p.weight,p.target_weight);
  async function submit(e:FormEvent) {e.preventDefault();setBusy(true);setError('');try {await save({data:{profile:{...p,sex:p.sex==="female"?"female":"male"},surplus,overrides:manual?overrides:undefined}});await qc.invalidateQueries({queryKey:['massafit']});onClose();}catch {setError('Não foi possível salvar. Verifique os campos e tente novamente.');}finally{setBusy(false);}}
  const numberField=(key:'age'|'height'|'weight'|'target_weight'|'training_days',label:string,min:number,max:number,step='1')=><label className="field" key={key}>{label}<input type="number" min={min} max={max} step={step} required value={p[key]} onChange={e=>setP({...p,[key]:Number(e.target.value)})}/></label>;
  return <Dialog open onOpenChange={v=>{if(!v && !required)onClose();}}><DialogContent className="max-w-xl max-h-[90dvh] overflow-y-auto p-7" aria-describedby={undefined} showCloseButton={!required}>
    <span className="eyebrow text-primary">SEU PONTO DE PARTIDA</span><DialogTitle className="text-2xl">{required?'Vamos montar seu plano.':'Seu perfil e suas metas'}</DialogTitle>
    <form onSubmit={submit} className="space-y-5">
    <div className="grid grid-cols-2 gap-4"><label className="field col-span-2">Nome<input required maxLength={60} value={p.name} onChange={e=>setP({...p,name:e.target.value})}/></label>
    <label className="field">Sexo<select value={p.sex} onChange={e=>setP({...p,sex:e.target.value})}><option value="male">Masculino</option><option value="female">Feminino</option></select></label>
    {numberField('age','Idade (anos)',18,100)}{numberField('height','Altura (cm)',100,230)}{numberField('weight','Peso atual (kg)',30,300,'0.1')}{numberField('target_weight','Peso-meta (kg)',30,300,'0.1')}{numberField('training_days','Treinos por semana',0,7)}
    <label className="field col-span-2">Nível de atividade<select value={p.activity} onChange={e=>setP({...p,activity:Number(e.target.value)})}><option value="1.2">Sedentário · 1,20</option><option value="1.375">Levemente ativo · 1,375</option><option value="1.55">Moderadamente ativo · 1,55</option><option value="1.725">Muito ativo · 1,725</option><option value="1.9">Extremamente ativo · 1,90</option></select></label></div>
    <label className="flex gap-3 text-sm items-center"><input type="checkbox" className="size-5 accent-primary" checked={p.shifts} onChange={e=>setP({...p,shifts:e.target.checked})}/>Trabalho em escala de plantão</label>
    <label className="field">Superávit diário: +{surplus} kcal<input type="range" min="250" max="500" step="25" value={surplus} onChange={e=>setSurplus(Number(e.target.value))}/></label>
    <div className="bg-secondary p-4 rounded-md space-y-2"><p className="flex gap-2 items-center text-sm font-semibold"><Calculator size={17}/>Mifflin-St Jeor</p><p className="text-xs text-muted-foreground">TMB: {computed.bmr} kcal × {p.activity.toLocaleString('pt-BR')} = {computed.expenditure} kcal + {surplus} kcal</p><div className="text-xl font-bold text-primary">{computed.calories.toLocaleString('pt-BR')} kcal / dia</div><p className="text-xs">{computed.protein} g proteína · {computed.fat} g gordura · {computed.carbs} g carboidrato</p><p className="text-xs text-muted-foreground">Proteína: 2 g/kg · Gordura: 0,95 g/kg · Carboidratos: calorias restantes</p><p className="text-xs flex gap-2"><Target size={14}/>{projected.fastest}–{projected.slowest} semanas até a meta · estimativa de 0,25–0,35 kg/semana</p></div>
    <label className="flex gap-3 text-sm items-center"><input type="checkbox" className="size-5" checked={manual} onChange={e=>setManual(e.target.checked)}/>Editar metas manualmente</label>
    {manual && <div className="grid grid-cols-2 gap-3">{([{key:'calories',label:'Calorias (kcal)',min:1000,max:7000},{key:'protein',label:'Proteína (g)',min:30,max:600},{key:'carbs',label:'Carboidrato (g)',min:0,max:1200},{key:'fat',label:'Gordura (g)',min:20,max:300},{key:'water',label:'Água (ml)',min:500,max:8000}] as const).map(f=><label className="field" key={f.key}>{f.label}<input type="number" required min={f.min} max={f.max} value={overrides[f.key]} onChange={e=>setOverrides({...overrides,[f.key]:Number(e.target.value)})}/></label>)}</div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit" className="w-full" disabled={busy}>{busy?'Salvando…':required?'Começar meu plano':'Salvar minhas metas'}<ArrowRight/></Button>
    </form>
  </DialogContent></Dialog>;
}