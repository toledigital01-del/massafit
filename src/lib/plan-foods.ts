/**
 * Catálogo de alimentos brasileiros (valores por 100 g do alimento já preparado, aproximados da TACO).
 * Usado pelo plano alimentar flexível. Valores de referência: confirme rótulos de produtos industrializados.
 */
export type Group = 'proteina' | 'carbo' | 'leguminosa' | 'fruta' | 'verdura' | 'laticinio' | 'gordura';
export type Tag = 'lactose' | 'gluten' | 'meat' | 'redmeat' | 'fish' | 'egg';
export type Unit = { s: string; p: string; grams: number };
export type Food = {
  id: string; name: string; group: Group;
  kcal: number; p: number; c: number; f: number; // por 100 g
  unit?: Unit; whole?: boolean; // whole: só faz sentido em unidades inteiras (ovo, banana…)
  tags: Tag[]; cost: 1 | 2 | 3; // 1 econômico · 3 caro
};

export const GROUP_LABEL: Record<Group, string> = { proteina: 'Proteínas', carbo: 'Carboidratos', leguminosa: 'Leguminosas', fruta: 'Frutas', verdura: 'Verduras e legumes', laticinio: 'Laticínios', gordura: 'Gorduras e oleaginosas' };

const u = (s: string, p: string, grams: number): Unit => ({ s, p, grams });
const colher = (g: number) => u('colher de sopa', 'colheres de sopa', g);
const fatia = (g: number) => u('fatia', 'fatias', g);
const unid = (s: string, p: string, g: number) => u(s, p, g);
function F(id: string, name: string, group: Group, kcal: number, p: number, c: number, f: number, unit: Unit | undefined, cost: 1 | 2 | 3, tags: Tag[] = [], whole = false): Food {
  return { id, name, group, kcal, p, c, f, tags, cost, whole, ...(unit ? { unit } : {}) };
}

