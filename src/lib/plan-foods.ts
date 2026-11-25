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
  F('whey', 'Whey protein', 'proteina', 400, 80, 8, 6, u('medida', 'medidas', 30), 3, ['lactose']),
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
  F('milho', 'Milho verde cozido', 'carbo', 98, 3.2, 17.1, 2.4, colher(25), 1),
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
  // ampliação do catálogo (valores aproximados da TACO, por 100 g)
  F('coxa-frango', 'Coxa de frango assada (sem pele)', 'proteina', 215, 27, 0, 11, unid('coxa', 'coxas', 80), 1, ['meat']),
  F('frango-desfiado', 'Frango desfiado cozido', 'proteina', 163, 31, 0, 3.5, colher(30), 1, ['meat']),
  F('figado', 'Fígado bovino grelhado', 'proteina', 225, 30, 4, 9, unid('bife', 'bifes', 100), 1, ['meat', 'redmeat']),
  F('acem-cozido', 'Acém cozido', 'proteina', 215, 28, 0, 11, colher(30), 2, ['meat', 'redmeat']),
  F('coxao-mole', 'Coxão mole grelhado', 'proteina', 219, 32, 0, 9, unid('bife', 'bifes', 100), 3, ['meat', 'redmeat']),
  F('merluza', 'Merluza cozida', 'proteina', 122, 26.6, 0, 0.9, unid('filé', 'filés', 100), 2, ['fish']),
  F('salmao', 'Salmão grelhado', 'proteina', 243, 26, 0, 14.5, unid('posta', 'postas', 120), 3, ['fish']),
  F('camarao', 'Camarão cozido', 'proteina', 90, 19, 0.5, 1, colher(20), 3, ['fish']),
  F('ovo-mexido', 'Ovo mexido', 'proteina', 190, 12.6, 1, 15, unid('ovo', 'ovos', 50), 1, ['egg'], true),
  F('ricota-light', 'Ricota light', 'proteina', 120, 12, 3, 6, fatia(30), 2, ['lactose']),
  F('queijo-prato', 'Queijo prato', 'proteina', 360, 22.7, 2, 29, fatia(20), 2, ['lactose']),
  F('proteina-soja', 'Proteína de soja texturizada hidratada', 'proteina', 110, 16, 8, 1.5, colher(25), 1, []),
  F('hamburguer-caseiro', 'Hambúrguer caseiro grelhado', 'proteina', 230, 24, 3, 14, unid('hambúrguer', 'hambúrgueres', 90), 2, ['meat', 'redmeat']),
  F('feijao-fradinho', 'Feijão fradinho cozido', 'leguminosa', 120, 8, 20, 0.7, u('concha', 'conchas', 90), 1),
  F('feijao-branco', 'Feijão branco cozido', 'leguminosa', 120, 8, 20, 0.5, u('concha', 'conchas', 90), 1),
  F('ervilha', 'Ervilha cozida', 'leguminosa', 88, 5.4, 14, 0.4, colher(25), 1),
  F('soja-cozida', 'Soja cozida', 'leguminosa', 140, 12, 9, 6.5, colher(25), 1),
  F('edamame', 'Edamame cozido', 'leguminosa', 122, 11, 9, 5, colher(25), 3),
  F('arroz-parboilizado', 'Arroz parboilizado cozido', 'carbo', 123, 2.6, 26.9, 0.3, u('escumadeira', 'escumadeiras', 90), 1),
  F('macarrao-integral', 'Macarrão integral cozido', 'carbo', 124, 5.3, 26.5, 0.5, u('pegador', 'pegadores', 110), 2, ['gluten']),
  F('quinoa', 'Quinoa cozida', 'carbo', 120, 4.4, 21, 1.9, colher(25), 3),
  F('polenta', 'Polenta cozida', 'carbo', 70, 1.6, 15.3, 0.3, fatia(100), 1),
  F('mandioquinha', 'Mandioquinha cozida', 'carbo', 80, 0.9, 18.9, 0.2, unid('unidade', 'unidades', 100), 2),
  F('cara', 'Cará cozido', 'carbo', 96, 2.3, 23, 0.1, unid('pedaço', 'pedaços', 100), 2),
  F('pure-batata', 'Purê de batata', 'carbo', 83, 1.8, 14, 2.3, colher(40), 1, ['lactose']),
  F('farofa', 'Farofa de mandioca', 'carbo', 406, 2, 80, 8, colher(15), 1),
  F('pao-forma', 'Pão de forma', 'carbo', 253, 7.5, 49, 2.7, fatia(25), 1, ['gluten']),
  F('pao-sem-gluten', 'Pão sem glúten', 'carbo', 245, 3, 50, 3, fatia(30), 3),
  F('torrada', 'Torrada', 'carbo', 377, 10, 73, 4, unid('torrada', 'torradas', 8), 1, ['gluten']),
  F('biscoito-agua-sal', 'Biscoito água e sal', 'carbo', 430, 10, 70, 11, unid('biscoito', 'biscoitos', 6), 1, ['gluten']),
  F('granola', 'Granola', 'carbo', 400, 9, 65, 12, colher(15), 3, ['gluten']),
  F('flocos-milho', 'Flocos de milho', 'carbo', 365, 7, 84, 0.5, colher(10), 1),
  F('farinha-aveia', 'Farinha de aveia', 'carbo', 390, 14, 66, 8, colher(15), 2, ['gluten']),
  F('pamonha', 'Pamonha', 'carbo', 170, 3, 30, 4, unid('unidade', 'unidades', 120), 2),
  F('banana-maca', 'Banana-maçã', 'fruta', 87, 1.8, 22.3, 0.1, unid('banana', 'bananas', 80), 1, [], true),
  F('banana-passa', 'Banana-passa', 'fruta', 298, 3.8, 79, 0.5, unid('unidade', 'unidades', 20), 3),
  F('tangerina', 'Tangerina', 'fruta', 38, 0.8, 9.6, 0.1, unid('unidade', 'unidades', 120), 1),
  F('pera', 'Pera', 'fruta', 53, 0.6, 14, 0.1, unid('unidade', 'unidades', 150), 2),
  F('pessego', 'Pêssego', 'fruta', 42, 0.9, 10, 0.2, unid('unidade', 'unidades', 130), 2),
  F('caqui', 'Caqui', 'fruta', 71, 0.4, 19, 0.1, unid('unidade', 'unidades', 140), 2),
  F('melao', 'Melão', 'fruta', 29, 0.7, 7.5, 0.1, fatia(150), 1),
  F('acai', 'Polpa de açaí sem açúcar', 'fruta', 58, 0.8, 6.2, 3.9, unid('pote', 'potes', 100), 3),
  F('uva-passa', 'Uva-passa', 'fruta', 300, 3, 79, 0.5, colher(15), 3),
  F('tamara', 'Tâmara', 'fruta', 282, 2.5, 75, 0.4, unid('unidade', 'unidades', 8), 3),
  F('maracuja', 'Polpa de maracujá', 'fruta', 68, 2, 12, 2, colher(20), 2),
  F('couve-flor', 'Couve-flor cozida', 'verdura', 23, 1.9, 4, 0.2, colher(30), 1),
  F('abobora', 'Abóbora cozida', 'verdura', 48, 1.4, 11, 0.7, colher(40), 1),
  F('berinjela', 'Berinjela refogada', 'verdura', 48, 1.2, 8, 1.5, colher(30), 1),
  F('pepino', 'Pepino', 'verdura', 15, 0.7, 3.6, 0.1, unid('unidade', 'unidades', 100), 1),
  F('repolho', 'Repolho cru', 'verdura', 25, 1.3, 6, 0.1, colher(20), 1),
  F('espinafre', 'Espinafre refogado', 'verdura', 40, 3, 4, 2, colher(30), 1),
  F('rucula', 'Rúcula', 'verdura', 25, 2.6, 3.7, 0.7, unid('prato de sobremesa', 'pratos de sobremesa', 30), 1),
  F('quiabo', 'Quiabo cozido', 'verdura', 30, 1.9, 6, 0.3, colher(30), 1),
  F('palmito', 'Palmito', 'verdura', 30, 2.5, 5, 0.5, unid('talo', 'talos', 40), 3),
  F('cebola', 'Cebola refogada', 'verdura', 45, 1.2, 8, 1, colher(20), 1),
  F('pimentao', 'Pimentão', 'verdura', 28, 1, 6, 0.3, unid('unidade', 'unidades', 100), 1),
  F('ervilha-torta', 'Ervilha-torta', 'verdura', 42, 2.8, 7.5, 0.2, colher(30), 2),
  F('leite-semi', 'Leite semidesnatado', 'laticinio', 47, 3.3, 4.9, 1.6, u('copo', 'copos', 200), 1, ['lactose']),
  F('leite-sem-lactose', 'Leite sem lactose', 'laticinio', 61, 3.2, 4.7, 3.3, u('copo', 'copos', 200), 2),
  F('iogurte-desnatado', 'Iogurte desnatado', 'laticinio', 42, 4, 6, 0.2, u('pote', 'potes', 170), 1, ['lactose']),
  F('iogurte-proteico', 'Iogurte proteico', 'laticinio', 65, 10, 5, 0.5, u('pote', 'potes', 170), 3, ['lactose']),
  F('iogurte-sem-lactose', 'Iogurte natural sem lactose', 'laticinio', 62, 3.5, 4.5, 3.3, u('pote', 'potes', 170), 3),
  F('kefir', 'Kefir', 'laticinio', 55, 3.5, 4.5, 2.5, u('copo', 'copos', 200), 2, ['lactose']),
  F('leite-po', 'Leite em pó integral', 'laticinio', 497, 26, 38, 27, colher(15), 2, ['lactose']),
  F('queijo-coalho', 'Queijo coalho', 'laticinio', 330, 22, 3, 25, unid('espetinho', 'espetinhos', 50), 2, ['lactose']),
  F('creme-ricota', 'Creme de ricota', 'laticinio', 160, 8, 4, 12, colher(25), 2, ['lactose']),
  F('azeitona', 'Azeitona', 'gordura', 145, 1, 4, 15, unid('azeitona', 'azeitonas', 4), 2),
  F('oleo-coco', 'Óleo de coco', 'gordura', 862, 0, 0, 100, u('colher de chá', 'colheres de chá', 5), 3),
  F('castanha-caju', 'Castanha-de-caju', 'gordura', 570, 18, 30, 46, unid('unidade', 'unidades', 3), 3),
  F('nozes', 'Nozes', 'gordura', 650, 15, 14, 65, unid('unidade', 'unidades', 5), 3),
  F('amendoa', 'Amêndoas', 'gordura', 580, 21, 22, 50, unid('unidade', 'unidades', 1.5), 3),
  F('linhaca', 'Linhaça', 'gordura', 495, 14, 43, 32, colher(10), 2),
  F('pasta-castanha', 'Pasta de castanhas', 'gordura', 600, 18, 22, 50, colher(15), 3),
  F('coco-ralado', 'Coco ralado sem açúcar', 'gordura', 600, 6, 20, 60, colher(8), 2),
  F('abacate-pasta', 'Abacate amassado', 'gordura', 160, 2, 8.5, 14.7, colher(30), 2),
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
export function roundGrams(f: Food, grams: number, small = false): number {
  if (small && f.unit && !f.whole && f.unit.grams >= 4 && f.unit.grams < 20) return Math.max(0.5, Math.round((grams / f.unit.grams) * 2) / 2) * f.unit.grams;
  if (f.unit && f.whole) return Math.max(1, Math.round(grams / f.unit.grams)) * f.unit.grams;
  if (f.unit && f.unit.grams >= 60) return Math.max(20, Math.round(grams / 10) * 10);
  if (f.unit && f.unit.grams >= 20) return Math.max(0.5, Math.round((grams / f.unit.grams) * 2) / 2) * f.unit.grams;
  if (f.unit && f.unit.grams >= 4) return Math.max(1, Math.round(grams / f.unit.grams)) * f.unit.grams;
  return Math.max(5, Math.round(grams / 5) * 5);
}
