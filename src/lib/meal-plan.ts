import { portionMacros } from './nutrition';
export const mealNames = ['Café da manhã','Lanche','Almoço','Pré-treino','Jantar','Ceia'] as const;
export const mealTimes = ['07:00','10:00','12:30','16:00','19:30','21:30'];
export const planOptions: Record<string, {normal:[string,number][];alternative:[string,number][];shift:[string,number][]}> = {
  'Café da manhã': {normal:[['Ovo cozido',100],['Pão integral',75],['Banana-prata',80]],alternative:[['Iogurte natural',170],['Aveia em flocos',60],['Whey protein',15],['Banana-prata',80]],shift:[['Ovo cozido',100],['Pão integral',75],['Banana-prata',80]]},
  'Lanche': {normal:[['Iogurte natural',170],['Aveia em flocos',40],['Castanha-do-pará',10]],alternative:[['Leite integral',200],['Whey protein',15],['Banana-prata',100],['Pasta de amendoim',15]],shift:[['Leite integral',200],['Whey protein',15],['Banana-prata',100],['Pasta de amendoim',15]]},
  'Almoço': {normal:[['Arroz branco cozido',250],['Feijão carioca cozido',100],['Peito de frango grelhado',120],['Azeite de oliva',8]],alternative:[['Arroz branco cozido',230],['Feijão carioca cozido',100],['Tilápia grelhada',150],['Azeite de oliva',10]],shift:[['Arroz branco cozido',250],['Feijão carioca cozido',100],['Peito de frango grelhado',120],['Azeite de oliva',8]]},
  'Pré-treino': {normal:[['Tapioca preparada',80],['Banana-prata',100],['Pasta de amendoim',20]],alternative:[['Pão integral',75],['Banana-prata',100],['Pasta de amendoim',20]],shift:[['Pão integral',75],['Banana-prata',100],['Pasta de amendoim',20]]},
  'Jantar': {normal:[['Batata-doce cozida',300],['Patinho grelhado',100],['Azeite de oliva',5]],alternative:[['Arroz branco cozido',180],['Peito de frango grelhado',100],['Azeite de oliva',12]],shift:[['Arroz branco cozido',180],['Peito de frango grelhado',100],['Azeite de oliva',12]]},
  'Ceia': {normal:[['Leite integral',250],['Aveia em flocos',40],['Pasta de amendoim',15]],alternative:[['Iogurte natural',170],['Aveia em flocos',40],['Pasta de amendoim',25]],shift:[['Iogurte natural',170],['Aveia em flocos',40],['Pasta de amendoim',25]]},
};
type Food = {name:string;calories:number;protein:number;fat:number;carbs:number;portion_label:string;portion_grams:number};
export function getMeal(foods:Food[],meal:string,shift=false,alternative=false) {
 const option=planOptions[meal];if(!option)return [];
 const selected=alternative?option.alternative:shift?option.shift:option.normal;
 return selected.flatMap(([name,grams])=>{const food=foods.find(f=>f.name===name);return food?[{...food,grams,...portionMacros(food,grams)}]:[];});
}