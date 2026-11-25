# MassaFit: análise, correções e próximos passos

## O que encontrei (alimentos e lista de compras)

1. **Três listas de alimentos que não conversam.** O diário de quem está logado usa só 17 alimentos do banco. A prévia usa cerca de 90, e o plano alimentar usa uma terceira lista própria. Vários alimentos do plano (alface, brócolis, lentilha, sardinha, tofu, cottage, maçã, mamão…) não existem no diário.
2. **Valores diferentes para o mesmo alimento.** Exemplos: macarrão cozido aparece com 157 kcal numa lista e 102 kcal na outra; manga, clara, leite e iogurte proteico também divergem. Castanha-do-pará e carne moída têm porções diferentes, e o milho aparece duas vezes com valores distintos.
3. **A semana do plano e a lista de compras não batem.** A aba "Semana" ignora as trocas que você salvou, mas a lista de compras considera essas trocas. Os plantões só existem na lista de compras, onde caem sempre nos primeiros dias. A lista de 30 dias multiplica a semana e gera itens fracionados, como "4,3 ovos".
4. **Restrições podem ser furadas.** Quando nenhuma opção respeita a restrição, o plano volta para as opções normais. Isso pode trazer lactose, carne ou ovo de volta, e uma troca antiga também continua valendo depois de você mudar as preferências.
5. **Metas parcialmente respeitadas.** O plano ajusta calorias e proteína, mas não carboidrato e gordura. Às vezes ele também reduz a proteína sem avisar e mostra outra meta na tela. Com menos de 1.700 kcal, ele força 4 refeições mesmo se você escolher 5 ou 6.
6. **Outros pontos:**
   - O início ainda mostra o almoço do plano antigo.
   - Os dias de treino são fixos (Seg/Ter/Qui/Sex), mesmo que o perfil diga outra coisa.
   - As preferências e as marcações da lista de compras ficam no aparelho, não na conta. Por isso podem passar para outra pessoa que entre no mesmo celular.
   - O botão "desfazer" do "Comi o plano" é frágil.
   - Há termos em inglês, como "scoop" e "Close".

## Visual
- O treino e os gráficos usam algumas cores fixas que fogem do tema, o que gera pequenas diferenças de tom.
- Vou revisar todas as telas no tamanho de celular, olhando espaçamentos, telas vazias, carregamento e áreas de toque. Depois corrijo o que estiver desalinhado.

## Correções propostas (fase 1: consistência)
1. **Uma única lista de alimentos:** os cerca de 90 alimentos do plano e da prévia vão para o banco, com valores da tabela TACO unificados, grupo e etiquetas, inclusive nos 17 antigos. O diário, o plano e a lista de compras passam a usar essa mesma lista.
2. **Restrições sempre respeitadas:** se nenhuma opção servir, o app avisa em vez de furar a restrição. As trocas são revalidadas quando as preferências mudam.
3. **Plano que respeita carboidrato e gordura, além de calorias e proteína,** com um aviso claro quando a meta for ajustada.
4. **Semana do plano igual à lista de compras:** inclui as trocas, deixa escolher os dias de plantão e usa os dias de treino do perfil.
5. **Lista de compras em unidades reais:** unidades de ovo e fruta, litros de leite e peso cru para arroz, feijão e carnes. O período de 30 dias passa a seguir o calendário.
6. **Início com o plano atual**, preferências salvas na conta e "desfazer" confiável.
7. Textos 100% em português e cores só do tema.
8. Testes automáticos para o cálculo do plano, as restrições e a lista de compras.

## Sugestões a partir dos concorrentes (fase 2, você escolhe)
- **Leitor de código de barras** com produtos brasileiros (FatSecret, MyFitnessPal).
- **Meta de calorias adaptativa** pela tendência do peso, com sua aprovação (MacroFactor).
- **Copiar refeição de ontem e refeições salvas** para registrar mais rápido (todos).
- **Treino mais completo:** recordes pessoais, carga da última vez visível e esforço percebido (Hevy, Strong).
- **Resumo semanal do coach:** o que mudou e o próximo passo (MacroFactor, Tecnonutri).
- **Receitas brasileiras** com porções ajustáveis que entram na lista de compras (Tecnonutri, Yazio).
- **Lembretes** de água, refeição, treino e pesagem, com horário de silêncio (Yazio).
- **Comparar fotos de progresso** lado a lado com peso e medidas (MacroFactor, Hevy).
- **Conquistas e sequência gentil**, ou seja, metas semanais em vez de punir um dia perdido (FatSecret, Yazio).
- **Relatório para nutricionista ou personal** em PDF ou CSV.

## Detalhes técnicos
- Uma nova migração insere ou atualiza os alimentos em `food_items` com id estável (slug) e corrige grupo e etiquetas. `plan-foods.ts` e `food-catalog.ts` passam a derivar de uma fonte única.
- `plan-engine.ts`: remover o fallback `OPTIONS[type]`, validar `state.swap` com `usable()`, incluir C e G no ajuste e expor as metas efetivas.
- `buildWeek` recebe os estados salvos e os dias de plantão. A lista agrupa por id e converte para unidade de compra com fator cru/cozido.
- Preferências e marcações vão para `meal_plan_settings` por usuário.
- Os testes ficam em `src/test`.
