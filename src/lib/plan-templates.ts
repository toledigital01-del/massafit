/** Cardápios prontos por refeição. Quantidades são ponto de partida: o motor ajusta às metas. */
export type MealType = 'cafe' | 'lanche' | 'almoco' | 'pre' | 'jantar' | 'ceia';
export type Role = 'protein' | 'energy' | 'fixed';
export type Slot = { food: string; g: number; role: Role; min?: number; max?: number };
export type MealOption = { id: string; name: string; tip: string; portable?: boolean; slots: Slot[] };

export const MEAL_LABEL: Record<MealType, string> = { cafe: 'Café da manhã', lanche: 'Lanche', almoco: 'Almoço', pre: 'Pré-treino', jantar: 'Jantar', ceia: 'Ceia' };
export const MEAL_TIME: Record<MealType, string> = { cafe: '07:00', lanche: '10:00', almoco: '12:30', pre: '16:00', jantar: '19:30', ceia: '21:30' };

const P = (food: string, g: number, o: Partial<Slot> = {}): Slot => ({ food, g, role: 'protein', ...o });
const E = (food: string, g: number, o: Partial<Slot> = {}): Slot => ({ food, g, role: 'energy', ...o });
const X = (food: string, g: number): Slot => ({ food, g, role: 'fixed' });
const liquid = { min: 0.5, max: 1.5 };

const salada = [X('alface', 40), X('tomate', 80)];
const legumes = [X('brocolis', 60), X('cenoura', 50)];

