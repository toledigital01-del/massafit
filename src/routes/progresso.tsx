import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Camera, Ruler } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-context';
import { AuthDialog } from '@/components/auth-dialog';
import { supabase } from '@/integrations/supabase/client';
import { localDay } from '@/lib/nutrition';
import { FIELDS, POSES, measurementDeltas, photoPath, type Field, type Pose } from '@/lib/progress';
import { getProgress, savePhotoRecord, saveMeasurement } from '@/lib/progress.functions';

export const Route = createFileRoute('/progresso')({
  head: () => ({ meta: [
    { title: 'Meu progresso: medidas e fotos · MassaFit' },
    { name: 'description', content: 'Registre medidas do corpo e fotos de frente, lado e costas e compare o antes e o agora.' },
    { property: 'og:title', content: 'Progresso · MassaFit' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Progress,
});

/** Reduz a foto (máx. 1280 px) e converte para JPEG, para caber no limite de 5 MB do bucket. */
async function toJpeg(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Falha ao processar a foto'))), 'image/jpeg', 0.85));
}

function Progress() {
  const { user, loading } = useAuth(); const qc = useQueryClient();
  const [auth, setAuth] = useState(false);
  const fetchAll = useServerFn(getProgress), saveM = useServerFn(saveMeasurement), saveP = useServerFn(savePhotoRecord);
  const q = useQuery({ queryKey: ['massafit-progress', user?.id], queryFn: () => fetchAll(), enabled: Boolean(user) });
  const measurements = q.data?.measurements ?? [], photos = q.data?.photos ?? [];
  const day = localDay();
  const [vals, setVals] = useState<Record<Field, string>>({ waist: '', chest: '', hip: '', arm: '', thigh: '', calf: '' });
  const [chartField, setChartField] = useState<Field>('waist');
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [pose, setPose] = useState<Pose>('frente');
  const fileRef = useRef<HTMLInputElement>(null); const uploadPose = useRef<Pose>('frente');

  useEffect(() => { const t = measurements.find(m => m.day === day); if (t) setVals(Object.fromEntries(FIELDS.map(([k]) => [k, t[k] == null ? '' : String(t[k])])) as Record<Field, string>); }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const paths = photos.map(p => p.path); if (!paths.length) return;
    supabase.storage.from('progress-photos').createSignedUrls(paths, 3600).then(({ data }) => setUrls(Object.fromEntries((data ?? []).flatMap(d => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])))));
  }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const deltas = useMemo(() => measurementDeltas(measurements), [measurements]);
  const chart = useMemo(() => [...measurements].reverse().filter(m => m[chartField] != null).map(m => ({ label: m.day.slice(8, 10) + '/' + m.day.slice(5, 7), v: Number(m[chartField]) })), [measurements, chartField]);
  const poseRows = photos.filter(p => p.pose === pose).sort((a, b) => a.day.localeCompare(b.day));
  const before = poseRows[0], now = poseRows.at(-1);
  const need = () => { if (!user) { setAuth(true); return false; } return true; };

  async function submitMeasures() {
    if (!need()) return; setBusy(true);
    try {
      const num = (k: Field) => (vals[k].trim() === '' ? null : Number(vals[k].replace(',', '.')));
      await saveM({ data: { day, waist: num('waist'), chest: num('chest'), hip: num('hip'), arm: num('arm'), thigh: num('thigh'), calf: num('calf') } });
      await qc.invalidateQueries({ queryKey: ['massafit-progress'] }); toast.success('Medidas salvas!');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao salvar'); } finally { setBusy(false); }
  }
  async function onFile(file: File | undefined) {
    if (!file || !user) return; setBusy(true);
    try {
      const p = uploadPose.current, path = photoPath(user.id, day, p);
      const { error } = await supabase.storage.from('progress-photos').upload(path, await toJpeg(file), { upsert: true, contentType: 'image/jpeg' });
      if (error) throw new Error('Não foi possível enviar a foto.');
      await saveP({ data: { day, pose: p, path } });
      await qc.invalidateQueries({ queryKey: ['massafit-progress'] }); toast.success('Foto salva!');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao enviar'); } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  return <div className="fade-in">
    <div className="dashboard-heading"><div><p className="eyebrow mb-2">O ESPELHO NÃO MENTE, A BALANÇA ÀS VEZES</p><h1>Meu progresso<span className="text-primary">.</span></h1><p className="text-xs text-muted-foreground mt-2">Meça sempre no mesmo dia da semana, de manhã. Fotos com a mesma luz e distância.</p></div></div>
    {!loading && !user && <div className="panel p-6 text-sm"><p>Entre na sua conta para registrar medidas e fotos. Elas ficam só com você.</p><Button className="mt-3" onClick={() => setAuth(true)}>Entrar</Button></div>}
    {user && <div className="grid lg:grid-cols-2 gap-5">
      <section className="panel p-5"><h2 className="section-title flex gap-2 items-center"><Ruler size={18} className="text-primary"/>Medidas de hoje (cm)</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">{FIELDS.map(([k, l]) => <label key={k} className="field">{l}<input type="number" inputMode="decimal" min="10" max="250" step="0.1" value={vals[k]} onChange={e => setVals(v => ({ ...v, [k]: e.target.value }))}/></label>)}</div>
        <Button className="w-full mt-4" disabled={busy || !FIELDS.some(([k]) => vals[k].trim() !== '')} onClick={submitMeasures}>Salvar medidas</Button>
        {Object.keys(deltas).length > 0 && <div className="mt-5 text-xs space-y-1.5"><p className="eyebrow">DESDE A PRIMEIRA MEDIDA</p>{FIELDS.map(([k, l]) => { const d = deltas[k]; return d ? <p key={k} className="flex justify-between"><span>{l}</span><span className="tabular-nums text-muted-foreground">{d.first} → {d.last} cm <span className={d.delta > 0 ? 'text-primary font-semibold' : 'font-semibold'}>({d.delta > 0 ? '+' : ''}{d.delta.toLocaleString('pt-BR')})</span></span></p> : null; })}</div>}
        {chart.length >= 2 && <div className="mt-5"><select className="bg-secondary rounded-md px-2 py-1 text-xs" value={chartField} onChange={e => setChartField(e.target.value as Field)}>{FIELDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <div className="h-36 mt-2"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}><XAxis dataKey="label" tick={{ fontSize: 10 }}/><YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10 }}/><Tooltip formatter={(v: number) => [`${v.toLocaleString('pt-BR')} cm`, 'Medida']}/><Line type="monotone" dataKey="v" stroke="var(--color-primary, #22c55e)" strokeWidth={2.5} dot={{ r: 2 }}/></LineChart></ResponsiveContainer></div></div>}
      </section>
      <section className="panel p-5"><h2 className="section-title flex gap-2 items-center"><Camera size={18} className="text-primary"/>Fotos de hoje</h2>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files?.[0])}/>
        <div className="grid grid-cols-3 gap-2 mt-3">{POSES.map(p => { const done = photos.find(x => x.day === day && x.pose === p); return <Button key={p} variant={done ? 'default' : 'secondary'} disabled={busy} className="capitalize" onClick={() => { if (!need()) return; uploadPose.current = p; fileRef.current?.click(); }}>{done ? '✓ ' : ''}{p}</Button>; })}</div>
        <p className="text-[10px] text-muted-foreground mt-2">Armazenadas em pasta privada: só você consegue ver.</p>
        <div className="flex bg-secondary p-1 rounded-md mt-5 w-fit">{POSES.map(p => <Button key={p} size="sm" variant={pose === p ? 'default' : 'ghost'} className="capitalize" onClick={() => setPose(p)}>{p}</Button>)}</div>
        {before && now && before.id !== now.id ? <div className="grid grid-cols-2 gap-2 mt-3">{[['Antes', before], ['Agora', now]].map(([l, ph]) => { const x = ph as typeof before; return <figure key={l as string}><div className="aspect-[3/4] bg-muted rounded-md overflow-hidden">{urls[x.path] ? <img src={urls[x.path]} alt={`${l} (${x.pose}) em ${x.day}`} className="size-full object-cover"/> : null}</div><figcaption className="text-[10px] text-muted-foreground mt-1">{l as string} · {x.day.split('-').reverse().join('/')}</figcaption></figure>; })}</div>
          : <p className="text-xs text-muted-foreground mt-3">{now ? 'Tire outra foto em outro dia para comparar antes e agora.' : 'Ainda sem fotos desta pose.'}</p>}
      </section>
    </div>}
    <AuthDialog open={auth} onClose={() => setAuth(false)}/>
  </div>;
}
