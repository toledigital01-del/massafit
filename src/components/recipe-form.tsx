import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { mealNames } from '@/lib/meal-plan';
import { FOODS } from '@/lib/plan-foods';
import { loadProducts, newId, parseSteps, productMacros, recipeTotals, type MyIngredient, type MyRecipe } from '@/lib/my-items';

type Source = { key: string; name: string; per100: { kcal: number; p: number; c: number; f: number } };
const norm = (t: string) => t.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g, '');
type Row = { src: Source; grams: string };

/** Nova receita: ingredientes do catálogo ou dos produtos cadastrados; os valores saem da soma. */
export function RecipeForm({ onSave, onClose }: { onSave: (r: MyRecipe) => void; onClose: () => void }) {
  const [name, setName] = useState(''); const [meal, setMeal] = useState<string>('Almoço'); const [minutes, setMinutes] = useState('15');
  const [steps, setSteps] = useState(''); const [search, setSearch] = useState(''); const [rows, setRows] = useState<Row[]>([]);
  const sources = useMemo<Source[]>(() => [
    ...loadProducts().map(p => ({ key: p.id, name: `${p.name} (meu produto)`, per100: { kcal: p.kcal, p: p.p, c: p.c, f: p.f } })),
    ...FOODS.map(f => ({ key: f.id, name: f.name, per100: { kcal: f.kcal, p: f.p, c: f.c, f: f.f } })),
  ], []);
  const matches = search.trim() ? sources.filter(s => norm(s.name).includes(norm(search))).slice(0, 6) : [];
  const ingredients: MyIngredient[] = rows.flatMap(r => { const g = Number(r.grams.replace(',', '.')); if (!(g > 0 && g <= 3000)) return []; const m = productMacros(r.src.per100, g); return [{ name: r.src.name.replace(' (meu produto)', ''), grams: g, kcal: m.calories, p: m.protein, c: m.carbs, f: m.fat }]; });
  const t = recipeTotals({ ingredients }); const list = parseSteps(steps);
  const min = Number(minutes);
  const problem = !name.trim() ? 'Dê um nome à receita.' : ingredients.length === 0 ? 'Adicione ao menos um ingrediente com a quantidade em gramas.' : ingredients.length < rows.length ? 'Preencha a quantidade de todos os ingredientes.' : list.length === 0 ? 'Escreva ao menos um passo do preparo.' : !(min >= 1 && min <= 600) ? 'Informe o tempo de preparo em minutos.' : null;
  return <Dialog open onOpenChange={v => { if (!v) onClose(); }}><DialogContent className="max-w-lg max-h-[92dvh] overflow-y-auto p-6 space-y-4" aria-describedby={undefined}>
    <DialogTitle className="text-xl">Nova receita</DialogTitle>
    <label className="field">Nome<input type="text" maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Panqueca de whey"/></label>
    <div className="grid grid-cols-2 gap-3">
      <label className="field">Refeição<select value={meal} onChange={e => setMeal(e.target.value)}>{mealNames.map(m => <option key={m}>{m}</option>)}</select></label>
      <label className="field">Tempo (min)<input type="text" inputMode="numeric" value={minutes} onChange={e => setMinutes(e.target.value)}/></label>
    </div>
    <section className="space-y-2"><p className="text-sm font-semibold">Ingredientes (1 porção)</p>
      {rows.map((r, i) => <div key={`${r.src.key}-${i}`} className="flex items-center gap-2"><span className="flex-1 text-sm">{r.src.name}</span>
        <input type="text" inputMode="decimal" aria-label={`Gramas de ${r.src.name}`} className="w-20 rounded border border-input bg-background px-2 py-2 text-sm" placeholder="g" value={r.grams} onChange={e => setRows(rs => rs.map((x, j) => j === i ? { ...x, grams: e.target.value } : x))}/>
        <span className="text-xs text-muted-foreground">g</span>
        <Button variant="ghost" size="icon" title={`Remover ${r.src.name}`} onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}><Trash2 className="text-muted-foreground"/></Button></div>)}
      <label className="field">Buscar ingrediente<input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Digite: aveia, ovo, frango…"/></label>
      {matches.map(s => <Button key={s.key} variant="ghost" className="w-full justify-between h-auto min-h-11 text-left" onClick={() => { setRows(rs => [...rs, { src: s, grams: '' }]); setSearch(''); }}><span className="whitespace-normal text-sm">{s.name}</span><Plus className="text-primary"/></Button>)}
      {search.trim() && !matches.length && <p className="text-xs text-muted-foreground">Não achou? Cadastre o produto em Diário → Adicionar alimento → Cadastrar produto (marque "Guardar") e ele aparece aqui.</p>}
    </section>
    <label className="field">Modo de preparo (um passo por linha)<textarea rows={5} className="rounded-md border border-input bg-background p-3 text-sm text-foreground" value={steps} onChange={e => setSteps(e.target.value)} placeholder={'Bata tudo no liquidificador.\nSirva gelado.'}/></label>
    <div className="grid grid-cols-4 py-3 border-y border-border text-center">{[['kcal', t.kcal], ['g prot.', t.p], ['g carb.', t.c], ['g gord.', t.f]].map(([l, x]) => <div key={l}><p className="font-bold text-lg tabular-nums">{x}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>)}</div>
    {problem && <p className="text-xs text-muted-foreground">{problem}</p>}
    <Button disabled={!!problem} onClick={() => { onSave({ id: newId('rec'), name: name.trim(), meal, minutes: min, ingredients, steps: list }); onClose(); }}>Salvar receita</Button>
  </DialogContent></Dialog>;
}
