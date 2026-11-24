import { useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { mealNames } from '@/lib/meal-plan';
import { loadProducts, newId, productMacros, saveProducts, validateProduct, type MyProduct } from '@/lib/my-items';
import type { recordAction } from '@/lib/massafit.functions';

type Act = (input: Parameters<typeof recordAction>[0]['data']) => Promise<boolean>;
const num = (s: string) => (s.trim() === '' ? Number.NaN : Number(s.replace(',', '.')));

/** Cadastro de um produto que não está na biblioteca, com os valores do rótulo (por 100 g). */
export function ProductForm({ day, initialMeal, initial, act, busy, onBack, onDone }: { day: string; initialMeal: string; initial?: MyProduct | undefined; act: Act; busy: boolean; onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [v, setV] = useState({ kcal: initial ? String(initial.kcal) : '', p: initial ? String(initial.p) : '', c: initial ? String(initial.c) : '', f: initial ? String(initial.f) : '' });
  const [grams, setGrams] = useState('100');
  const [meal, setMeal] = useState(initialMeal);
  const [save, setSave] = useState(!initial);
  const prod = { name, kcal: num(v.kcal), p: num(v.p), c: num(v.c), f: num(v.f) };
  const g = num(grams);
  const error = validateProduct(prod) ?? (!(g >= 1 && g <= 3000) ? 'A quantidade deve ficar entre 1 e 3000 g.' : null);
  const m = error ? null : productMacros(prod, g);
  const field = (k: keyof typeof v, label: string) => <label className="field">{label}<input type="text" inputMode="decimal" value={v[k]} onChange={e => setV({ ...v, [k]: e.target.value })} aria-label={`${label} por 100 g`}/></label>;
  async function submit() {
    if (error || !m) return;
    const ok = await act({ kind: 'custom', day, meal: meal as typeof mealNames[number], items: [{ name: name.trim(), grams: g, ...m }] });
    if (!ok) return;
    if (save && !initial) {
      const list = loadProducts().filter(p => p.name.toLocaleLowerCase('pt-BR') !== name.trim().toLocaleLowerCase('pt-BR'));
      saveProducts([{ id: newId('prod'), name: name.trim(), kcal: prod.kcal, p: prod.p, c: prod.c, f: prod.f }, ...list]);
      toast.success('Produto salvo em "Meus produtos"');
    }
    onDone();
  }
  return <>
    <Button variant="ghost" className="justify-start px-0 text-muted-foreground" onClick={onBack}><ChevronLeft/>Voltar à busca</Button>
    <p className="text-xs text-muted-foreground">Copie os valores da tabela nutricional da embalagem, na coluna de 100 g. Se o rótulo traz só por porção, divida pela porção e multiplique por 100.</p>
    <label className="field">Nome do produto<input type="text" maxLength={80} placeholder="Ex.: Barra de cereal sabor coco" value={name} onChange={e => setName(e.target.value)} disabled={!!initial}/></label>
    <p className="text-xs font-semibold">Por 100 g</p>
    <div className="grid grid-cols-2 gap-3">{field('kcal', 'Calorias (kcal)')}{field('p', 'Proteínas (g)')}{field('c', 'Carboidratos (g)')}{field('f', 'Gorduras (g)')}</div>
    <div className="grid grid-cols-2 gap-3">
      <label className="field">Quantidade que você comeu (g)<input type="text" inputMode="decimal" value={grams} onChange={e => setGrams(e.target.value)}/></label>
      <label className="field">Refeição<select value={meal} onChange={e => setMeal(e.target.value)}>{mealNames.map(n => <option key={n}>{n}</option>)}</select></label>
    </div>
    {!initial && <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={save} onChange={e => setSave(e.target.checked)} className="size-4 accent-[var(--primary)]"/>Guardar em "Meus produtos" para usar de novo</label>}
    {m ? <div className="grid grid-cols-4 py-4 border-y border-border text-center">{[['kcal', Math.round(m.calories)], ['g proteína', m.protein], ['g carb.', m.carbs], ['g gordura', m.fat]].map(([l, x]) => <div key={l}><p className="font-bold text-lg">{x}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>)}</div>
      : <p className="text-xs text-muted-foreground py-3 border-y border-border">{name || v.kcal || v.p || v.c || v.f ? error : 'Preencha o nome e os valores do rótulo.'}</p>}
    <Button disabled={busy || !!error} onClick={() => void submit()}><Plus/>{busy ? 'Salvando…' : 'Adicionar ao diário'}</Button>
  </>;
}
