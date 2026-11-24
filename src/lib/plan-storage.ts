/** Persistência local (neste aparelho) das escolhas do plano alimentar. */
import { EMPTY_STATE, NO_PREFS, type Prefs, type PlanState } from './plan-engine';

export type PlanSettings = { meals: 4 | 5 | 6; shift: boolean };
export type Favorite = { id: string; name: string; meal: string; items: { name: string; grams: number; calories: number; protein: number; carbs: number; fat: number }[] };
export const DEFAULT_SETTINGS: PlanSettings = { meals: 5, shift: false };

const K = { prefs: 'massafit-plan-prefs', settings: 'massafit-plan-settings', state: 'massafit-plan-state', fav: 'massafit-plan-favorites' };

function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignora */ } }

export const loadPrefs = (): Prefs => read<Prefs>(K.prefs, NO_PREFS);
export const savePrefs = (p: Prefs) => write(K.prefs, p);
export const loadSettings = (): PlanSettings => read<PlanSettings>(K.settings, DEFAULT_SETTINGS);
export const saveSettings = (s: PlanSettings) => write(K.settings, s);
/** Trocas e cardápios escolhidos, guardados por dia da semana (0 = segunda). */
export const loadStates = (): Record<string, PlanState> => { try { return JSON.parse(localStorage.getItem(K.state) ?? '{}') as Record<string, PlanState>; } catch { return {}; } };
export const saveStates = (s: Record<string, PlanState>) => write(K.state, s);
export const stateFor = (all: Record<string, PlanState>, weekday: number): PlanState => all[String(weekday)] ?? EMPTY_STATE;
export const loadFavorites = (): Favorite[] => { try { const v = JSON.parse(localStorage.getItem(K.fav) ?? '[]'); return Array.isArray(v) ? (v as Favorite[]) : []; } catch { return []; } };
export const saveFavorites = (f: Favorite[]) => write(K.fav, f);
