import { workoutPlan, type Exercise } from './workout';
import { homePlan } from './workout-home';

/** Alternativas equivalentes (mesmo grupo muscular) para quando o aparelho está ocupado ou falta equipamento. */
export const ALTERNATIVES: Record<string, string[]> = {
  'supino-reto': ['supino-inclinado', 'flexao'], 'supino-inclinado': ['supino-reto', 'flexao-pes-elevados'], crossover: ['flexao', 'supino-inclinado'],
  'triceps-polia': ['triceps-banco', 'flexao'], 'puxada-frontal': ['remada-baixa', 'remada-invertida'], 'remada-curvada': ['remada-baixa', 'remada-mochila'],
  'remada-baixa': ['remada-curvada', 'remada-invertida'], 'rosca-direta': ['rosca-martelo', 'rosca-mochila'], 'rosca-martelo': ['rosca-direta', 'rosca-mochila'],
  agachamento: ['leg-press', 'agachamento-mochila'], 'leg-press': ['agachamento', 'agachamento-bulgaro'], 'cadeira-extensora': ['afundo', 'agachamento-bulgaro'],
  'mesa-flexora': ['ponte-gluteo', 'afundo'], panturrilha: ['panturrilha-degrau'], desenvolvimento: ['elevacao-lateral', 'flexao-pike'],
  'elevacao-lateral': ['elevacao-lateral-garrafa', 'desenvolvimento'], 'crucifixo-inverso': ['crucifixo-inverso-garrafa', 'remada-baixa'], prancha: ['prancha-lateral', 'elevacao-pernas'],
  flexao: ['supino-reto', 'flexao-pes-elevados'], 'flexao-pes-elevados': ['supino-inclinado', 'flexao'], 'flexao-pike': ['desenvolvimento', 'elevacao-lateral-garrafa'],
  'triceps-banco': ['triceps-polia', 'flexao'], 'remada-invertida': ['puxada-frontal', 'remada-mochila'], 'remada-mochila': ['remada-curvada', 'remada-invertida'],
  superman: ['crucifixo-inverso-garrafa', 'remada-mochila'], 'rosca-mochila': ['rosca-direta', 'rosca-martelo'], 'agachamento-mochila': ['agachamento', 'afundo'],
  'agachamento-bulgaro': ['leg-press', 'afundo'], afundo: ['agachamento-bulgaro', 'cadeira-extensora'], 'ponte-gluteo': ['mesa-flexora', 'afundo'],
  'panturrilha-degrau': ['panturrilha'], 'elevacao-lateral-garrafa': ['elevacao-lateral'], 'crucifixo-inverso-garrafa': ['crucifixo-inverso'],
  'prancha-lateral': ['prancha', 'elevacao-pernas'], 'elevacao-pernas': ['prancha', 'prancha-lateral'],
};

const all = [...workoutPlan, ...homePlan].flatMap(d => d.exercises);
export const exerciseBySlug = (slug: string): Exercise | undefined => all.find(e => e.slug === slug);
export const alternativesFor = (slug: string): Exercise[] => (ALTERNATIVES[slug] ?? []).flatMap(s => { const e = exerciseBySlug(s); return e ? [e] : []; });