export const FOODS: Food[] = [
  // proteínas
  F('frango-peito', 'Peito de frango grelhado', 'proteina', 159, 32, 0, 2.5, u('filé médio', 'filés médios', 100), 2, ['meat']),
  F('frango-sobrecoxa', 'Sobrecoxa de frango assada (sem pele)', 'proteina', 190, 28, 0, 8, u('sobrecoxa', 'sobrecoxas', 90), 1, ['meat']),
  F('patinho', 'Patinho grelhado', 'proteina', 219, 36, 0, 7.3, u('bife médio', 'bifes médios', 100), 3, ['meat', 'redmeat']),
  F('alcatra', 'Alcatra grelhada', 'proteina', 241, 32, 0, 11.6, u('bife médio', 'bifes médios', 100), 3, ['meat', 'redmeat']),
  F('carne-moida', 'Carne moída refogada', 'proteina', 212, 27, 0, 11, colher(30), 2, ['meat', 'redmeat']),
  F('lombo-suino', 'Lombo suíno assado', 'proteina', 210, 29, 0, 10, fatia(60), 2, ['meat']),
  F('tilapia', 'Tilápia grelhada', 'proteina', 128, 26, 0, 2.7, u('filé', 'filés', 120), 2, ['fish']),
  F('sardinha', 'Sardinha em lata (escorrida)', 'proteina', 220, 24, 0, 13, u('lata', 'latas', 84), 1, ['fish']),
  F('atum', 'Atum em lata ao natural', 'proteina', 110, 25.5, 0, 1, u('lata', 'latas', 120), 2, ['fish']),
  F('ovo', 'Ovo cozido', 'proteina', 146, 13.3, 0.6, 9.5, unid('ovo', 'ovos', 50), 1, ['egg'], true),
  F('clara', 'Clara de ovo cozida', 'proteina', 59, 13, 0.3, 0.2, unid('clara', 'claras', 33), 1, ['egg'], true),
  F('cottage', 'Queijo cottage', 'proteina', 98, 11, 3.4, 4.3, colher(30), 2, ['lactose']),
  F('queijo-minas', 'Queijo minas frescal', 'proteina', 264, 17.4, 3.2, 20.2, fatia(30), 2, ['lactose']),
  F('mussarela', 'Queijo mussarela', 'proteina', 330, 22.6, 3, 25.2, fatia(20), 2, ['lactose']),
  F('ricota', 'Ricota', 'proteina', 140, 12.6, 3.8, 8.1, fatia(40), 2, ['lactose']),
  F('peito-peru', 'Peito de peru', 'proteina', 98, 17, 2, 2, fatia(20), 2, ['meat']),
  F('whey', 'Whey protein', 'proteina', 400, 80, 8, 6, u('scoop', 'scoops', 30), 3, ['lactose']),
  F('tofu', 'Tofu', 'proteina', 80, 8.5, 2, 4.8, fatia(50), 2),
  // leguminosas
  F('feijao-carioca', 'Feijão carioca cozido', 'leguminosa', 76, 4.8, 13.6, 0.5, u('concha', 'conchas', 100), 1),
  F('feijao-preto', 'Feijão preto cozido', 'leguminosa', 77, 4.5, 14, 0.5, u('concha', 'conchas', 100), 1),
  F('lentilha', 'Lentilha cozida', 'leguminosa', 93, 6.3, 16.3, 0.5, u('concha', 'conchas', 100), 1),
  F('grao-de-bico', 'Grão-de-bico cozido', 'leguminosa', 128, 8.5, 21, 2.5, colher(25), 2),
  // carboidratos
  F('arroz', 'Arroz branco cozido', 'carbo', 128, 2.5, 28.1, 0.2, u('escumadeira', 'escumadeiras', 90), 1),
  F('arroz-integral', 'Arroz integral cozido', 'carbo', 124, 2.6, 25.8, 1, u('escumadeira', 'escumadeiras', 90), 2),
  F('macarrao', 'Macarrão cozido', 'carbo', 102, 3.4, 21.5, 0.5, u('pegador', 'pegadores', 110), 1, ['gluten']),
  F('cuscuz', 'Cuscuz de milho cozido', 'carbo', 113, 2.2, 25.3, 0.7, u('fatia', 'fatias', 75), 1),
  F('mandioca', 'Mandioca cozida', 'carbo', 125, 0.6, 30.1, 0.3, u('pedaço', 'pedaços', 60), 1),
  F('batata', 'Batata inglesa cozida', 'carbo', 52, 1.2, 11.9, 0.1, unid('batata média', 'batatas médias', 130), 1),
  F('batata-doce', 'Batata-doce cozida', 'carbo', 77, 0.6, 18.4, 0.1, unid('batata média', 'batatas médias', 130), 1),
  F('inhame', 'Inhame cozido', 'carbo', 97, 2.3, 23.2, 0.1, u('pedaço', 'pedaços', 70), 2),
  F('tapioca', 'Tapioca (goma hidratada)', 'carbo', 240, 0, 59, 0, unid('tapioca média', 'tapiocas médias', 80), 1),
  F('pao-frances', 'Pão francês', 'carbo', 300, 8, 58.6, 3.1, unid('pãozinho', 'pãezinhos', 50), 1, ['gluten'], true),
  F('pao-integral', 'Pão integral de forma', 'carbo', 253, 9.4, 49.9, 3.7, fatia(25), 2, ['gluten']),
  F('aveia', 'Aveia em flocos', 'carbo', 394, 13.9, 66.6, 8.5, colher(15), 1, ['gluten']),
  F('milho', 'Milho verde cozido', 'carbo', 98, 3.2, 17, 1.4, colher(25), 1),
  F('pao-queijo', 'Pão de queijo assado', 'carbo', 363, 5.1, 34.2, 24.6, unid('unidade média', 'unidades médias', 30), 2, ['lactose', 'egg']),
  // frutas
  F('banana-prata', 'Banana-prata', 'fruta', 98, 1.3, 26, 0.1, unid('banana', 'bananas', 80), 1, [], true),
  F('banana-nanica', 'Banana-nanica', 'fruta', 92, 1.4, 23.8, 0.1, unid('banana', 'bananas', 90), 1, [], true),
  F('maca', 'Maçã', 'fruta', 56, 0.3, 15.2, 0, unid('maçã', 'maçãs', 130), 1, [], true),
  F('mamao', 'Mamão papaia', 'fruta', 40, 0.5, 10.4, 0.1, unid('fatia', 'fatias', 150), 1),
  F('laranja', 'Laranja-pera', 'fruta', 37, 1, 8.9, 0.1, unid('laranja', 'laranjas', 140), 1, [], true),
  F('manga', 'Manga', 'fruta', 72, 0.4, 19.4, 0.2, unid('manga', 'mangas', 150), 2, [], true),
  F('abacate', 'Abacate', 'fruta', 96, 1.2, 6, 8.4, colher(40), 2),
  F('uva', 'Uva', 'fruta', 53, 0.7, 13.6, 0.2, u('cacho pequeno', 'cachos pequenos', 100), 2),
  F('melancia', 'Melancia', 'fruta', 33, 0.9, 8.1, 0, fatia(200), 1),
  F('abacaxi', 'Abacaxi', 'fruta', 48, 0.9, 12.3, 0.1, fatia(75), 1),
  F('morango', 'Morango', 'fruta', 30, 0.9, 6.8, 0.3, u('xícara', 'xícaras', 100), 2),
  F('goiaba', 'Goiaba vermelha', 'fruta', 54, 1.1, 13, 0.4, unid('goiaba', 'goiabas', 100), 1, [], true),
  F('kiwi', 'Kiwi', 'fruta', 51, 1.3, 11.5, 0.6, unid('kiwi', 'kiwis', 70), 2, [], true),
  // verduras e legumes
  F('alface', 'Alface', 'verdura', 11, 1.3, 1.7, 0.2, u('prato de sobremesa', 'pratos de sobremesa', 40), 1),
  F('tomate', 'Tomate', 'verdura', 15, 1.1, 3.1, 0.2, unid('tomate', 'tomates', 100), 1),
  F('cenoura', 'Cenoura cozida', 'verdura', 30, 0.8, 6.7, 0.2, colher(25), 1),
  F('brocolis', 'Brócolis cozido', 'verdura', 25, 2.1, 4.4, 0.5, u('buquê', 'buquês', 30), 1),
  F('couve', 'Couve refogada', 'verdura', 90, 1.7, 8.7, 6.6, colher(15), 1),
  F('abobrinha', 'Abobrinha cozida', 'verdura', 15, 1, 3, 0.2, colher(20), 1),
  F('chuchu', 'Chuchu cozido', 'verdura', 19, 0.4, 4.8, 0, colher(25), 1),
  F('beterraba', 'Beterraba cozida', 'verdura', 32, 1.3, 7.2, 0.1, unid('beterraba média', 'beterrabas médias', 100), 1),
  F('vagem', 'Vagem cozida', 'verdura', 25, 1.8, 5.2, 0.2, colher(20), 1),
  // laticínios
  F('leite-integral', 'Leite integral', 'laticinio', 61, 3.2, 4.6, 3.3, u('copo (200 ml)', 'copos (200 ml)', 200), 1, ['lactose']),
  F('leite-desnatado', 'Leite desnatado', 'laticinio', 35, 3.4, 4.9, 0.1, u('copo (200 ml)', 'copos (200 ml)', 200), 1, ['lactose']),
  F('iogurte-natural', 'Iogurte natural', 'laticinio', 51, 4.1, 1.9, 3, u('pote', 'potes', 170), 1, ['lactose']),
  F('iogurte-grego', 'Iogurte grego natural', 'laticinio', 97, 9, 4, 5, u('pote', 'potes', 100), 2, ['lactose']),
  F('requeijao', 'Requeijão cremoso', 'laticinio', 250, 9.6, 2.4, 23, colher(30), 2, ['lactose']),
  F('leite-vegetal', 'Bebida de soja', 'laticinio', 33, 2.9, 2.4, 1.6, u('copo (200 ml)', 'copos (200 ml)', 200), 2),
  // gorduras
  F('azeite', 'Azeite de oliva', 'gordura', 884, 0, 0, 100, u('colher de sobremesa', 'colheres de sobremesa', 8), 2),
  F('pasta-amendoim', 'Pasta de amendoim', 'gordura', 588, 25, 20, 50, colher(15), 2),
  F('castanha-para', 'Castanha-do-pará', 'gordura', 643, 14.5, 15.1, 63.5, unid('castanha', 'castanhas', 4), 3, [], true),
  F('amendoim', 'Amendoim torrado', 'gordura', 600, 27, 12, 50, u('punhado', 'punhados', 30), 1),
  F('manteiga', 'Manteiga', 'gordura', 726, 0.4, 0.1, 82, u('colher de chá', 'colheres de chá', 5), 2, ['lactose']),
  F('chia', 'Chia', 'gordura', 486, 16.5, 42, 30.7, colher(12), 3),
];

