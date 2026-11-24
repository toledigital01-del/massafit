/**
 * Figuras de execução: boneco 2D vetorial (vista lateral ou frontal) com início → fim,
 * músculos trabalhados em vermelho. Tudo calculado por cinemática (sem imagens), então
 * anima em loop e escala para qualquer exercício.
 *
 * Mundo em cm, y para cima, chão em y = 0. O boneco olha para +x.
 */
type V = [number, number];

export type Pose = {
  h: V; // quadril
  t: number; // ângulo do tronco (quadril → ombro), graus
  ua?: number; fa?: number; // braço por ângulos absolutos
  hand?: V; handRel?: V; // ou por alvo (absoluto / relativo ao ombro)
  th?: number; sh?: number; // perna por ângulos absolutos
  foot?: V; // ou por alvo do tornozelo
  foot2?: V; // perna de trás (se diferente)
  ft?: number; // ângulo do pé
  bendA?: 1 | -1; bendL?: 1 | -1; bendL2?: 1 | -1;
};

type SegName = 'torso' | 'uarm' | 'farm' | 'thigh' | 'shin';
export type Hi = { seg: SegName; a: number; b: number; side: 'front' | 'back' | 'mid'; w?: number };
type Joints = { hip: V; sh: V; el: V; wr: V; kn: V; an: V; toe: V; head: V; kn2: V; an2: V; toe2: V; far2: boolean };
type Prop = (j: Joints, e: number) => string;

export type SideFigure = {
  view: 'side';
  a: Pose; b: Pose;
  hi: Hi[];
  hold?: boolean;
  deco?: string; // SVG estático (banco, degrau…)
  props?: Prop[];
  peak?: 'a' | 'b';
};
export type FrontPose = { a: number; eb?: number };
export type FrontFigure = {
  view: 'front';
  a: FrontPose; b: FrontPose;
  hi: ('delt' | 'chest' | 'upback' | 'rear')[];
  props?: ('db' | 'cable' | 'bottle')[];
  peak?: 'a' | 'b';
};
export type Figure = SideFigure | FrontFigure;

