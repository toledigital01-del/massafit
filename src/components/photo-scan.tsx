import { useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Camera, ChevronLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { analyzeFoodPhoto, type PhotoItem } from '@/lib/photo.functions';
import { mealNames } from '@/lib/meal-plan';
import type { recordAction } from '@/lib/massafit.functions';

async function shrink(file:File){
  const img=await createImageBitmap(file);const scale=Math.min(1,1024/Math.max(img.width,img.height));
  const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);
  c.getContext('2d')!.drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',0.8);
}
export function PhotoScan({day,meal:initialMeal,act,busy,onBack,onDone}:{day:string;meal:string;act:(i:Parameters<typeof recordAction>[0]['data'])=>Promise<boolean>;busy:boolean;onBack:()=>void;onDone:()=>void}){
  const input=useRef<HTMLInputElement>(null);const analyze=useServerFn(analyzeFoodPhoto);
  const [preview,setPreview]=useState<string|null>(null);const [items,setItems]=useState<PhotoItem[]|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [meal,setMeal]=useState(initialMeal);
  async function pick(file?:File){if(!file)return;setError('');setItems(null);setLoading(true);try{const image=await shrink(file);setPreview(image);const r=await analyze({data:{image}});setItems(r);if(!r.length)setError('Nenhum alimento reconhecido. Tente uma foto mais próxima e iluminada.');}catch(e){setError(e instanceof Error?e.message:'Falha ao analisar.');}finally{setLoading(false);}}
  const update=(i:number,k:keyof PhotoItem,v:string)=>setItems(list=>list&&list.map((it,j)=>{if(j!==i)return it;if(k==='name')return {...it,name:v};const n=Number(v);if(k==='grams'&&it.grams>0){const f=n/it.grams;return {...it,grams:n,calories:Math.round(it.calories*f),protein:Math.round(it.protein*f*10)/10,carbs:Math.round(it.carbs*f*10)/10,fat:Math.round(it.fat*f*10)/10};}return {...it,[k]:n};}));
  const total=(items??[]).reduce((s,i)=>({kcal:s.kcal+i.calories,p:s.p+i.protein}),{kcal:0,p:0});
  return <>
    <Button variant="ghost" className="justify-start px-0 text-muted-foreground" onClick={onBack}><ChevronLeft/>Voltar à busca</Button>
    <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>void pick(e.target.files?.[0])}/>
    {preview?<img src={preview} alt="Foto da refeição" className="w-full max-h-56 object-cover rounded-md"/>:<button type="button" onClick={()=>input.current?.click()} className="w-full rounded-md border border-dashed border-border py-12 text-center text-muted-foreground hover:border-primary"><Camera className="mx-auto mb-3 text-primary" size={32}/><span className="block text-sm">Tirar foto do prato ou do rótulo</span><span className="block text-[11px] mt-1">A IA identifica os alimentos e estima as calorias</span></button>}
    {loading && <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4"><Loader2 className="animate-spin" size={18}/>Analisando a foto…</p>}
    {error && <p className="text-sm text-destructive text-center">{error}</p>}
    {items && items.length>0 && <>
      <p className="text-[11px] text-muted-foreground">Estimativa automática · confira e ajuste as quantidades antes de salvar.</p>
      <div className="space-y-3">{items.map((it,i)=><div key={i} className="border-b border-border pb-3"><div className="flex gap-2 items-center"><input className="flex-1 bg-transparent text-sm font-medium outline-none" value={it.name} onChange={e=>update(i,'name',e.target.value)}/><Button variant="ghost" size="icon" title="Remover item" onClick={()=>setItems(items.filter((_,j)=>j!==i))}><Trash2 size={16}/></Button></div><div className="grid grid-cols-5 gap-2 mt-1">{(['grams','calories','protein','carbs','fat'] as const).map(k=><label key={k} className="text-[10px] text-muted-foreground">{{grams:'g',calories:'kcal',protein:'prot.',carbs:'carb.',fat:'gord.'}[k]}<input type="number" min="0" className="w-full rounded bg-muted px-1.5 py-1.5 text-sm text-foreground" value={it[k]} onChange={e=>update(i,k,e.target.value)}/></label>)}</div></div>)}</div>
      <div className="flex justify-between text-sm"><span>Total</span><span className="font-semibold">{Math.round(total.kcal)} kcal · {Math.round(total.p)} g proteína</span></div>
      <label className="field">Refeição<select value={meal} onChange={e=>setMeal(e.target.value)}>{mealNames.map(m=><option key={m}>{m}</option>)}</select></label>
      <Button disabled={busy} onClick={async()=>{if(await act({kind:'custom',day,meal:meal as typeof mealNames[number],items:items.filter(i=>i.grams>0&&i.name)}))onDone();}}><Plus/>{busy?'Salvando…':'Adicionar ao diário'}</Button>
    </>}
    {preview && !loading && <Button variant="secondary" onClick={()=>input.current?.click()}><Camera/>Tirar outra foto</Button>}
  </>;
}
