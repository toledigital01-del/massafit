import { homePlan } from './workout-home';
export type Exercise = { slug: string; name: string; muscles: string; sets: number; repMin: number; repMax: number; rest: number; step: number; timed?: boolean; cues: string[]; mistakes: string[]; /** treino em casa: material necessário, exercício com o peso do corpo e variações */ equip?: string; bodyweight?: boolean; perSide?: boolean; easier?: string; harder?: string };
export type WorkoutMode = 'gym' | 'home';
export type WorkoutDay = { key: 'A'|'B'|'C'|'D'; title: string; focus: string; exercises: Exercise[] };
const ex = (slug:string,name:string,muscles:string,sets:number,repMin:number,repMax:number,rest:number,step:number,cues:string[],mistakes:string[],timed=false):Exercise=>({slug,name,muscles,sets,repMin,repMax,rest,step,cues,mistakes,timed});
export const workoutPlan: WorkoutDay[] = [
 {key:'A',title:'Treino A',focus:'Peito e tríceps',exercises:[
  ex('supino-reto','Supino reto com barra','Peitoral, deltoide anterior, tríceps',4,6,10,120,2.5,['Pés firmes no chão e escápulas encaixadas para trás e para baixo.','Desça a barra controlada até o meio do peito.','Cotovelos a cerca de 45° do tronco.','Empurre a barra até estender os braços sem travar.'],['Tirar o quadril do banco','Quicar a barra no peito','Abrir os cotovelos a 90°']),
  ex('supino-inclinado','Supino inclinado com halteres','Peitoral superior, ombros',3,8,12,90,2,['Banco entre 30° e 45°.','Halteres na linha do peito superior.','Desça até sentir alongar o peito e suba unindo levemente os halteres.'],['Banco inclinado demais','Descer rápido demais']),
  ex('crossover','Crossover na polia','Peitoral',3,10,15,60,2.5,['Tronco levemente inclinado à frente.','Cotovelos levemente flexionados e fixos.','Junte as mãos à frente do peito e volte devagar.'],['Transformar em empurrada','Usar o embalo do corpo']),
  ex('triceps-polia','Tríceps na polia','Tríceps',3,10,15,60,2.5,['Cotovelos colados ao corpo.','Estenda totalmente os braços.','Volte até ~90° sem mover os ombros.'],['Afastar os cotovelos','Inclinar o tronco para ajudar']),
 ]},
 {key:'B',title:'Treino B',focus:'Costas e bíceps',exercises:[
  ex('puxada-frontal','Puxada frontal','Dorsais, bíceps',4,8,12,90,2.5,['Peito estufado e leve inclinação para trás.','Puxe a barra até a parte alta do peito.','Pense em levar os cotovelos para baixo.'],['Puxar atrás da nuca','Balançar o tronco']),
  ex('remada-curvada','Remada curvada com barra','Dorsais, trapézio, lombar',4,6,10,120,2.5,['Quadril para trás, coluna neutra, tronco a ~45°.','Puxe a barra até o umbigo.','Aperte as escápulas no topo.'],['Arredondar a coluna','Levantar o tronco a cada repetição']),
  ex('remada-baixa','Remada baixa com triângulo','Dorsais, romboides',3,10,12,90,2.5,['Tronco ereto e joelhos levemente flexionados.','Puxe o triângulo até o abdômen.','Volte alongando sem curvar as costas.'],['Jogar o tronco para trás','Encolher os ombros']),
  ex('rosca-direta','Rosca direta com barra','Bíceps',3,8,12,60,2,['Cotovelos fixos ao lado do corpo.','Suba até contrair o bíceps.','Desça em 2 a 3 segundos.'],['Balançar o quadril','Avançar os cotovelos']),
  ex('rosca-martelo','Rosca martelo','Bíceps, braquial, antebraço',3,10,12,60,2,['Palmas voltadas uma para a outra.','Suba sem girar o punho.','Controle a descida.'],['Usar embalo','Encolher os ombros']),
 ]},
 {key:'C',title:'Treino C',focus:'Pernas',exercises:[
  ex('agachamento','Agachamento livre','Quadríceps, glúteos, posteriores',4,6,10,150,5,['Pés na largura dos ombros, pontas levemente abertas.','Desça com o quadril para trás até as coxas ficarem paralelas.','Joelhos na direção das pontas dos pés.','Peito aberto e coluna neutra durante todo o movimento.'],['Joelhos para dentro','Calcanhares saindo do chão','Arredondar a lombar']),
  ex('leg-press','Leg press 45°','Quadríceps, glúteos',4,10,12,120,10,['Lombar e quadril apoiados no encosto.','Pés na largura dos ombros na plataforma.','Desça até ~90° nos joelhos e empurre com o calcanhar.'],['Descolar o quadril do banco','Travar os joelhos no topo']),
  ex('cadeira-extensora','Cadeira extensora','Quadríceps',3,10,15,60,5,['Joelho alinhado ao eixo da máquina.','Estenda totalmente e segure 1 segundo.','Desça devagar.'],['Chutar o peso','Tirar o quadril do banco']),
  ex('mesa-flexora','Mesa flexora','Posteriores da coxa',3,10,12,60,5,['Quadril colado no banco.','Leve os calcanhares em direção aos glúteos.','Retorne controlando.'],['Levantar o quadril','Movimento curto']),
  ex('panturrilha','Panturrilha em pé','Panturrilhas',4,12,20,45,5,['Suba o máximo nas pontas dos pés.','Pause 1 segundo no topo.','Desça alongando bem.'],['Repetições curtas e rápidas','Flexionar os joelhos']),
 ]},
 {key:'D',title:'Treino D',focus:'Ombros e core',exercises:[
  ex('desenvolvimento','Desenvolvimento com halteres','Deltoides, tríceps',4,8,12,90,2,['Sentado com as costas apoiadas.','Halteres na altura das orelhas.','Empurre acima da cabeça sem bater os halteres.'],['Arquear demais a lombar','Descer pouco']),
  ex('elevacao-lateral','Elevação lateral','Deltoide lateral',3,12,15,60,1,['Cotovelos levemente flexionados.','Eleve os braços até a altura dos ombros.','Desça devagar.'],['Subir acima dos ombros','Usar embalo do tronco']),
  ex('crucifixo-inverso','Crucifixo inverso na máquina','Deltoide posterior, trapézio médio',3,12,15,60,2.5,['Peito apoiado no encosto.','Abra os braços para trás em arco.','Aperte as escápulas no final.'],['Encolher os ombros','Dobrar demais os cotovelos']),
  ex('prancha','Prancha','Abdômen, core',3,30,60,45,0,['Antebraços sob os ombros.','Corpo em linha reta da cabeça aos calcanhares.','Contraia abdômen e glúteos e respire normalmente.'],['Quadril caído','Quadril alto demais'],true),
 ]},
];
export const allExercises = workoutPlan.flatMap(d=>d.exercises);
/** 4 treinos por semana: seg A, ter B, qui C, sex D. */
export function workoutForDate(date = new Date(), mode: WorkoutMode = 'gym'): WorkoutDay | null {
  const map: Record<number, WorkoutDay['key']> = {1:'A',2:'B',4:'C',5:'D'};
  const key = map[date.getDay()]; return key ? planForMode(mode).find(d=>d.key===key)! : null;
}
/** Plano de treino conforme o local: academia (equipamentos) ou em casa (peso do corpo + itens da casa). */
export function planForMode(mode: WorkoutMode): WorkoutDay[] { return mode === 'home' ? homePlan : workoutPlan; }
/** Dupla progressão: todas as séries no topo da faixa -> sobe a carga e volta ao mínimo de repetições. */
export function suggestNext(exercise: Pick<Exercise,'sets'|'repMin'|'repMax'|'step'|'timed'>, last: {weight:number;reps:number}[]) {
  if (!last.length) return null;
  const weight = Math.max(...last.map(s=>s.weight));
  const top = last.length >= exercise.sets && last.every(s=>s.reps >= exercise.repMax);
  if (exercise.timed) return top ? {weight, reps: exercise.repMax + 10, increase: false} : {weight, reps: Math.min(...last.map(s=>s.reps)), increase: false};
  if (top) return {weight: Math.round((weight + exercise.step)*10)/10, reps: exercise.repMin, increase: true};
  return {weight, reps: Math.min(exercise.repMax, Math.min(...last.map(s=>s.reps)) + 1), increase: false};
}
