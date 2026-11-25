import { FOODS, type Food, type Group, type Tag } from './plan-foods';
/** Catálogo de alimentos brasileiros (valores por 100 g, aproximados da tabela TACO). */
export type FoodGroup = 'proteina'|'carboidrato'|'leguminosa'|'fruta'|'verdura'|'laticinio'|'gordura'|'suplemento'|'outros';
export type CatalogFood = { name:string; food_group:FoodGroup; calories:number; protein:number; carbs:number; fat:number; portion_label:string; portion_grams:number; tags:string[] };
type Row = [string, FoodGroup, number, number, number, number, string, number, string?];
const rows: Row[] = [
 // Proteínas
 ['Peito de frango grelhado','proteina',159,32,0,2.5,'1 filé médio',100,'economico'],
 ['Coxa de frango assada','proteina',215,28.5,0,11,'1 coxa',90,'economico'],
 ['Frango desfiado','proteina',163,31,0,3.5,'3 colheres de sopa',60,'economico'],
 ['Patinho grelhado','proteina',219,35.9,0,7.3,'1 bife médio',100,'carne_vermelha'],
 ['Carne moída refogada','proteina',212,26.7,0,10.9,'3 colheres de sopa',75,'carne_vermelha'],
 ['Alcatra grelhada','proteina',241,31.9,0,11.6,'1 bife médio',100,'carne_vermelha'],
 ['Fígado bovino grelhado','proteina',225,29.9,4.2,9,'1 bife',100,'carne_vermelha,economico'],
 ['Lombo de porco assado','proteina',210,35.7,0,6.4,'1 fatia grossa',100,'carne_vermelha'],
 ['Tilápia grelhada','proteina',128,26,0,2.7,'1 filé',120,'peixe'],
 ['Sardinha em lata','proteina',208,24.6,0,11.9,'1 lata drenada',84,'peixe,economico'],
 ['Atum em lata (água)','proteina',116,25.5,0,0.8,'1 lata drenada',120,'peixe'],
 ['Salmão grelhado','proteina',243,26.1,0,14.5,'1 posta',120,'peixe'],
 ['Merluza cozida','proteina',122,26.6,0,0.9,'1 filé',100,'peixe'],
 ['Ovo cozido','proteina',146,13.3,0.6,9.5,'1 unidade',50,'economico'],
 ['Ovo mexido','proteina',190,12.6,1,15,'2 ovos',100,'economico'],
 ['Clara de ovo cozida','proteina',52,10.9,0.7,0.2,'1 clara',33,'economico'],
 ['Peito de peru fatiado','proteina',109,19,2,2.5,'2 fatias',30,''],
 ['Tofu','proteina',76,8.1,1.9,4.8,'1 fatia grossa',80,''],
 // Carboidratos
 ['Arroz branco cozido','carboidrato',128,2.5,28.1,0.2,'1 colher de sopa',25,'economico'],
 ['Arroz integral cozido','carboidrato',124,2.6,25.8,1,'1 colher de sopa',25,''],
 ['Macarrão cozido','carboidrato',157,5.8,30.7,1.2,'1 pegador',110,'gluten,economico'],
 ['Macarrão integral cozido','carboidrato',124,5.3,26.5,0.5,'1 pegador',110,'gluten'],
 ['Cuscuz de milho','carboidrato',113,2.2,25.3,0.7,'1 fatia',100,'economico'],
 ['Batata-doce cozida','carboidrato',77,0.6,18.4,0.1,'1 unidade pequena',100,'economico'],
 ['Batata inglesa cozida','carboidrato',52,1.2,11.9,0,'1 unidade média',130,'economico'],
 ['Mandioca cozida','carboidrato',125,0.6,30.1,0.3,'1 pedaço',100,'economico'],
 ['Inhame cozido','carboidrato',97,2.1,23.2,0.1,'1 pedaço',100,''],
 ['Mandioquinha cozida','carboidrato',80,0.9,18.9,0.2,'1 unidade',100,''],
 ['Polenta cozida','carboidrato',70,1.6,15.3,0.3,'1 fatia',100,'economico'],
 ['Tapioca preparada','carboidrato',230,0.2,57.5,0,'1 unidade média',60,''],
 ['Pão francês','carboidrato',300,8,58.6,3.1,'1 unidade',50,'gluten,economico'],
 ['Pão integral','carboidrato',253,9.4,49.9,3.7,'1 fatia',25,'gluten'],
 ['Pão de forma','carboidrato',253,7.5,49,2.7,'1 fatia',25,'gluten'],
 ['Pão de queijo','carboidrato',363,5.1,34.2,24.6,'1 unidade média',40,'lactose'],
 ['Wrap integral','carboidrato',300,8,50,7,'1 unidade',40,'gluten'],
 ['Aveia em flocos','carboidrato',394,13.9,66.6,8.5,'1 colher de sopa',15,'gluten'],
 ['Granola','carboidrato',421,10,64,14,'2 colheres de sopa',25,'gluten'],
 ['Milho verde cozido','carboidrato',98,3.2,17.1,2.4,'3 colheres de sopa',60,''],
 ['Farinha de mandioca','carboidrato',365,1.6,87.9,0.3,'1 colher de sopa',16,'economico'],
 ['Biscoito de arroz','carboidrato',380,8,80,3,'1 unidade',9,''],
 // Leguminosas
 ['Feijão carioca cozido','leguminosa',76,4.8,13.6,0.5,'1 concha',100,'economico'],
 ['Feijão preto cozido','leguminosa',77,4.5,14,0.5,'1 concha',100,'economico'],
 ['Lentilha cozida','leguminosa',93,6.3,16.3,0.5,'1 concha',100,''],
 ['Grão-de-bico cozido','leguminosa',130,7,21,2.1,'1 concha',100,''],
 ['Ervilha cozida','leguminosa',74,5.4,13,0.4,'3 colheres de sopa',60,''],
 // Frutas
 ['Banana-prata','fruta',98,1.3,26,0.1,'1 unidade',80,'economico'],
 ['Maçã','fruta',56,0.3,15.2,0,'1 unidade',130,''],
 ['Mamão papaia','fruta',40,0.5,10.4,0.1,'1/2 unidade',150,''],
 ['Laranja-pera','fruta',37,1,8.9,0.1,'1 unidade',150,'economico'],
 ['Manga','fruta',64,0.4,16.7,0.3,'1 fatia grande',120,''],
 ['Abacaxi','fruta',48,0.9,12.3,0.1,'1 fatia',100,''],
 ['Melancia','fruta',33,0.9,8.1,0,'1 fatia',200,'economico'],
 ['Uva','fruta',53,0.7,13.6,0.2,'1 cacho pequeno',100,''],
 ['Morango','fruta',30,0.9,6.8,0.3,'10 unidades',120,''],
 ['Abacate','fruta',96,1.2,6,8.4,'2 colheres de sopa',60,''],
 ['Açaí (polpa, sem açúcar)','fruta',58,0.8,6.2,3.9,'1 pacote',100,''],
 ['Uva-passa','fruta',299,3.1,79,0.5,'1 colher de sopa',15,''],
 // Verduras e legumes
 ['Salada de folhas','verdura',15,1.3,2.5,0.2,'1 prato de sobremesa',50,'economico'],
 ['Tomate','verdura',15,1.1,3.1,0.2,'1 unidade',100,'economico'],
 ['Brócolis cozido','verdura',25,2.1,4.4,0.5,'3 ramos',60,''],
 ['Cenoura crua','verdura',34,1.3,7.7,0.2,'1 unidade média',80,'economico'],
 ['Abobrinha refogada','verdura',30,1.1,4.5,1,'3 colheres de sopa',80,''],
 ['Couve refogada','verdura',90,1.7,8.7,6.6,'2 colheres de sopa',40,'economico'],
 ['Beterraba cozida','verdura',32,1.3,7.2,0.1,'3 fatias',60,''],
 ['Chuchu cozido','verdura',19,0.4,4.8,0,'3 colheres de sopa',80,'economico'],
 ['Vagem cozida','verdura',25,1.8,5.3,0.2,'3 colheres de sopa',60,''],
 // Laticínios
 ['Leite integral','laticinio',61,2.9,4.3,3.3,'1 copo',200,'lactose'],
 ['Leite desnatado','laticinio',35,3.4,4.9,0.2,'1 copo',200,'lactose'],
 ['Leite sem lactose','laticinio',50,3,4.8,2,'1 copo',200,''],
 ['Iogurte natural','laticinio',51,4.1,1.9,3,'1 pote',170,'lactose'],
 ['Iogurte grego','laticinio',100,6,5,6.5,'1 pote',100,'lactose'],
 ['Iogurte proteico','laticinio',60,9,5,0.5,'1 pote',160,'lactose'],
 ['Queijo minas frescal','laticinio',264,17.4,3.2,20.2,'1 fatia',30,'lactose'],
 ['Queijo muçarela','laticinio',330,22.6,3,25.2,'2 fatias',30,'lactose'],
 ['Queijo cottage','laticinio',98,11,3.4,4.3,'2 colheres de sopa',50,'lactose'],
 ['Requeijão light','laticinio',180,10,3,14,'1 colher de sopa',30,'lactose'],
 ['Bebida de soja','laticinio',40,3,3,2,'1 copo',200,''],
 // Gorduras
 ['Azeite de oliva','gordura',884,0,0,100,'1 colher de sopa',13,''],
 ['Pasta de amendoim','gordura',588,25,20,50,'1 colher de sopa',15,''],
 ['Amendoim torrado','gordura',606,22.5,18.7,54,'1 punhado',20,'economico'],
 ['Castanha-do-pará','gordura',643,14.5,15.1,63.5,'2 unidades',10,''],
 ['Castanha de caju','gordura',570,18.5,29.1,46.3,'1 punhado',20,''],
 ['Nozes','gordura',620,14,18,59,'3 unidades',15,''],
 ['Manteiga','gordura',726,0.4,0,82.4,'1 ponta de faca',5,'lactose'],
 ['Chia','gordura',486,16.5,42,30.7,'1 colher de sopa',12,''],
 // Suplementos
 ['Whey protein','suplemento',400,80,8,6,'1 medida',30,'lactose'],
 ['Mel','outros',309,0,84,0,'1 colher de sopa',20,''],
];
/** Nomes antigos que já existem no catálogo do plano com outro nome: ficam fora para não duplicar valores. */
const ALIASES = new Set(['Coxa de frango assada','Frango desfiado','Lombo de porco assado','Sardinha em lata','Atum em lata (água)','Peito de peru fatiado','Cuscuz de milho','Tapioca preparada','Pão integral','Pão de queijo','Queijo muçarela','Requeijão light','Iogurte grego','Castanha de caju','Açaí (polpa, sem açúcar)','Abobrinha refogada','Cenoura crua','Salada de folhas']);
const norm = (n: string) => n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const GROUP: Record<Group, FoodGroup> = { proteina: 'proteina', carbo: 'carboidrato', leguminosa: 'leguminosa', fruta: 'fruta', verdura: 'verdura', laticinio: 'laticinio', gordura: 'gordura' };
const TAG: Record<Tag, string | null> = { lactose: 'lactose', gluten: 'gluten', meat: 'carne', redmeat: 'carne_vermelha', fish: 'peixe', egg: 'ovo' };
/** Alimento do plano no formato do diário: fonte única de nome, macros e porção caseira. */
export function catalogFromPlan(f: Food): CatalogFood {
  const tags = f.tags.map(t => TAG[t]).filter((t): t is string => !!t);
  if (f.cost === 1) tags.push('economico');
  return { name: f.name, food_group: f.id === 'whey' ? 'suplemento' : GROUP[f.group], calories: f.kcal, protein: f.p, carbs: f.c, fat: f.f,
    portion_label: f.unit ? `1 ${f.unit.s}` : '100 g', portion_grams: f.unit?.grams ?? 100, tags };
}
const planNames = new Set(FOODS.map(f => norm(f.name)));
const extras: CatalogFood[] = rows.filter(r => !ALIASES.has(r[0]) && !planNames.has(norm(r[0])))
  .map(([name,food_group,calories,protein,carbs,fat,portion_label,portion_grams,tags]) => ({name,food_group,calories,protein,carbs,fat,portion_label,portion_grams,tags:tags?tags.split(',').filter(Boolean):[]}));
/** Catálogo único: alimentos do plano + poucos extras só do diário (mel, wrap, biscoito de arroz…). */
export const foodCatalog: CatalogFood[] = [...FOODS.map(catalogFromPlan), ...extras];
