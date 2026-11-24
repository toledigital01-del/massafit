import type { Exercise, WorkoutDay } from './workout';

type Extra = { perSide?: boolean; timed?: boolean; easier?: string; harder?: string; bodyweight?: boolean };
const ex = (slug: string, name: string, muscles: string, sets: number, repMin: number, repMax: number, rest: number, step: number, cues: string[], mistakes: string[], extra: Extra = {}): Exercise =>
  ({ slug, name, muscles, sets, repMin, repMax, rest, step, cues, mistakes, equip: 'Halteres (ou garrafas/galões de água) e um banco ou cadeira firme', ...extra });

/**
 * Treino ABCD só com halteres, 4x por semana (mesma divisão dos outros modos).
 * `step` é o aumento de carga por halter quando todas as séries chegam ao topo da faixa.
 */
export const dumbbellPlan: WorkoutDay[] = [
  { key: 'A', title: 'Treino A', focus: 'Peito e tríceps', exercises: [
    ex('supino-halteres', 'Supino reto com halteres', 'Peitoral, deltoide anterior, tríceps', 4, 8, 12, 90, 2,
      ['Deite com os pés firmes no chão e as escápulas para trás e para baixo.', 'Halteres na linha do peito, cotovelos a cerca de 45° do tronco.', 'Empurre até estender os braços sem bater os halteres.', 'Desça devagar até sentir o peito alongar.'],
      ['Abrir os cotovelos a 90°', 'Descer rápido demais', 'Tirar o quadril do banco']),
    ex('supino-inclinado', 'Supino inclinado com halteres', 'Peitoral superior, ombros', 3, 8, 12, 90, 2,
      ['Banco entre 30° e 45°.', 'Halteres na linha do peito superior.', 'Desça até sentir alongar o peito e suba unindo levemente os halteres.'],
      ['Banco inclinado demais', 'Descer rápido demais']),
    ex('flexao', 'Flexão de braço', 'Peitoral, tríceps, deltoide anterior', 3, 8, 20, 75, 0,
      ['Mãos um pouco além da largura dos ombros e corpo em linha reta.', 'Desça o peito até quase tocar o chão.', 'Empurre e estenda os braços sem travar.'],
      ['Deixar o quadril cair', 'Descer só a cabeça'], { bodyweight: true, easier: 'Apoie os joelhos ou as mãos num banco.', harder: 'Pés elevados numa cadeira.' }),
    ex('triceps-testa-halteres', 'Tríceps testa com halteres', 'Tríceps', 3, 10, 12, 60, 1,
      ['Deitado, braços esticados sobre o peito e palmas voltadas uma para a outra.', 'Dobre só os cotovelos, levando os halteres ao lado da cabeça.', 'Estenda de volta sem mexer os ombros.'],
      ['Abrir os cotovelos', 'Usar carga que faz o ombro participar']),
  ] },
  { key: 'B', title: 'Treino B', focus: 'Costas e bíceps', exercises: [
    ex('remada-unilateral', 'Remada unilateral com halter', 'Dorsais, romboides, bíceps', 4, 8, 12, 90, 2,
      ['Uma mão e um joelho apoiados no banco, coluna neutra.', 'Puxe o halter em direção ao quadril, com o cotovelo junto ao corpo.', 'Desça alongando as costas, sem girar o tronco.'],
      ['Girar o tronco para ajudar', 'Puxar só com o braço'], { perSide: true }),
    ex('remada-curvada-halteres', 'Remada curvada com halteres', 'Dorsais, trapézio, lombar', 3, 8, 12, 90, 2,
      ['Quadril para trás, coluna neutra e tronco a cerca de 45°.', 'Puxe os halteres até a lateral do abdômen.', 'Aperte as escápulas no topo e desça controlado.'],
      ['Arredondar a coluna', 'Levantar o tronco a cada repetição']),
    ex('pullover-halter', 'Pullover com halter', 'Dorsais, peitoral', 3, 10, 12, 60, 2,
      ['Deitado no banco, segure um halter com as duas mãos sobre o peito.', 'Leve o halter para trás da cabeça em arco, com os cotovelos levemente dobrados.', 'Volte até a linha do peito usando as costas.'],
      ['Dobrar demais os cotovelos', 'Arquear a lombar']),
    ex('rosca-alternada', 'Rosca alternada com halteres', 'Bíceps', 3, 8, 12, 60, 1,
      ['Em pé, cotovelos fixos ao lado do corpo.', 'Suba girando a palma para cima e contraia o bíceps.', 'Desça em 2 a 3 segundos e alterne os braços.'],
      ['Balançar o quadril', 'Avançar os cotovelos'], { perSide: true }),
    ex('rosca-martelo', 'Rosca martelo', 'Bíceps, braquial, antebraço', 3, 10, 12, 60, 1,
      ['Palmas voltadas uma para a outra.', 'Suba sem girar o punho.', 'Controle a descida.'],
      ['Usar embalo', 'Encolher os ombros']),
  ] },
  { key: 'C', title: 'Treino C', focus: 'Pernas e glúteos', exercises: [
    ex('agachamento-goblet', 'Agachamento goblet', 'Quadríceps, glúteos', 4, 8, 15, 90, 2,
      ['Segure um halter junto ao peito com as duas mãos.', 'Pés na largura dos ombros; desça com o quadril para trás.', 'Cotovelos entre os joelhos no fundo e peito aberto.', 'Suba empurrando o chão.'],
      ['Joelhos para dentro', 'Calcanhares saindo do chão', 'Arredondar a lombar']),
    ex('afundo-halteres', 'Afundo com halteres', 'Quadríceps, glúteos', 3, 8, 12, 90, 2,
      ['Halteres ao lado do corpo e tronco ereto.', 'Dê um passo longo e desça até o joelho de trás quase tocar o chão.', 'Empurre com o pé da frente para voltar.'],
      ['Passo curto demais', 'Joelho da frente caindo para dentro'], { perSide: true }),
    ex('stiff-halteres', 'Stiff com halteres', 'Posteriores da coxa, glúteos', 3, 8, 12, 90, 2,
      ['Joelhos levemente dobrados e halteres à frente das coxas.', 'Leve o quadril para trás, deslizando os halteres pelas pernas.', 'Desça até sentir alongar atrás da coxa e suba apertando os glúteos.'],
      ['Arredondar a coluna', 'Transformar em agachamento']),
    ex('elevacao-pelvica-halter', 'Elevação pélvica com halter', 'Glúteos, posteriores', 3, 10, 15, 60, 2,
      ['Costas apoiadas no banco e halter sobre o quadril.', 'Suba o quadril até alinhar tronco e coxas.', 'Aperte os glúteos no alto por 1 segundo.'],
      ['Arquear a lombar no alto', 'Pés longe demais do quadril']),
    ex('panturrilha-halteres', 'Panturrilha em pé com halteres', 'Panturrilhas', 4, 12, 20, 45, 2,
      ['Halteres ao lado do corpo, ponta dos pés num degrau se possível.', 'Suba o máximo e pare 1 segundo.', 'Desça alongando bem.'],
      ['Repetições curtas e rápidas', 'Flexionar os joelhos']),
  ] },
  { key: 'D', title: 'Treino D', focus: 'Ombros e core', exercises: [
    ex('arnold-press', 'Desenvolvimento Arnold', 'Deltoides, tríceps', 4, 8, 12, 90, 2,
      ['Sentado, halteres na frente do peito com as palmas para você.', 'Suba girando as palmas para a frente até esticar os braços.', 'Desça girando de volta, devagar.'],
      ['Arquear a lombar', 'Usar embalo das pernas']),
    ex('elevacao-lateral', 'Elevação lateral', 'Deltoide lateral', 3, 12, 15, 60, 1,
      ['Cotovelos levemente flexionados.', 'Eleve os braços até a altura dos ombros.', 'Desça devagar.'],
      ['Subir acima dos ombros', 'Usar embalo do tronco']),
    ex('crucifixo-inverso-halteres', 'Crucifixo inverso com halteres', 'Deltoide posterior, trapézio médio', 3, 12, 15, 60, 1,
      ['Tronco inclinado à frente com a coluna neutra.', 'Abra os braços para os lados em arco.', 'Aperte as escápulas e volte devagar.'],
      ['Encolher os ombros', 'Dobrar demais os cotovelos']),
    ex('remada-alta-halteres', 'Remada alta com halteres', 'Deltoides, trapézio', 3, 10, 12, 60, 1,
      ['Halteres à frente das coxas, palmas para você.', 'Suba os cotovelos primeiro, até a altura dos ombros.', 'Desça controlado.'],
      ['Subir os cotovelos acima dos ombros', 'Balançar o tronco']),
    ex('abdominal-halter', 'Abdominal com halter', 'Abdômen', 3, 12, 20, 45, 1,
      ['Deitado, joelhos dobrados e halter junto ao peito.', 'Suba o tronco contraindo o abdômen, solte o ar.', 'Desça devagar sem relaxar totalmente.'],
      ['Puxar o pescoço', 'Usar impulso']),
  ] },
];
