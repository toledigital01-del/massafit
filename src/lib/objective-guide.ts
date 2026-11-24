/** Orientações de alimentação e treino por objetivo, com a fonte de cada regra (módulo puro). */
export type Objective = 'gain' | 'lose' | 'maintain';
export type Guide = { title: string; food: string[]; training: string[]; sources: { label: string; url: string }[] };

const ISSN = { label: 'ISSN: Diets and body composition (Aragon et al., 2017)', url: 'https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0174-y' };
const GUIA = { label: 'Guia Alimentar para a População Brasileira (Ministério da Saúde, 2014)', url: 'https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf' };
const OMS = { label: 'OMS: recomendações de atividade física (2020)', url: 'https://www.who.int/publications/i/item/9789240015128' };

export const GUIDES: Record<Objective, Guide> = {
  lose: {
    title: 'Foco: emagrecer preservando músculo',
    food: [
      'Déficit moderado e sustentado: a perda de gordura vem de calorias abaixo do gasto mantidas por semanas (ISSN).',
      'Proteína alta em todas as refeições, para proteger o músculo e dar saciedade.',
      'Metade do prato de verduras e legumes; carboidrato em porção menor, de preferência integral.',
      'Priorize comida de verdade (in natura e minimamente processada) e evite ultraprocessados (Guia Alimentar).',
    ],
    training: [
      'Mantenha a musculação 4x por semana com cargas pesadas: é o sinal que diz ao corpo para guardar o músculo.',
      'Some 2 a 3 sessões de cardio leve ou moderado de 30 a 45 minutos (caminhada rápida, bicicleta) e busque 8 a 10 mil passos por dia.',
      'Meta de atividade: 150 a 300 minutos de atividade moderada por semana, somando treino e cardio (OMS).',
      'Perda mais lenta (0,25 a 0,75 kg por semana) preserva mais músculo, principalmente se você já é magro.',
    ],
    sources: [ISSN, GUIA, OMS],
  },
  gain: {
    title: 'Foco: ganhar massa com pouca gordura',
    food: [
      'Superávit moderado e constante: o ganho de massa magra vem de calorias acima do gasto, junto com treino de força (ISSN).',
      'Proteína em 1,6 a 2,2 g por kg, distribuída ao longo do dia.',
      'Carboidrato suficiente ao redor do treino e gorduras boas (azeite, castanhas, abacate) para somar calorias.',
      'Se faltar apetite, use opções líquidas (vitaminas) e mais refeições pequenas.',
    ],
    training: [
      'Treino de força 4x por semana com progressão de carga: é o estímulo que transforma as calorias em músculo.',
      'Cardio leve (1 a 2x por semana, 20 a 30 minutos) para saúde do coração, sem gastar muita energia.',
      'Durma 7 a 9 horas: a recuperação faz parte do ganho.',
      'Ganho de 0,25 a 0,35 kg por semana; acima disso, parte tende a ser gordura.',
    ],
    sources: [ISSN, GUIA, OMS],
  },
  maintain: {
    title: 'Foco: manter o peso e a forma',
    food: [
      'Calorias perto do gasto; variações de até 0,2 kg por semana são normais.',
      'Proteína em 1,6 a 2 g por kg e muita comida de verdade (Guia Alimentar).',
    ],
    training: ['Treino de força 3 a 4x por semana e 150 minutos de atividade moderada por semana (OMS).'],
    sources: [ISSN, GUIA, OMS],
  },
};
