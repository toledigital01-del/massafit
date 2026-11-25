/** Lembretes do MassaFit: água, refeições e treino. Rodam enquanto o app está aberto/instalado (sem servidor de push). */
import { MEAL_SETS } from './plan-engine';
import { MEAL_LABEL, MEAL_TIME } from './plan-templates';
import type { MealType } from './plan-templates';

export type ReminderSettings = {
  enabled: boolean;
  water: boolean; waterEveryMin: number; dayStart: string; dayEnd: string;
  meals: boolean; mealLead: number;      // minutos de antecedência
  mealTimes: Partial<Record<MealType, string>>;
  training: boolean; trainingTime: string; trainingDays: number[]; // 0 = segunda
};
export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false, water: true, waterEveryMin: 120, dayStart: '08:00', dayEnd: '21:00',
  meals: true, mealLead: 0, mealTimes: {}, training: true, trainingTime: '17:30', trainingDays: [0, 1, 3, 4],
};
const KEY = 'massafit-reminders';
export const loadReminders = (): ReminderSettings => { try { return { ...DEFAULT_REMINDERS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return DEFAULT_REMINDERS; } };
export const saveReminders = (s: ReminderSettings) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignora */ } };

export type Reminder = { at: Date; id: string; title: string; body: string; url: string };
const toMin = (hhmm: string) => { const [h = 0, m = 0] = hhmm.split(':').map(Number); return h * 60 + m; };
const atMin = (day: Date, min: number) => { const d = new Date(day); d.setHours(0, 0, 0, 0); d.setMinutes(min); return d; };

/** Todos os lembretes de um dia (ordenados). `meals` = quantas refeições o plano tem (4/5/6). */
export function remindersForDay(day: Date, s: ReminderSettings, meals: 4 | 5 | 6): Reminder[] {
  const out: Reminder[] = [];
  const wd = (day.getDay() + 6) % 7;
  if (s.water) {
    const step = Math.max(30, s.waterEveryMin), end = toMin(s.dayEnd);
    for (let m = toMin(s.dayStart) + step; m <= end; m += step) out.push({ at: atMin(day, m), id: `agua-${m}`, title: 'Hora de beber água 💧', body: 'Um copo agora ajuda a bater a meta de hoje.', url: '/' });
  }
  if (s.meals) for (const t of MEAL_SETS[meals]) {
    const time = s.mealTimes[t] ?? MEAL_TIME[t];
    out.push({ at: atMin(day, toMin(time) - s.mealLead), id: `ref-${t}`, title: `${MEAL_LABEL[t]} 🍽️`, body: s.mealLead ? `Daqui a ${s.mealLead} min (${time}). Abra o plano e confira.` : 'Está na hora. Abra o plano e marque quando comer.', url: '/plano' });
  }
  if (s.training && s.trainingDays.includes(wd)) out.push({ at: atMin(day, toMin(s.trainingTime)), id: 'treino', title: 'Hora do treino 💪', body: 'Abra o treino do dia e bora.', url: '/treino' });
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Próximo lembrete depois de `now` (hoje ou nos próximos dias). */
export function nextReminder(now: Date, s: ReminderSettings, meals: 4 | 5 | 6): Reminder | null {
  for (let i = 0; i < 8; i++) {
    const day = new Date(now); day.setDate(day.getDate() + i);
    const hit = remindersForDay(day, s, meals).find(r => r.at.getTime() > now.getTime());
    if (hit) return hit;
  }
  return null;
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window;

export async function registerWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.register('/sw.js'); } catch { return null; }
}

export async function showReminder(r: Pick<Reminder, 'title' | 'body' | 'url' | 'id'>) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  const opts = { body: r.body, icon: '/icons/massafit-192.png', badge: '/icons/massafit-192.png', tag: r.id, data: { url: r.url } };
  try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) { await reg.showNotification(r.title, opts); return true; } } catch { /* cai no fallback */ }
  try { new Notification(r.title, opts); return true; } catch { return false; }
}
