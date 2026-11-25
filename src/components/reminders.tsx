import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, Download, Droplets, Dumbbell, Smartphone, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { loadSettings } from '@/lib/plan-storage';
import { loadReminders, nextReminder, notificationsSupported, registerWorker, saveReminders, showReminder, type ReminderSettings } from '@/lib/reminders';

/** Agenda o próximo lembrete enquanto o app estiver aberto (montado uma vez no shell). */
export function useReminderScheduler() {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    void registerWorker();
    const plan = () => {
      clearTimeout(timer.current);
      const s = loadReminders();
      if (!s.enabled || !notificationsSupported() || Notification.permission !== 'granted') return;
      const next = nextReminder(new Date(), s, loadSettings().meals);
      if (!next) return;
      // setTimeout limita ~24 dias; reagenda no máximo a cada 30 min para corrigir deriva/aba dormindo
      const wait = Math.min(next.at.getTime() - Date.now(), 30 * 60 * 1000);
      timer.current = setTimeout(() => { if (next.at.getTime() - Date.now() <= 1000) void showReminder(next); plan(); }, Math.max(wait, 500));
    };
    plan();
    const onChange = () => plan();
    window.addEventListener('massafit-reminders-changed', onChange);
    document.addEventListener('visibilitychange', onChange);
    return () => { clearTimeout(timer.current); window.removeEventListener('massafit-reminders-changed', onChange); document.removeEventListener('visibilitychange', onChange); };
  }, []);
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function RemindersCard() {
  const [s, setS] = useState<ReminderSettings>(() => loadReminders());
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    setS(loadReminders());
    setPerm(notificationsSupported() ? Notification.permission : 'unsupported');
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setInstalled(window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e as InstallEvent); };
    window.addEventListener('beforeinstallprompt', h); window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  const patch = (p: Partial<ReminderSettings>) => { const n = { ...s, ...p }; setS(n); saveReminders(n); window.dispatchEvent(new Event('massafit-reminders-changed')); };
  const turnOn = async () => {
    if (!notificationsSupported()) { toast.error('Este navegador não suporta notificações.'); return; }
    const r = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    setPerm(r);
    if (r !== 'granted') { toast.error('Sem permissão de notificação. Libere nas configurações do navegador.'); return; }
    patch({ enabled: true });
    await showReminder({ id: 'teste', title: 'Lembretes ligados ✅', body: 'Vou te avisar de água, refeições e treino.', url: '/' });
    toast.success('Lembretes ligados!');
  };
  const install = async () => { if (!installEvt) return; await installEvt.prompt(); const c = await installEvt.userChoice; if (c.outcome === 'accepted') setInstalled(true); setInstallEvt(null); };
  const Row = ({ icon: Icon, label, on, onToggle, children }: { icon: typeof Bell; label: string; on: boolean; onToggle: (v: boolean) => void; children?: React.ReactNode }) =>
    <div className="py-3 border-b border-border"><label className="flex items-center gap-3 text-sm cursor-pointer"><Icon size={16} className="text-primary"/><span className="flex-1">{label}</span><input type="checkbox" checked={on} onChange={e => onToggle(e.target.checked)}/></label>{on && children && <div className="mt-2 pl-7 text-xs text-muted-foreground flex flex-wrap items-center gap-2">{children}</div>}</div>;
  const field = 'bg-secondary rounded-md px-2 py-1 text-foreground';
  return <section className="panel p-6" aria-labelledby="lembretes-t">
    <h2 id="lembretes-t" className="section-title flex gap-2"><Bell className="text-primary"/>Lembretes e app no celular</h2>
    <div className="mt-4 rounded-md border border-border p-4 text-sm flex items-start gap-3"><Smartphone size={18} className="text-primary mt-0.5 shrink-0"/><div className="flex-1">
      {installed ? <p>App instalado neste aparelho. ✅</p> : installEvt ? <><p className="mb-2">Instale o MassaFit como app: abre direto da tela inicial, sem barra do navegador.</p><Button size="sm" onClick={() => void install()}><Download/>Instalar app</Button></> : ios ? <p>No iPhone: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>. Os lembretes só funcionam com o app instalado assim.</p> : <p>No Chrome: menu ⋮ e <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).</p>}</div></div>
    {perm === 'unsupported' ? <p className="text-sm text-muted-foreground mt-4">Este navegador não suporta notificações.</p> : <>
      <div className="flex items-center gap-3 mt-4"><p className="text-sm flex-1">{s.enabled && perm === 'granted' ? 'Lembretes ligados' : perm === 'denied' ? 'Notificações bloqueadas no navegador' : 'Lembretes desligados'}</p>
        {s.enabled && perm === 'granted' ? <Button size="sm" variant="secondary" onClick={() => patch({ enabled: false })}><BellOff/>Desligar</Button> : <Button size="sm" onClick={() => void turnOn()}><Bell/>Ligar lembretes</Button>}</div>
      {s.enabled && <div className="mt-2">
        <Row icon={Droplets} label="Beber água" on={s.water} onToggle={v => patch({ water: v })}>
          a cada <select className={field} value={s.waterEveryMin} onChange={e => patch({ waterEveryMin: Number(e.target.value) })}>{[60, 90, 120, 150, 180].map(m => <option key={m} value={m}>{m / 60 >= 1 && m % 60 === 0 ? `${m / 60} h` : `${m} min`}</option>)}</select>
          das <input type="time" className={field} value={s.dayStart} onChange={e => patch({ dayStart: e.target.value })}/> às <input type="time" className={field} value={s.dayEnd} onChange={e => patch({ dayEnd: e.target.value })}/></Row>
        <Row icon={Utensils} label="Hora das refeições" on={s.meals} onToggle={v => patch({ meals: v })}>
          avisar <select className={field} value={s.mealLead} onChange={e => patch({ mealLead: Number(e.target.value) })}>{[0, 10, 15, 30].map(m => <option key={m} value={m}>{m ? `${m} min antes` : 'na hora'}</option>)}</select> (horários do seu plano)</Row>
        <Row icon={Dumbbell} label="Treino" on={s.training} onToggle={v => patch({ training: v })}>
          às <input type="time" className={field} value={s.trainingTime} onChange={e => patch({ trainingTime: e.target.value })}/>
          {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((l, i) => <button type="button" key={i} aria-pressed={s.trainingDays.includes(i)} aria-label={['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'][i]} onClick={() => patch({ trainingDays: s.trainingDays.includes(i) ? s.trainingDays.filter(d => d !== i) : [...s.trainingDays, i].sort() })} className={`size-8 rounded-full text-xs font-semibold ${s.trainingDays.includes(i) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{l}</button>)}</Row>
        <p className="text-xs text-muted-foreground mt-4 leading-5">Os avisos tocam com o app aberto ou rodando em segundo plano no aparelho. Se o celular fechar o app de vez para economizar bateria, o aviso pode atrasar. Aviso garantido com o app totalmente fechado precisa de notificação por servidor (próxima etapa, junto com a conta).</p></div>}</>}
  </section>;
}
