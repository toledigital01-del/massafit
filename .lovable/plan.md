# Plano alimentar flexível e personalizado

Hoje o plano tem 6 refeições fixas, cada uma com só 2 opções (normal/alternativa), usando 17 alimentos e quantidades que não mudam com a meta da pessoa. A proposta é transformar isso num plano montado para cada usuário, com trocas livres.

## 1. Mais variedade de alimentos
- Base ampliada para cerca de 150 alimentos brasileiros (tabela TACO), organizados por grupo: proteínas (frango, patinho, ovos, tilápia, sardinha, carne moída, queijo cottage...), carboidratos (arroz, macarrão, cuscuz, mandioca, batata, inhame, tapioca, pão francês...), leguminosas, frutas, verduras, laticínios e gorduras.
- Medidas caseiras: colher de sopa, concha, unidade, fatia.

## 2. Trocas inteligentes ("trocar alimento")
- Em cada item do plano, um botão "Trocar" mostra substitutos do mesmo grupo, já com a quantidade ajustada para dar as mesmas calorias e proteína (ex.: 120 g de frango ≈ 3 ovos + 1 clara ≈ 140 g de tilápia).
- Trocar uma refeição inteira por outro cardápio pronto (ex.: almoço "arroz e feijão", "macarrão com carne moída", "cuscuz com ovos").

## 3. Plano gerado pelas metas da pessoa
- As quantidades são calculadas automaticamente para fechar as metas de calorias, proteína, carboidrato e gordura do dia.
- Divisão configurável: número de refeições (4 a 6), horários e quanto cada refeição pesa no dia.
- Mais carboidrato antes e depois do treino nos dias de treino; versão "dia de descanso".
- Mostra quanto falta ou sobra para a meta depois de cada troca.

## 4. Preferências e restrições
- Escolher alimentos de que não gosta, alergias (lactose, glúten) e estilo (sem carne vermelha, vegetariano).
- Orçamento: opção "econômica", com mais ovos, frango, feijão e sardinha.
- O plano e as trocas respeitam essas escolhas.

## 5. Uso no dia a dia
- "Comi o plano": registra a refeição planejada no diário com um toque (ou com as trocas feitas).
- Salvar cardápios favoritos e repetir semanas.
- Plano da semana (7 dias com variação), com lista de compras gerada a partir dele.
- Ideias de receitas simples para cada refeição.

## 6. Ajustes automáticos
- Quando o check-in semanal sugere +175 ou −150 kcal, o plano se ajusta sozinho e mostra onde a comida foi aumentada ou reduzida.

## Ordem sugerida
1. Mais alimentos e trocas equivalentes (itens 1 e 2)
2. Plano calculado pelas metas e dias de treino (item 3)
3. Preferências e restrições (item 4)
4. "Comi o plano", favoritos, plano semanal e lista de compras (item 5)
5. Ajuste automático pelo check-in (item 6)

## Detalhes técnicos
- As regras de troca (equivalência por calorias e proteína, arredondadas para medidas caseiras) e o cálculo das quantidades ficam num módulo separado e testado, como as fórmulas de nutrição.
- Novas tabelas: grupo do alimento e medidas caseiras em food_items (só adicionar colunas), preferências do usuário, e o plano salvo por usuário (refeições, itens e gramas), com acesso só do próprio usuário.
- Novos alimentos são adicionados com dados da TACO.