const C = { body: '#c9d1de', far: '#8793a6', out: '#0b1020', hi: '#ff4b4b', prop: '#6b7a93', floor: '#2d3646', pack: '#e08a1e', bg: '#111827' };
const LEN = { torso: 52, ua: 28, fa: 26, th: 42, sh: 42, foot: 14 };
const W = { torso: 24, uarm: 10, farm: 8, thigh: 17, shin: 12 };
const rad = (d: number) => (d * Math.PI) / 180;
const dir = (d: number): V => [Math.cos(rad(d)), Math.sin(rad(d))];
const add = (p: V, d: V, l: number): V => [p[0] + d[0] * l, p[1] + d[1] * l];
const lerp = (a: number, b: number, e: number) => a + (b - a) * e;
const lerpV = (a: V, b: V, e: number): V => [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
const f = (n: number) => (Math.round(n * 10) / 10).toString();
const ease = (x: number) => x * x * (3 - 2 * x);

function ik(o: V, t: V, l1: number, l2: number, bend: 1 | -1): { mid: V; end: V } {
  const dx = t[0] - o[0], dy = t[1] - o[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.01);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const ang = base + bend * A;
  const mid: V = [o[0] + l1 * Math.cos(ang), o[1] + l1 * Math.sin(ang)];
  const end: V = [o[0] + d * Math.cos(base), o[1] + d * Math.sin(base)];
  return { mid, end };
}

function mixPose(a: Pose, b: Pose, e: number): Pose {
  const out: Record<string, unknown> = { bendA: a.bendA, bendL: a.bendL, bendL2: a.bendL2 };
  for (const k of ['h', 'hand', 'handRel', 'foot', 'foot2'] as const) {
    const va = a[k], vb = b[k];
    if (va && vb) out[k] = lerpV(va, vb, e); else if (va) out[k] = va;
  }
  for (const k of ['t', 'ua', 'fa', 'th', 'sh', 'ft'] as const) {
    const va = a[k], vb = b[k];
    if (va !== undefined && vb !== undefined) out[k] = lerp(va, vb, e); else if (va !== undefined) out[k] = va;
  }
  return out as Pose;
}

function solve(p: Pose): Joints {
  const hip = p.h;
  const sh = add(hip, dir(p.t), LEN.torso);
  const head = add(sh, dir(p.t), 15);
  let el: V, wr: V;
  const tgt = p.hand ?? (p.handRel ? ([sh[0] + p.handRel[0], sh[1] + p.handRel[1]] as V) : null);
  if (tgt) { const r = ik(sh, tgt, LEN.ua, LEN.fa, p.bendA ?? -1); el = r.mid; wr = r.end; }
  else { el = add(sh, dir(p.ua ?? -90), LEN.ua); wr = add(el, dir(p.fa ?? -90), LEN.fa); }
  let kn: V, an: V;
  if (p.foot) { const r = ik(hip, p.foot, LEN.th, LEN.sh, p.bendL ?? 1); kn = r.mid; an = r.end; }
  else { kn = add(hip, dir(p.th ?? -90), LEN.th); an = add(kn, dir(p.sh ?? -90), LEN.sh); }
  const footAng = p.ft ?? -15;
  const toe = add(an, dir(footAng), LEN.foot);
  let kn2 = kn, an2 = an, toe2 = toe, far2 = false;
  if (p.foot2) { const r = ik(hip, p.foot2, LEN.th, LEN.sh, p.bendL2 ?? p.bendL ?? 1); kn2 = r.mid; an2 = r.end; toe2 = add(an2, dir(footAng), LEN.foot); far2 = true; }
  return { hip, sh, el, wr, kn, an, toe, head, kn2, an2, toe2, far2 };
}

const line = (a: V, b: V, w: number, col: string, op = 1) => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${op < 1 ? ` stroke-opacity="${f(op)}"` : ''}/>`;
const circ = (c: V, r: number, col: string, extra = '') => `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="${col}" ${extra}/>`;

function segPts(j: Joints, s: SegName): [V, V, number] {
  switch (s) {
    case 'torso': return [j.hip, j.sh, W.torso];
    case 'uarm': return [j.sh, j.el, W.uarm];
    case 'farm': return [j.el, j.wr, W.farm];
    case 'thigh': return [j.hip, j.kn, W.thigh];
    default: return [j.kn, j.an, W.shin];
  }
}

function sideSvg(fig: SideFigure, e: number): string {
  const p = mixPose(fig.a, fig.b, e);
  const j = solve(p);
  const farOff: V = [-4, 0];
  const sh = (v: V): V => [v[0] + farOff[0], v[1] + farOff[1]];
  const legs = (kn: V, an: V, toe: V, off: boolean) => {
    const k = off ? sh(kn) : kn, a = off ? sh(an) : an, t = off ? sh(toe) : toe;
    return [[j.hip, k, W.thigh], [k, a, W.shin], [a, t, 7]] as [V, V, number][];
  };
  const farLimbs: [V, V, number][] = [...legs(j.far2 ? j.kn2 : j.kn, j.far2 ? j.an2 : j.an, j.far2 ? j.toe2 : j.toe, true), [sh(j.sh), sh(j.el), W.uarm], [sh(j.el), sh(j.wr), W.farm]];
  const nearLimbs: [V, V, number][] = [[j.hip, j.sh, W.torso], ...legs(j.kn, j.an, j.toe, false), [j.sh, j.el, W.uarm], [j.el, j.wr, W.farm]];
  const draw = (limbs: [V, V, number][], col: string, head?: V) => {
    let o = '', i = '';
    for (const [a, b, w] of limbs) { o += line(a, b, w + 3, C.out); i += line(a, b, w, col); }
    if (head) { o += circ(head, 13, C.out); i += circ(head, 10, col); }
    return o + i;
  };
  const pulse = fig.hold ? 0.55 + 0.4 * Math.abs(Math.sin(e * Math.PI)) : 0.45 + 0.5 * ((fig.peak ?? 'b') === 'b' ? e : 1 - e);
  let hi = '';
  for (const h of fig.hi) {
    const [a, b, w] = segPts(j, h.seg);
    const d: V = [b[0] - a[0], b[1] - a[1]];
    const len = Math.hypot(d[0], d[1]) || 1;
    const u: V = [d[0] / len, d[1] / len];
    // frente anatômica: tronco usa (dy,-dx); membros usam (-dy,dx)
    const nrm: V = h.seg === 'torso' ? [u[1], -u[0]] : [-u[1], u[0]];
    const off = h.side === 'mid' ? 0 : (h.side === 'front' ? 1 : -1) * w * 0.22;
    const p1: V = [a[0] + d[0] * h.a + nrm[0] * off, a[1] + d[1] * h.a + nrm[1] * off];
    const p2: V = [a[0] + d[0] * h.b + nrm[0] * off, a[1] + d[1] * h.b + nrm[1] * off];
    hi += line(p1, p2, h.w ?? w * 0.62, C.hi, pulse);
  }
  const props = (fig.props ?? []).map(fn => fn(j, e)).join('');
  const floor = `<line x1="-140" y1="-1" x2="140" y2="-1" stroke="${C.floor}" stroke-width="2"/>`;
  return `<g transform="scale(1,-1)">${floor}${fig.deco ?? ''}${draw(farLimbs, C.far)}${draw(nearLimbs, C.body, j.head)}${hi}${props}</g>`;
}

function frontSvg(fig: FrontFigure, e: number): string {
  const a = lerp(fig.a.a, fig.b.a, e), eb = lerp(fig.a.eb ?? 0, fig.b.eb ?? 0, e);
  const SY = 142, HY = 84;
  const out = (s: 1 | -1, ang: number): V => [s * Math.sin(rad(ang)), -Math.cos(rad(ang))];
  const arms = ([1, -1] as const).map(s => {
    const sp: V = [s * 19, SY];
    const el = add(sp, out(s, a), LEN.ua);
    const wr = add(el, out(s, a - eb), LEN.fa);
    return { s, sp, el, wr };
  });
  const pulse = 0.45 + 0.5 * ((fig.peak ?? 'b') === 'b' ? e : 1 - e);
  let body = '';
  const parts: [V, V, number][] = [
    [[-10, HY], [-14, 4], 15], [[10, HY], [14, 4], 15], [[0, HY + 4], [0, SY - 2], 34],
    ...arms.flatMap(r => [[r.sp, r.el, 10], [r.el, r.wr, 8]] as [V, V, number][]),
  ];
  for (const [p, q, w] of parts) body += line(p, q, w + 3, C.out);
  for (const [p, q, w] of parts) body += line(p, q, w, C.body);
  body += circ([0, 166], 13, C.out) + circ([0, 166], 10, C.body);
  let hi = '';
  for (const h of fig.hi) {
    if (h.startsWith('delt') || h === 'rear') for (const r of arms) hi += circ(r.sp, 8, C.hi, `fill-opacity="${f(pulse)}"`) + line(r.sp, add(r.sp, [(r.el[0] - r.sp[0]) / LEN.ua, (r.el[1] - r.sp[1]) / LEN.ua], 1), 1, C.hi, 0) + line(r.sp, lerpV(r.sp, r.el, 0.4), 10, C.hi, pulse);
    if (h === 'chest') hi += line([-9, SY - 10], [9, SY - 10], 14, C.hi, pulse);
    if (h === 'upback' || h === 'rear') hi += line([-12, SY - 6], [12, SY - 6], 12, C.hi, pulse);
  }
  let props = '';
  for (const pr of fig.props ?? []) {
    if (pr === 'db') for (const r of arms) props += line([r.wr[0] - 6, r.wr[1]], [r.wr[0] + 6, r.wr[1]], 6, C.prop) + line([r.wr[0] - 4, r.wr[1]], [r.wr[0] + 4, r.wr[1]], 12, C.prop);
    if (pr === 'bottle') for (const r of arms) props += line(r.wr, [r.wr[0], r.wr[1] - 13], 9, '#4aa3df');
    if (pr === 'cable') for (const r of arms) props += `<polyline points="${f(r.s * 70)},196 ${f(r.s * 70)},170 ${f(r.wr[0])},${f(r.wr[1])}" fill="none" stroke="${C.prop}" stroke-width="1.5"/>` + circ(r.wr, 3, C.pack);
  }
  const floor = `<line x1="-140" y1="-1" x2="140" y2="-1" stroke="${C.floor}" stroke-width="2"/>`;
  return `<g transform="scale(1,-1)">${floor}${body}${hi}${props}</g>`;
}

export const VIEWBOX = '-125 -205 250 219';

/** SVG completo no instante e (0 = início, 1 = fim). */
export function renderFigure(slug: string, e: number): string {
  const fig = FIGURES[slug];
  if (!fig) return '';
  const inner = fig.view === 'side' ? sideSvg(fig, e) : frontSvg(fig, e);
  return `<rect x="-125" y="-205" width="250" height="219" rx="10" fill="${C.bg}"/>${inner}`;
}

/** Posição ao longo do ciclo (ms) → e com pausas no início e no fim, ida e volta suaves. */
export function cycleE(ms: number, period = 3600): number {
  const x = (ms % period) / period; // 0..1
  if (x < 0.15) return 0;
  if (x < 0.5) return ease((x - 0.15) / 0.35);
  if (x < 0.65) return 1;
  return 1 - ease((x - 0.65) / 0.35);
}

// ---------------------------------------------------------------- props e decoração
const rect = (x: number, y: number, w: number, h: number, col = C.prop) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${col}"/>`;
const bench = (x1: number, x2: number, y = 44) => rect(x1, y - 6, x2 - x1, 6) + line([x1 + 12, 0], [x1 + 12, y - 6], 3, C.prop) + line([x2 - 12, 0], [x2 - 12, y - 6], 3, C.prop);
const bar = (pick: (j: Joints) => V): Prop => j => { const p = pick(j); return line([p[0] - 1, p[1] - 22], [p[0] - 1, p[1] + 22], 3, C.prop) + rect(p[0] - 5, p[1] - 22, 8, 8) + rect(p[0] - 5, p[1] + 14, 8, 8); };
const dbell: Prop = j => `<g>${line([j.wr[0] - 5, j.wr[1]], [j.wr[0] + 5, j.wr[1]], 5, C.prop)}${rect(j.wr[0] - 8, j.wr[1] - 5, 5, 10)}${rect(j.wr[0] + 3, j.wr[1] - 5, 5, 10)}</g>`;
const barbell: Prop = bar(j => j.wr);
const pack: Prop = j => `<rect x="${f(j.wr[0] - 9)}" y="${f(j.wr[1] - 20)}" width="16" height="22" rx="5" fill="${C.pack}" stroke="${C.out}" stroke-width="1.5"/>`;
const bottle: Prop = j => line(j.wr, [j.wr[0], j.wr[1] - 14], 8, '#4aa3df') + line([j.wr[0], j.wr[1] - 14], [j.wr[0], j.wr[1] - 17], 4, '#fff');
const cable = (to: V): Prop => j => `<line x1="${to[0]}" y1="${to[1]}" x2="${f(j.wr[0])}" y2="${f(j.wr[1])}" stroke="${C.prop}" stroke-width="1.5"/>`;
const barOnBack: Prop = j => bar(jj => [jj.sh[0] - 5, jj.sh[1] + 2])(j, 0);
const chairs = (x: number, y: number) => rect(x - 14, y - 4, 28, 4) + line([x - 10, 0], [x - 10, y - 4], 3, C.prop) + line([x + 10, 0], [x + 10, y - 4], 3, C.prop);

const STAND = { th: -90, sh: -90 };
const stand = (hx = 0, hy = 88): Pose => ({ h: [hx, hy], t: 90, foot: [0, 4], ...{ ua: -90, fa: -90 } });
/** Corpo reto (prancha/flexão): ombro e ângulo do corpo; pernas alinhadas. */
const body = (sx: number, sy: number, th: number): Pick<Pose, 'h' | 't' | 'th' | 'sh' | 'ft'> => {
  const hx = sx - LEN.torso * Math.cos(rad(th)), hy = sy - LEN.torso * Math.sin(rad(th));
  return { h: [hx, hy], t: th, th: th + 180, sh: th + 180, ft: -75 };
};
void STAND;

// ---------------------------------------------------------------- exercícios
export const FIGURES: Record<string, Figure> = {
  // ───────── academia
  'supino-reto': {
    view: 'side',
    a: { h: [34, 52], t: 180, th: 15, sh: -80, ua: 90, fa: 90 },
    b: { h: [34, 52], t: 180, th: 15, sh: -80, ua: -12, fa: 90 },
    hi: [{ seg: 'torso', a: 0.55, b: 0.95, side: 'front', w: 15 }, { seg: 'uarm', a: 0.1, b: 0.95, side: 'back' }],
    deco: bench(-60, 62), props: [barbell], peak: 'a',
  },
  'supino-inclinado': {
    view: 'side',
    a: { h: [30, 54], t: 138, th: 20, sh: -80, ua: 48, fa: 48 },
    b: { h: [30, 54], t: 138, th: 20, sh: -80, ua: -30, fa: 48 },
    hi: [{ seg: 'torso', a: 0.6, b: 0.95, side: 'front', w: 15 }, { seg: 'uarm', a: 0.1, b: 0.95, side: 'back' }],
    deco: bench(-30, 60), props: [barbell], peak: 'a',
  },
  crossover: { view: 'front', a: { a: 125, eb: 10 }, b: { a: 12, eb: 0 }, hi: ['chest', 'delt'], props: ['cable'], peak: 'b' },
  'triceps-polia': {
    view: 'side',
    a: { h: [0, 88], t: 92, foot: [0, 4], ua: -92, fa: 5 },
    b: { h: [0, 88], t: 92, foot: [0, 4], ua: -92, fa: -85 },
    hi: [{ seg: 'uarm', a: 0.05, b: 0.95, side: 'back', w: 8 }, { seg: 'farm', a: 0.0, b: 0.6, side: 'back', w: 6 }],
    props: [cable([-4, 195]), j => rect(j.wr[0] - 6, j.wr[1] - 2, 12, 4, C.pack)], peak: 'b',
  },
  'puxada-frontal': {
    view: 'side',
    a: { h: [0, 50], t: 100, th: 5, sh: -88, ua: 78, fa: 82 },
    b: { h: [0, 50], t: 100, th: 5, sh: -88, ua: -72, fa: 80 },
    hi: [{ seg: 'torso', a: 0.35, b: 0.95, side: 'back', w: 18 }, { seg: 'uarm', a: 0.1, b: 0.9, side: 'front', w: 7 }],
    deco: rect(-22, 44, 44, 6) + rect(-45, 50, 3, 3, C.prop), props: [j => line([j.wr[0], 196], [j.wr[0], j.wr[1]], 1.5, C.prop) + line([j.wr[0] - 20, j.wr[1]], [j.wr[0] + 20, j.wr[1]], 4, C.prop)], peak: 'b',
  },
  'remada-curvada': {
    view: 'side',
    a: { h: [-8, 86], t: 22, th: -68, sh: -102, ua: -90, fa: -90 },
    b: { h: [-8, 86], t: 22, th: -68, sh: -102, ua: -155, fa: -75 },
    hi: [{ seg: 'torso', a: 0.35, b: 0.95, side: 'back', w: 18 }, { seg: 'uarm', a: 0.1, b: 0.9, side: 'front', w: 7 }],
    props: [barbell], peak: 'b',
  },
  'remada-baixa': {
    view: 'side',
    a: { h: [0, 14], t: 98, th: 8, sh: -12, ua: 5, fa: 5 },
    b: { h: [0, 14], t: 98, th: 8, sh: -12, ua: -125, fa: 5 },
    hi: [{ seg: 'torso', a: 0.35, b: 0.95, side: 'back', w: 18 }, { seg: 'uarm', a: 0.1, b: 0.9, side: 'front', w: 7 }],
    deco: rect(70, 0, 6, 40), props: [cable([75, 28]), j => line([j.wr[0] - 1, j.wr[1] - 8], [j.wr[0] - 1, j.wr[1] + 8], 4, C.prop)], peak: 'b',
  },
  'rosca-direta': {
    view: 'side',
    a: { ...stand(), ua: -92, fa: -88 }, b: { ...stand(), ua: -92, fa: 70 },
    hi: [{ seg: 'uarm', a: 0.05, b: 0.95, side: 'front', w: 8 }],
    props: [barbell], peak: 'b',
  },
  'rosca-martelo': {
    view: 'side',
    a: { ...stand(), ua: -92, fa: -88 }, b: { ...stand(), ua: -92, fa: 70 },
    hi: [{ seg: 'uarm', a: 0.05, b: 0.95, side: 'front', w: 8 }, { seg: 'farm', a: 0.1, b: 0.8, side: 'front', w: 6 }],
    props: [dbell], peak: 'b',
  },
  agachamento: {
    view: 'side',
    a: { ...stand(), handRel: [-6, 6], bendA: -1 },
    b: { h: [-34, 50], t: 52, foot: [0, 4], handRel: [-6, 6], bendA: -1, bendL: 1 },
    hi: [{ seg: 'thigh', a: 0.05, b: 0.95, side: 'front' }, { seg: 'thigh', a: 0.0, b: 0.4, side: 'back', w: 20 }],
    props: [barOnBack], peak: 'b',
  },
  'leg-press': {
    view: 'side',
    a: { h: [-45, 40], t: 128, th: 80, sh: -25, ua: 40, fa: 40 },
    b: { h: [-45, 40], t: 128, th: 42, sh: 42, ua: 40, fa: 40 },
    hi: [{ seg: 'thigh', a: 0.05, b: 0.95, side: 'front' }, { seg: 'thigh', a: 0.0, b: 0.4, side: 'back', w: 20 }],
    deco: line([-95, 8], [-8, 98], 4, C.prop), props: [j => line([j.an[0] - 14, j.an[1] + 18], [j.an[0] + 14, j.an[1] - 18], 5, C.prop)], peak: 'b',
  },
  'cadeira-extensora': {
    view: 'side',
    a: { h: [-5, 50], t: 98, th: 5, sh: -90, ua: -80, fa: -20 },
    b: { h: [-5, 50], t: 98, th: 5, sh: 2, ua: -80, fa: -20 },
    hi: [{ seg: 'thigh', a: 0.05, b: 0.95, side: 'front', w: 14 }],
    deco: rect(-25, 44, 48, 6) + rect(-28, 50, 4, 50), props: [j => line([j.an[0] - 3, j.an[1] - 6], [j.an[0] - 3, j.an[1] + 6], 7, C.prop)], peak: 'b',
  },
  'mesa-flexora': {
    view: 'side',
    a: { h: [0, 22], t: 2, th: 182, sh: 182, ua: 0, fa: 0, ft: 0 },
    b: { h: [0, 22], t: 2, th: 182, sh: 92, ua: 0, fa: 0, ft: 0 },
    hi: [{ seg: 'thigh', a: 0.05, b: 0.95, side: 'back', w: 14 }, { seg: 'shin', a: 0.0, b: 0.35, side: 'back', w: 9 }],
    deco: bench(-90, 62, 14), peak: 'b',
  },
  panturrilha: {
    view: 'side',
    a: { ...stand(), ua: -92, fa: -88 },
    b: { h: [0, 96], t: 90, foot: [0, 12], ft: -40, ua: -92, fa: -88 },
    hi: [{ seg: 'shin', a: 0.05, b: 0.65, side: 'back', w: 12 }], peak: 'b',
  },
  desenvolvimento: {
    view: 'side',
    a: { ...stand(), ua: -75, fa: 85 }, b: { ...stand(), ua: 88, fa: 90 },
    hi: [{ seg: 'uarm', a: 0.0, b: 0.5, side: 'mid', w: 12 }, { seg: 'torso', a: 0.8, b: 1.0, side: 'mid', w: 12 }],
    props: [dbell], peak: 'b',
  },
  'elevacao-lateral': { view: 'front', a: { a: 4, eb: 0 }, b: { a: 88, eb: 8 }, hi: ['delt'], props: ['db'], peak: 'b' },
  'crucifixo-inverso': { view: 'front', a: { a: 6, eb: 0 }, b: { a: 85, eb: 8 }, hi: ['rear'], props: ['db'], peak: 'b' },
  prancha: {
    view: 'side',
    a: { ...body(52, 30, 4), ua: -90, fa: 0, ft: -75 }, b: { ...body(52, 30, 4), ua: -90, fa: 0, ft: -75 },
    hi: [{ seg: 'torso', a: 0.0, b: 1.0, side: 'front', w: 14 }, { seg: 'thigh', a: 0.0, b: 0.5, side: 'front', w: 10 }],
    hold: true,
  },

  // ───────── em casa
  flexao: {
    view: 'side',
    a: { ...body(48, 56, 17), hand: [52, 0], bendA: -1 }, b: { ...body(50, 18, 7), hand: [52, 0], bendA: -1 },
    hi: [{ seg: 'torso', a: 0.55, b: 1.0, side: 'front', w: 14 }, { seg: 'uarm', a: 0.1, b: 0.95, side: 'back', w: 7 }], peak: 'b',
  },
  'flexao-pes-elevados': {
    view: 'side',
    a: { ...body(48, 62, 14), hand: [52, 0], bendA: -1 }, b: { ...body(50, 24, 5), hand: [52, 0], bendA: -1 },
    hi: [{ seg: 'torso', a: 0.55, b: 1.0, side: 'front', w: 14 }, { seg: 'uarm', a: 0.1, b: 0.95, side: 'back', w: 7 }],
    deco: chairs(-88, 42), peak: 'b',
  },
  'flexao-pike': {
    view: 'side',
    a: { h: [-8, 74], t: -36, foot: [-48, 4], hand: [62, 0], bendA: 1, bendL: 1, ft: -60 },
    b: { h: [6, 64], t: -56, foot: [-48, 4], hand: [62, 0], bendA: 1, bendL: 1, ft: -60 },
    hi: [{ seg: 'torso', a: 0.65, b: 1.0, side: 'mid', w: 14 }, { seg: 'uarm', a: 0.0, b: 0.6, side: 'mid', w: 10 }], peak: 'b',
  },
  'triceps-banco': {
    view: 'side',
    a: { h: [12, 48], t: 96, hand: [-6, 44], bendA: -1, foot: [64, 2], bendL: 1 },
    b: { h: [12, 18], t: 96, hand: [-6, 44], bendA: -1, foot: [64, 2], bendL: 1 },
    hi: [{ seg: 'uarm', a: 0.05, b: 0.95, side: 'back', w: 9 }],
    deco: rect(-40, 38, 40, 6) + line([-34, 0], [-34, 38], 3, C.prop) + line([-6, 0], [-6, 38], 3, C.prop), peak: 'b',
  },
  'remada-invertida': {
    view: 'side',
    a: { ...body(40, 33, 11), hand: [40, 88], bendA: 1 }, b: { ...body(38, 76, 30), hand: [40, 88], bendA: 1 },
    hi: [{ seg: 'torso', a: 0.35, b: 0.95, side: 'back', w: 18 }, { seg: 'uarm', a: 0.1, b: 0.9, side: 'front', w: 7 }],
    deco: line([40, 0], [40, 90], 3, C.prop) + line([34, 88], [46, 88], 4, C.prop) + rect(-5, 84, 0, 0), peak: 'b',
  },
  'remada-mochila': {
    view: 'side',
    a: { h: [-8, 86], t: 22, th: -68, sh: -102, ua: -90, fa: -90 },
    b: { h: [-8, 86], t: 22, th: -68, sh: -102, ua: -155, fa: -75 },
    hi: [{ seg: 'torso', a: 0.35, b: 0.95, side: 'back', w: 18 }, { seg: 'uarm', a: 0.1, b: 0.9, side: 'front', w: 7 }],
    props: [j => pack({ ...j, wr: [j.wr[0], j.wr[1] - 12] }, 0)], peak: 'b',
  },
  superman: {
    view: 'side',
    a: { h: [-8, 12], t: 0, th: 180, sh: 180, ua: 4, fa: 4, ft: -75 },
    b: { h: [-8, 12], t: 14, th: 162, sh: 160, ua: 28, fa: 28, ft: -75 },
    hi: [{ seg: 'torso', a: 0.0, b: 0.6, side: 'back', w: 14 }, { seg: 'thigh', a: 0.0, b: 0.6, side: 'back', w: 16 }], peak: 'b',
  },
  'rosca-mochila': {
    view: 'side',
    a: { ...stand(), ua: -92, fa: -88 }, b: { ...stand(), ua: -92, fa: 70 },
    hi: [{ seg: 'uarm', a: 0.05, b: 0.95, side: 'front', w: 8 }],
    props: [j => pack({ ...j, wr: [j.wr[0] + 2, j.wr[1] - 4] }, 0)], peak: 'b',
  },
  'agachamento-mochila': {
    view: 'side',
    a: { ...stand(), handRel: [16, -16], bendA: -1 },
    b: { h: [-34, 50], t: 52, foot: [0, 4], handRel: [16, -16], bendA: -1, bendL: 1 },
    hi: [{ seg: 'thigh', a: 0.05, b: 0.95, side: 'front' }, { seg: 'thigh', a: 0.0, b: 0.4, side: 'back', w: 20 }],
    props: [j => pack({ ...j, wr: [j.wr[0] + 4, j.wr[1] + 8] }, 0)], peak: 'b',
  },
  'agachamento-bulgaro': {
    view: 'side',
    a: { h: [2, 84], t: 90, foot: [34, 4], foot2: [-50, 50], bendL: 1, bendL2: 1, ua: -90, fa: -90 },
    b: { h: [-4, 52], t: 82, foot: [34, 4], foot2: [-50, 50], bendL: 1, bendL2: 1, ua: -90, fa: -90 },
    hi: [{ seg: 'thigh', a: 0.05, b: 0.95, side: 'front' }, { seg: 'thigh', a: 0.0, b: 0.4, side: 'back', w: 20 }],
    deco: chairs(-56, 48), peak: 'b',
  },
  afundo: {
    view: 'side',
    a: { h: [0, 88], t: 90, foot: [4, 4], foot2: [-4, 4], bendL: 1, bendL2: 1, ua: -90, fa: -90 },
    b: { h: [-2, 50], t: 88, foot: [38, 4], foot2: [-42, 16], bendL: 1, bendL2: 1, ua: -90, fa: -90, ft: -50 },
    hi: [{ seg: 'thigh', a: 0.05, b: 0.95, side: 'front' }, { seg: 'thigh', a: 0.0, b: 0.4, side: 'back', w: 20 }], peak: 'b',
  },
  'ponte-gluteo': {
    view: 'side',
    a: { h: [0, 12], t: 180, foot: [42, 3], bendL: 1, ua: -4, fa: -4, ft: 0 },
    b: { h: [0, 46], t: 212, foot: [42, 3], bendL: 1, ua: -4, fa: -4, ft: 0 },
    hi: [{ seg: 'thigh', a: 0.0, b: 0.5, side: 'back', w: 22 }, { seg: 'thigh', a: 0.4, b: 0.95, side: 'back', w: 12 }], peak: 'b',
  },
  'panturrilha-degrau': {
    view: 'side',
    a: { h: [0, 94], t: 90, foot: [0, 10], ft: 5, ua: -92, fa: -88 },
    b: { h: [0, 106], t: 90, foot: [0, 22], ft: -40, ua: -92, fa: -88 },
    hi: [{ seg: 'shin', a: 0.05, b: 0.65, side: 'back', w: 12 }],
    deco: rect(-16, 0, 44, 8), peak: 'b',
  },
  'elevacao-lateral-garrafa': { view: 'front', a: { a: 4, eb: 0 }, b: { a: 88, eb: 8 }, hi: ['delt'], props: ['bottle'], peak: 'b' },
  'crucifixo-inverso-garrafa': { view: 'front', a: { a: 6, eb: 0 }, b: { a: 85, eb: 8 }, hi: ['rear'], props: ['bottle'], peak: 'b' },
  'prancha-lateral': {
    view: 'side',
    a: { ...body(52, 30, 4), ua: -90, fa: 0, ft: -75 }, b: { ...body(52, 30, 4), ua: -90, fa: 0, ft: -75 },
    hi: [{ seg: 'torso', a: 0.0, b: 1.0, side: 'mid', w: 14 }, { seg: 'thigh', a: 0.0, b: 0.5, side: 'mid', w: 10 }],
    hold: true,
  },
  'elevacao-pernas': {
    view: 'side',
    a: { h: [0, 12], t: 180, th: 3, sh: 3, ua: -4, fa: -4, ft: 70 },
    b: { h: [0, 12], t: 180, th: 84, sh: 84, ua: -4, fa: -4, ft: 160 },
    hi: [{ seg: 'torso', a: 0.0, b: 0.45, side: 'front', w: 16 }, { seg: 'thigh', a: 0.05, b: 0.6, side: 'front', w: 10 }], peak: 'b',
  },
};

export const hasFigure = (slug: string) => slug in FIGURES;
