export const FIELDS = [
  ['waist', 'Cintura'], ['chest', 'Peito'], ['hip', 'Quadril'], ['arm', 'Braço'], ['thigh', 'Coxa'], ['calf', 'Panturrilha'],
] as const;
export type Field = (typeof FIELDS)[number][0];
export type Measure = { day: string } & Partial<Record<Field, number | null>>;
export type Pose = 'frente' | 'lado' | 'costas';
export const POSES: Pose[] = ['frente', 'lado', 'costas'];

/** Variação (cm) entre a primeira e a última medida informada de cada região. */
export function measurementDeltas(rows: Measure[]): Partial<Record<Field, { first: number; last: number; delta: number }>> {
  const sorted = [...rows].sort((a, b) => a.day.localeCompare(b.day));
  const out: Partial<Record<Field, { first: number; last: number; delta: number }>> = {};
  for (const [k] of FIELDS) {
    const vals = sorted.map(r => r[k]).filter((v): v is number => typeof v === 'number');
    if (vals.length >= 2) { const first = vals[0]!, last = vals.at(-1)!; out[k] = { first, last, delta: Math.round((last - first) * 10) / 10 }; }
  }
  return out;
}

/** Caminho no bucket privado: <user_id>/<dia>-<pose>.jpg (a política de storage exige a pasta do usuário). */
export const photoPath = (userId: string, day: string, pose: Pose) => `${userId}/${day}-${pose}.jpg`;
