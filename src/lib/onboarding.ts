import { calculateGoals, calorieFloor, type Objective, type ProfileInput } from './nutrition';

export type Answers = { name: string; objective: Objective; sex: 'male' | 'female'; age: number; height: number; weight: number; target_weight: number; trainingDays: number; activeJob: boolean; shifts: boolean };
export const ACTIVITY_LEVELS = [1.2, 1.375, 1.55, 1.725, 1.9] as const;

/** Fator de atividade pela rotina: dias de treino na semana, subindo um nível se o trabalho for fisicamente ativo. */
export function activityFactor(trainingDays: number, activeJob: boolean): number {
  const base = trainingDays <= 1 ? 0 : trainingDays <= 3 ? 1 : trainingDays <= 5 ? 2 : 3;
  return ACTIVITY_LEVELS[Math.min(ACTIVITY_LEVELS.length - 1, base + (activeJob ? 1 : 0))]!;
}

const half = (n: number) => Math.round(n * 2) / 2;
/** Peso-meta sugerido: ganho moderado ou perda moderada; quem mantém fica no peso atual. */
export function suggestedTarget(objective: Objective, weight: number): number {
  if (objective === 'gain') return half(weight + Math.max(2, weight * 0.07));
  if (objective === 'lose') return half(weight - Math.max(3, weight * 0.08));
  return weight;
}

export const PACES: Record<Objective, { label: string; adj: number }[]> = {
  gain: [{ label: 'Suave', adj: 250 }, { label: 'Moderado', adj: 350 }, { label: 'Rápido', adj: 500 }],
  lose: [{ label: 'Suave', adj: -250 }, { label: 'Moderado', adj: -400 }, { label: 'Rápido', adj: -600 }],
  maintain: [{ label: 'Manter', adj: 0 }],
};
export const defaultPace = (o: Objective) => PACES[o][1]?.adj ?? 0;

export function toProfile(a: Answers): ProfileInput {
  return { name: a.name.trim(), sex: a.sex, age: a.age, height: a.height, weight: a.weight, target_weight: a.target_weight, activity: activityFactor(a.trainingDays, a.activeJob), training_days: a.trainingDays, shifts: a.shifts };
}

const bmi = (kg: number, cm: number) => kg / ((cm / 100) ** 2);
const between = (n: number, lo: number, hi: number) => Number.isFinite(n) && n >= lo && n <= hi;

/** Mensagem de erro do passo (0 objetivo, 1 sobre você, 2 corpo, 3 rotina) ou null. */
export function stepError(step: number, a: Answers): string | null {
  if (step === 1) {
    if (!a.name.trim()) return 'Como podemos te chamar?';
    if (!between(a.age, 18, 100)) return 'O app é para maiores de 18 anos (idade entre 18 e 100).';
  }
  if (step === 2) {
    if (!between(a.height, 100, 230)) return 'Informe a altura em centímetros (100 a 230).';
    if (!between(a.weight, 30, 300)) return 'Informe o peso atual em kg (30 a 300).';
    if (!between(a.target_weight, 30, 300)) return 'Informe o peso-meta em kg (30 a 300).';
    if (a.objective === 'lose' && a.target_weight >= a.weight) return 'Para emagrecer, o peso-meta precisa ser menor que o atual.';
    if (a.objective === 'gain' && a.target_weight <= a.weight) return 'Para ganhar massa, o peso-meta precisa ser maior que o atual.';
    if (a.objective === 'lose' && bmi(a.target_weight, a.height) < 18.5) return 'Esse peso-meta fica abaixo da faixa saudável (IMC menor que 18,5). Escolha um peso maior ou fale com um profissional.';
  }
  if (step === 3 && !between(a.trainingDays, 0, 7)) return 'Treinos por semana: de 0 a 7.';
  return null;
}

/** Resultado mostrado no fim do passo a passo. */
export function preview(a: Answers, adj: number) {
  const profile = toProfile(a);
  const g = calculateGoals(profile, a.objective === 'maintain' ? 0 : adj);
  return { profile, goals: g, atFloor: g.calories === calorieFloor(a.sex) && g.expenditure + g.surplus < g.calories };
}

export type Guest = { profile: ProfileInput; adj: number };
const GUEST_KEY = 'massafit-guest-profile';
const SKIP_KEY = 'massafit-onboarding-skipped';
const isGuest = (x: unknown): x is Guest => {
  const g = x as Guest; const p = g?.profile;
  return !!p && typeof p.name === 'string' && (p.sex === 'male' || p.sex === 'female') && between(p.age, 18, 100) && between(p.height, 100, 230) && between(p.weight, 30, 300) && between(p.target_weight, 30, 300) && between(p.activity, 1, 2) && between(p.training_days, 0, 7) && typeof p.shifts === 'boolean' && between(g.adj, -750, 500);
};
export function loadGuest(): Guest | null { try { const v: unknown = JSON.parse(localStorage.getItem(GUEST_KEY) ?? 'null'); return isGuest(v) ? v : null; } catch { return null; } }
export function saveGuest(g: Guest) { try { localStorage.setItem(GUEST_KEY, JSON.stringify(g)); localStorage.removeItem(SKIP_KEY); } catch { /* sem armazenamento */ } }
export function clearGuest() { try { localStorage.removeItem(GUEST_KEY); } catch { /* ignora */ } }
export const wasSkipped = () => { try { return localStorage.getItem(SKIP_KEY) === '1'; } catch { return false; } };
export const markSkipped = () => { try { localStorage.setItem(SKIP_KEY, '1'); } catch { /* ignora */ } };

export const answersFrom = (p: Partial<ProfileInput> | undefined): Answers => ({
  name: p?.name ?? '', objective: 'gain', sex: p?.sex === 'female' ? 'female' : 'male', age: p?.age ?? 30, height: p?.height ?? 170, weight: p?.weight ?? 70, target_weight: p?.target_weight ?? 74,
  trainingDays: p?.training_days ?? 3, activeJob: false, shifts: p?.shifts ?? false,
});