export const OPTIONS: Record<MealType, MealOption[]> = {
  cafe: [
    { id: 'cafe-ovos-pao', name: 'Ovos, pão e fruta', tip: 'Ovos mexidos ou cozidos, pão na chapa e a fruta ao lado.', portable: true, slots: [P('ovo', 100), E('pao-integral', 50), E('banana-prata', 80)] },
    { id: 'cafe-iogurte-aveia', name: 'Iogurte com aveia e fruta', tip: 'Misture a aveia no iogurte e corte a banana por cima.', portable: true, slots: [P('iogurte-grego', 150), E('aveia', 40), E('banana-prata', 80), X('chia', 6)] },
    { id: 'cafe-tapioca-ovo', name: 'Tapioca com ovo e queijo', tip: 'Recheie a tapioca com ovo mexido e queijo; mamão de sobremesa.', slots: [E('tapioca', 80), P('ovo', 100), X('queijo-minas', 30), E('mamao', 150)] },
    { id: 'cafe-cuscuz-ovos', name: 'Cuscuz com ovos', tip: 'Cuscuz fresquinho com ovos e uma laranja.', slots: [E('cuscuz', 150), P('ovo', 100), E('laranja', 140)] },
    { id: 'cafe-pao-cottage', name: 'Pão com cottage e fruta', tip: 'Cottage no pão com tomate; maçã para acompanhar.', portable: true, slots: [E('pao-frances', 50), P('cottage', 100), X('tomate', 60), E('maca', 130)] },
    { id: 'cafe-vegetal', name: 'Pão com tofu mexido e fruta', tip: 'Tofu mexido com cúrcuma e tomate, no pão integral.', portable: true, slots: [E('pao-integral', 50), P('tofu', 150), X('tomate', 60), E('banana-prata', 80)] },
  ],
  lanche: [
    { id: 'lanche-iogurte-castanha', name: 'Iogurte, aveia e castanhas', tip: 'Fácil de levar num potinho.', portable: true, slots: [P('iogurte-natural', 170), E('aveia', 30), X('castanha-para', 12)] },
    { id: 'lanche-vitamina', name: 'Vitamina de leite com banana e whey', tip: 'Bata tudo no liquidificador com gelo.', slots: [E('leite-integral', 200, liquid), P('whey', 20), E('banana-prata', 100), X('pasta-amendoim', 15)] },
    { id: 'lanche-pao-pasta', name: 'Pão com pasta de amendoim e banana', tip: 'Prático e barato: pão, pasta e banana em rodelas.', portable: true, slots: [E('pao-integral', 50), E('banana-prata', 100), X('pasta-amendoim', 20)] },
    { id: 'lanche-sanduiche-peru', name: 'Sanduíche de peito de peru', tip: 'Pão francês com peito de peru, queijo e salada.', portable: true, slots: [E('pao-frances', 50), P('peito-peru', 60), X('mussarela', 20), X('tomate', 60)] },
    { id: 'lanche-pao-queijo', name: 'Pão de queijo e fruta', tip: 'Pão de queijo assado com uma fruta e um copo de leite.', slots: [E('pao-queijo', 60), P('leite-integral', 200, liquid), E('maca', 130)] },
  ],
  almoco: [
    { id: 'alm-arroz-feijao-frango', name: 'Arroz, feijão e frango', tip: 'O clássico: frango grelhado, arroz, feijão e salada com azeite.', portable: true, slots: [E('arroz', 200), E('feijao-carioca', 100, { min: 0.8, max: 1.5 }), P('frango-peito', 120), ...salada, X('azeite', 8)] },
    { id: 'alm-arroz-feijao-patinho', name: 'Arroz, feijão e patinho', tip: 'Bife de patinho na chapa com salada colorida.', portable: true, slots: [E('arroz', 200), E('feijao-carioca', 100, { min: 0.8, max: 1.5 }), P('patinho', 110), ...salada, X('azeite', 8)] },
    { id: 'alm-arroz-feijao-tilapia', name: 'Arroz, feijão e tilápia', tip: 'Tilápia grelhada com limão.', slots: [E('arroz', 200), E('feijao-carioca', 100, { min: 0.8, max: 1.5 }), P('tilapia', 150), ...salada, X('azeite', 8)] },
    { id: 'alm-macarrao-moida', name: 'Macarrão com carne moída', tip: 'Molho de tomate caseiro com a carne moída refogada.', portable: true, slots: [E('macarrao', 220), P('carne-moida', 100), X('tomate', 100), X('alface', 40), X('azeite', 8)] },
    { id: 'alm-sobrecoxa', name: 'Arroz, feijão e sobrecoxa', tip: 'Sobrecoxa assada sem pele: barata e saborosa.', portable: true, slots: [E('arroz', 200), E('feijao-preto', 100, { min: 0.8, max: 1.5 }), P('frango-sobrecoxa', 120), X('couve', 30), ...salada] },
    { id: 'alm-mandioca-sardinha', name: 'Mandioca, feijão e sardinha', tip: 'Sardinha em lata refogada com cebola e tomate.', slots: [E('mandioca', 180), E('feijao-preto', 100, { min: 0.8, max: 1.5 }), P('sardinha', 84), ...salada, X('azeite', 6)] },
    { id: 'alm-vegetariano', name: 'Arroz, lentilha e ovos', tip: 'Sem carne: lentilha, arroz e ovos mexidos.', slots: [E('arroz', 180), E('lentilha', 120, { min: 0.8, max: 1.5 }), P('ovo', 100), X('couve', 30), ...salada] },
    { id: 'alm-vegetal', name: 'Arroz, grão-de-bico e tofu', tip: 'Tofu grelhado com ervas e grão-de-bico temperado.', slots: [E('arroz', 180), E('grao-de-bico', 100, { min: 0.8, max: 1.5 }), P('tofu', 150), ...salada, X('azeite', 8)] },
  ],
  pre: [
    { id: 'pre-tapioca', name: 'Tapioca com banana e whey', tip: 'Digestão leve para treinar bem: tapioca, banana e uma dose de whey no leite.', slots: [E('tapioca', 80), E('banana-prata', 100), P('whey', 20), X('pasta-amendoim', 10)] },
    { id: 'pre-pao-pasta', name: 'Pão, banana e pasta de amendoim', tip: 'Energia rápida e barata, 40 a 60 minutos antes.', portable: true, slots: [E('pao-integral', 50), E('banana-prata', 100), X('pasta-amendoim', 20), P('ovo', 50)] },
    { id: 'pre-batata-frango', name: 'Batata-doce e frango', tip: 'Boa opção se treina mais tarde: carboidrato com proteína magra.', portable: true, slots: [E('batata-doce', 200), P('frango-peito', 80)] },
    { id: 'pre-aveia-whey', name: 'Aveia com banana e leite', tip: 'Mingau de aveia rápido no micro-ondas.', portable: true, slots: [E('aveia', 40), E('banana-prata', 100), E('leite-integral', 200, liquid), P('whey', 15)] },
    { id: 'pre-vegetal', name: 'Pão com tofu e banana', tip: 'Versão sem leite e sem carne.', portable: true, slots: [E('pao-integral', 50), P('tofu', 100), E('banana-prata', 100), X('pasta-amendoim', 10)] },
  ],
  jantar: [
    { id: 'jan-batata-patinho', name: 'Batata-doce, patinho e legumes', tip: 'Patinho grelhado, batata-doce assada e brócolis no vapor.', portable: true, slots: [E('batata-doce', 250), P('patinho', 110), ...legumes, X('azeite', 6)] },
    { id: 'jan-arroz-frango', name: 'Arroz, frango e legumes', tip: 'Prato leve para fechar o dia.', portable: true, slots: [E('arroz', 180), P('frango-peito', 120), ...legumes, X('azeite', 8)] },
    { id: 'jan-omelete-mandioca', name: 'Omelete e mandioca', tip: 'Omelete de 3 ovos com legumes e mandioca cozida.', slots: [P('ovo', 150), E('mandioca', 180), X('queijo-minas', 20), X('tomate', 80), X('azeite', 4)] },
    { id: 'jan-tilapia-batata', name: 'Tilápia com batata e legumes', tip: 'Tilápia no forno com limão e batata rústica.', slots: [P('tilapia', 150), E('batata', 250), ...legumes, X('azeite', 8)] },
    { id: 'jan-macarrao-atum', name: 'Macarrão com atum', tip: 'Atum ao natural, tomate e azeite: pronto em 15 minutos.', portable: true, slots: [E('macarrao', 220), P('atum', 100), X('tomate', 100), X('azeite', 8)] },
    { id: 'jan-vegetariano', name: 'Arroz, feijão preto e ovos', tip: 'Simples e completo, sem carne.', slots: [E('arroz', 180), E('feijao-preto', 100, { min: 0.8, max: 1.5 }), P('ovo', 100), ...legumes] },
    { id: 'jan-vegetal', name: 'Arroz, lentilha e tofu', tip: 'Tofu salteado com legumes.', slots: [E('arroz', 180), E('lentilha', 100, { min: 0.8, max: 1.5 }), P('tofu', 150), ...legumes] },
  ],
  ceia: [
    { id: 'ceia-leite-aveia', name: 'Leite com aveia e pasta de amendoim', tip: 'Aqueça o leite com a aveia e misture a pasta.', slots: [E('leite-integral', 250, liquid), E('aveia', 40), X('pasta-amendoim', 15), P('whey', 10, { min: 0.01, max: 3 })] },
    { id: 'ceia-iogurte-aveia', name: 'Iogurte com aveia e pasta', tip: 'Leve, rico em proteína e fácil de preparar.', portable: true, slots: [P('iogurte-grego', 150), E('aveia', 40), X('pasta-amendoim', 15)] },
    { id: 'ceia-cottage-fruta', name: 'Cottage com fruta e chia', tip: 'Cottage com mamão em cubos e chia por cima.', portable: true, slots: [P('cottage', 120), E('mamao', 150), E('banana-prata', 80), X('chia', 10)] },
    { id: 'ceia-vegetal', name: 'Bebida de soja com aveia e banana', tip: 'Sem lactose e sem carne.', slots: [E('leite-vegetal', 250, liquid), E('aveia', 40), E('banana-prata', 80), X('pasta-amendoim', 15)] },
  ],
};
