# MassaFit — o que falta para um app completo e premium

## Já pronto (etapas 1 e 2)
- Cadastro por e-mail e Google, perfil e metas calculadas e editáveis.
- Painel diário, plano com 6 refeições, diário alimentar, água, peso e creatina.
- Prévia para visitantes e instalação na tela inicial.

## Falta verificar
- Testar com uma conta real: cadastro, perfil, registrar refeição/água/peso e ver os dados após recarregar.

## Etapa 3 — Treino ABCD
- Biblioteca de exercícios (peito/tríceps, costas/bíceps, pernas, ombros/core) com plano 4x por semana.
- Registro de carga e repetições por série, cronômetro de descanso.
- Sugestão de dupla progressão e gráfico de evolução por exercício.
- "Treino do dia" aparece no painel.

## Etapa 4 — Medidas e check-in semanal
- Gráfico de peso com média móvel de 7 dias.
- Medidas semanais (cintura, peito, braço, coxa) e fotos de progresso lado a lado (privadas).
- Check-in semanal: compara o ritmo com a meta e sugere ajuste de calorias (aceitar/recusar); alerta se o peso sobe e as cargas não.

## Etapa 5 — Rotina e extras
- Lista de compras semanal gerada do plano, por seção do mercado.
- Saúde: exames (B12, vitamina D, ferro, zinco, glicemia, colesterol) com lembrete a cada 6 meses; aviso fixo de que o app não substitui médico ou nutricionista.
- Lembretes por notificação no celular (refeições, água, treino, pesagem).
- Exportar dados em CSV.

## Acabamento premium
- Navegação inferior com Hoje, Plano, Treino, Progresso e Mais.
- Anéis animados, transições suaves, estados de carregando/vazio/erro em todas as telas.
- Botões grandes, alto contraste e revisão no celular.

## Detalhes técnicos
- Novas tabelas com RLS por dono: exercises, workout_plans, workout_logs, set_logs, measurements, progress_photos (bucket privado), weekly_checkins, lab_results, reminders; seed de exercícios.
- Regras de progressão e check-in em módulo puro com testes numéricos.
- Lembretes via Notification API do navegador enquanto o app estiver aberto/instalado (sem offline caching).
