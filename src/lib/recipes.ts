/** Receitas simples com os alimentos do catálogo: macros calculados pelos ingredientes e filtradas pelas preferências. */
import { foodById, macrosOf, mustFood, portionText, type Food } from './plan-foods';
import { usable } from './plan-engine';
import type { Prefs } from './plan-engine';

export type Recipe = { id: string; name: string; meal: string; minutes: number; servings: number; ingredients: [string, number][]; steps: string[]; tip?: string };

export const RECIPES: Recipe[] = [
  { id: 'panqueca-banana', name: 'Panqueca de banana e aveia', meal: 'Café da manhã', minutes: 10, servings: 1, ingredients: [['banana-prata', 160], ['ovo', 100], ['aveia', 40], ['pasta-amendoim', 15]],
    steps: ['Amasse a banana com um garfo.', 'Misture os ovos crus e a aveia até formar uma massa.', 'Doure em frigideira antiaderente, 2 minutos de cada lado.', 'Sirva com a pasta de amendoim por cima.'], tip: 'Dá para fazer a massa na véspera e guardar na geladeira.' },
  { id: 'omelete-recheada', name: 'Omelete de queijo e tomate', meal: 'Jantar', minutes: 8, servings: 1, ingredients: [['ovo', 150], ['queijo-minas', 30], ['tomate', 80], ['azeite', 4]],
    steps: ['Bata os ovos com uma pitada de sal.', 'Aqueça o azeite na frigideira e despeje os ovos.', 'Coloque o queijo e o tomate picado e dobre ao meio.', 'Tampe 1 minuto para derreter.'] },
  { id: 'vitamina-calorica', name: 'Vitamina calórica de banana', meal: 'Lanche', minutes: 5, servings: 1, ingredients: [['leite-integral', 300], ['banana-prata', 100], ['aveia', 30], ['pasta-amendoim', 15], ['whey', 20]],
    steps: ['Bata todos os ingredientes no liquidificador com gelo.', 'Sirva na hora.'], tip: 'Boa para quem tem pouco apetite: calorias sem encher o prato.' },
  { id: 'arroz-frango-cremoso', name: 'Arroz com frango desfiado e legumes', meal: 'Almoço', minutes: 25, servings: 1, ingredients: [['arroz', 200], ['frango-desfiado', 120], ['cenoura', 50], ['abobrinha', 60], ['azeite', 8]],
    steps: ['Refogue a cenoura e a abobrinha picadas no azeite.', 'Junte o arroz cozido e o frango desfiado.', 'Acerte o sal e finalize com salsinha.'], tip: 'Rende marmita para o plantão: guarde até 3 dias na geladeira.' },
  { id: 'carne-moida-batata', name: 'Carne moída com purê de batata-doce', meal: 'Jantar', minutes: 30, servings: 1, ingredients: [['batata-doce', 250], ['carne-moida', 110], ['tomate', 80], ['brocolis', 60], ['azeite', 6]],
    steps: ['Cozinhe e amasse a batata-doce.', 'Refogue a carne moída com tomate picado e temperos.', 'Cozinhe o brócolis no vapor.', 'Monte o prato com o purê, a carne e o brócolis.'] },
  { id: 'tapioca-recheada', name: 'Tapioca de ovo com queijo', meal: 'Café da manhã', minutes: 7, servings: 1, ingredients: [['tapioca', 80], ['ovo', 100], ['queijo-minas', 30]],
    steps: ['Espalhe a goma na frigideira quente até formar o disco.', 'Faça os ovos mexidos à parte.', 'Recheie com ovos e queijo e dobre.'] },
  { id: 'iogurte-bowl', name: 'Bowl de iogurte, aveia e frutas', meal: 'Lanche', minutes: 3, servings: 1, ingredients: [['iogurte-grego', 170], ['aveia', 30], ['banana-prata', 80], ['morango', 60], ['chia', 6]],
    steps: ['Coloque o iogurte numa tigela.', 'Cubra com aveia, fruta picada e chia.'] },
  { id: 'macarrao-atum', name: 'Macarrão com atum e tomate', meal: 'Jantar', minutes: 15, servings: 1, ingredients: [['macarrao', 220], ['atum', 100], ['tomate', 120], ['azeite', 8]],
    steps: ['Cozinhe o macarrão al dente.', 'Refogue o tomate picado no azeite por 3 minutos.', 'Junte o atum escorrido e misture ao macarrão.'] },
  { id: 'arroz-feijao-ovo', name: 'Arroz, feijão e ovo frito na frigideira antiaderente', meal: 'Almoço', minutes: 10, servings: 1, ingredients: [['arroz', 220], ['feijao-carioca', 130], ['ovo', 100], ['couve', 40], ['azeite', 6]],
    steps: ['Refogue a couve rapidamente no azeite.', 'Frite os ovos na frigideira antiaderente com um fio de óleo.', 'Monte o prato: arroz, feijão, couve e os ovos.'], tip: 'Versão econômica e vegetariana com boa proteína.' },
  { id: 'cuscuz-recheado', name: 'Cuscuz com ovos e queijo', meal: 'Café da manhã', minutes: 12, servings: 1, ingredients: [['cuscuz', 160], ['ovo', 100], ['queijo-minas', 25], ['azeite', 4]],
    steps: ['Hidrate e cozinhe o cuscuz no vapor.', 'Faça os ovos mexidos com o azeite.', 'Misture o queijo picado ao cuscuz e sirva com os ovos.'] },
  { id: 'batata-frango-forno', name: 'Frango e batata-doce assados', meal: 'Pré-treino', minutes: 35, servings: 1, ingredients: [['frango-peito', 100], ['batata-doce', 220], ['azeite', 5]],
    steps: ['Tempere o frango com limão, alho e sal.', 'Corte a batata-doce em cubos e regue com azeite.', 'Asse tudo a 200 °C por 25 a 30 minutos.'], tip: 'Faça para 3 dias e porcione.' },
  { id: 'pasta-tofu', name: 'Tofu mexido com legumes', meal: 'Almoço', minutes: 15, servings: 1, ingredients: [['tofu', 150], ['arroz', 180], ['brocolis', 60], ['cenoura', 50], ['azeite', 8]],
    steps: ['Esfarele o tofu e salteie no azeite com cúrcuma e sal.', 'Junte o brócolis e a cenoura cozidos.', 'Sirva com o arroz.'] },
  { id: 'mingau-aveia', name: 'Mingau de aveia com banana', meal: 'Ceia', minutes: 5, servings: 1, ingredients: [['leite-integral', 250], ['aveia', 40], ['banana-prata', 80], ['pasta-amendoim', 10]],
    steps: ['Aqueça o leite com a aveia por 3 minutos, mexendo.', 'Adicione a banana em rodelas e a pasta de amendoim.'] },
];

export type RecipeView = { recipe: Recipe; foods: { food: Food; grams: number; text: string }[]; kcal: number; p: number; c: number; f: number };

export function recipeView(r: Recipe): RecipeView {
  const foods = r.ingredients.map(([id, grams]) => { const food = mustFood(id); return { food, grams, text: portionText(food, grams) }; });
  const sum = (k: 'kcal' | 'p' | 'c' | 'f') => Math.round(foods.reduce((a, x) => a + macrosOf(x.food, x.grams)[k], 0));
  return { recipe: r, foods, kcal: sum('kcal'), p: sum('p'), c: sum('c'), f: sum('f') };
}

/** Receitas cujos ingredientes respeitam as preferências (alergias, vegetariano, exclusões). */
export const recipesFor = (prefs: Prefs, meal?: string) =>
  RECIPES.filter(r => (!meal || r.meal === meal) && r.ingredients.every(([id]) => { const f = foodById(id); return !!f && usable(f, prefs); })).map(recipeView);
