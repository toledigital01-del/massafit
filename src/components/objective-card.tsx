import { useState } from 'react';
import { ChevronDown, Target } from 'lucide-react';
import { GUIDES, type Objective } from '@/lib/objective-guide';

/** Resumo recolhível do foco do usuário (alimentação, treino e fontes). */
export function ObjectiveCard({ objective, section = 'both' }: { objective: Objective; section?: 'food' | 'training' | 'both' }) {
  const [open, setOpen] = useState(false);
  const g = GUIDES[objective];
  return <section className="panel p-4 mb-4">
    <button className="w-full flex items-center gap-2 text-left" onClick={() => setOpen(o => !o)}><Target size={17} className="text-primary"/><b className="flex-1 text-sm">{g.title}</b><ChevronDown size={16} className={open ? 'rotate-180' : ''}/></button>
    {open && <div className="mt-3 text-xs space-y-3">
      {section !== 'training' && <div><p className="font-semibold mb-1">Alimentação</p><ul className="list-disc pl-4 space-y-1 text-muted-foreground">{g.food.map(t => <li key={t}>{t}</li>)}</ul></div>}
      {section !== 'food' && <div><p className="font-semibold mb-1">Treino</p><ul className="list-disc pl-4 space-y-1 text-muted-foreground">{g.training.map(t => <li key={t}>{t}</li>)}</ul></div>}
      <div><p className="font-semibold mb-1">Fontes</p><ul className="space-y-1">{g.sources.map(s => <li key={s.url}><a className="text-primary underline" href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul></div>
      <p className="text-[11px] text-muted-foreground">Orientação geral. Não substitui nutricionista, educador físico ou médico.</p>
    </div>}
  </section>;
}