const byId = new Map(FOODS.map(f => [f.id, f]));
export const foodById = (id: string): Food | undefined => byId.get(id);
export const mustFood = (id: string): Food => { const f = byId.get(id); if (!f) throw new Error(`Alimento desconhecido: ${id}`); return f; };

export const macrosOf = (f: Food, grams: number) => ({ kcal: (f.kcal * grams) / 100, p: (f.p * grams) / 100, c: (f.c * grams) / 100, f: (f.f * grams) / 100 });

const fmtNum = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
/** "2 ovos", "1,5 colher de sopa"; para medidas grandes (filé, concha…), gramas com a medida aproximada. */
export function portionText(f: Food, grams: number): string {
  if (!f.unit) return `${Math.round(grams)} g`;
  const n = Math.round((grams / f.unit.grams) * 2) / 2;
  if (n <= 0) return `${Math.round(grams)} g`;
  const label = `${fmtNum(n)} ${n === 1 ? f.unit.s : f.unit.p}`;
  return !f.whole && f.unit.grams >= 60 ? `${Math.round(grams)} g (≈ ${label})` : label;
}

/** Arredonda para algo que dá para medir: unidades inteiras (ovo, banana), meias medidas pequenas ou múltiplos de 10/5 g. */
export function roundGrams(f: Food, grams: number): number {
  if (f.unit && f.whole) return Math.max(1, Math.round(grams / f.unit.grams)) * f.unit.grams;
  if (f.unit && f.unit.grams >= 60) return Math.max(20, Math.round(grams / 10) * 10);
  if (f.unit && f.unit.grams >= 20) return Math.max(0.5, Math.round((grams / f.unit.grams) * 2) / 2) * f.unit.grams;
  if (f.unit && f.unit.grams >= 4) return Math.max(1, Math.round(grams / f.unit.grams)) * f.unit.grams;
  return Math.max(5, Math.round(grams / 5) * 5);
}
