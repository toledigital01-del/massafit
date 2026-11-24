import { useState } from 'react';
import { Download } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { toCsv } from '@/lib/csv';
import { getSetLogs } from '@/lib/workout.functions';
import { localDay } from '@/lib/nutrition';

function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export function ExportCard({ weights }: { weights: { day: string; weight: number }[] }) {
  const sets = useServerFn(getSetLogs); const [busy, setBusy] = useState(false);
  return <section className="panel p-5 mt-5"><h3 className="section-title flex gap-2 items-center"><Download size={18} className="text-primary"/>Seus dados</h3>
    <p className="text-xs text-muted-foreground mt-1">Baixe em CSV (abre no Excel) para guardar ou levar ao seu nutricionista.</p>
    <div className="flex flex-wrap gap-2 mt-3">
      <Button variant="secondary" disabled={!weights.length} onClick={() => download(`massafit-peso-${localDay()}.csv`, toCsv(['Data', 'Peso (kg)'], [...weights].sort((a, b) => a.day.localeCompare(b.day)).map(w => [w.day, w.weight])))}>Peso</Button>
      <Button variant="secondary" disabled={busy} onClick={async () => {
        setBusy(true);
        try { const rows = await sets({ data: { since: '2000-01-01' } }); if (!rows.length) { toast.info('Ainda não há séries registradas.'); return; } download(`massafit-treinos-${localDay()}.csv`, toCsv(['Data', 'Exercício', 'Série', 'Carga (kg)', 'Repetições'], rows.map(r => [r.day, r.exercise, r.set_number, Number(r.weight), r.reps]))); }
        catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao exportar'); } finally { setBusy(false); }
      }}>Treinos</Button>
    </div></section>;
}
