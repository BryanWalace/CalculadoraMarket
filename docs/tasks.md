# Tarefas — Carrinho

Status: **rascunho para revisão** (Fase 3 do processo — ver `docs/spec.md` para os RF-xx e `docs/plan.md` para a arquitetura referenciada aqui)

Organizado pela "Ordem de entrega" do pedido original: 5 etapas, cada uma entregando um app incrementalmente mais completo. Dentro de cada etapa, as tarefas seguem ordem de dependência.

**Regras válidas para toda tarefa, sem exceção:**
- Uma tarefa por vez. Ao terminar: marcar o checkbox, rodar lint + `tsc --noEmit` + testes, fazer um commit (Conventional Commits, mensagem em português), mostrar o diff e parar — nunca emendar a tarefa seguinte sem aprovação.
- Nenhuma tarefa é considerada pronta com teste vermelho, warning de lint ou erro de tipo.
- Tarefas marcadas **TDD** exigem o teste escrito e falhando antes da implementação.

## Etapa 1 — Fundação do projeto

- [x] **T-01** — Criar projeto Expo (template TypeScript), configurar `tsconfig.json` em `strict`, remover boilerplate de exemplo.
- [ ] **T-02** — Configurar ESLint + Prettier com regras que bloqueiam `any` e `@ts-ignore`.
- [ ] **T-03** — Configurar Jest (`jest-expo`) + React Native Testing Library; um teste smoke trivial validando o setup. *(plan.md ADR-06)*
- [ ] **T-04** — Configurar Husky + lint-staged rodando lint e testes no pre-commit.
- [ ] **T-05** — Criar `.gitignore` (`.env*`, `/android`, `/ios`, `node_modules`) e commit inicial do scaffolding.
- [ ] **T-06** — Instalar/configurar `expo-router` + `expo-dev-client`; `_layout.tsx` com base de tema claro/escuro. *(RF-60)*
- [ ] **T-07** — Criar rotas placeholder navegáveis entre si sem funcionalidade: `app/index.tsx`, `app/scanner/camera.tsx`, `app/scanner/confirm.tsx`, `app/history/index.tsx`, `app/history/[id].tsx`, `app/privacy.tsx`.
- [ ] **T-08** — Criar schema SQLite inicial (`src/db/schema.ts`) com `shopping_lists` e `list_items`. *(plan.md §3)*
- [ ] **T-09** — Criar `src/db/migrations.ts` com versionamento via `PRAGMA user_version` e a migração inicial. *(plan.md ADR-04)*
- [ ] **T-10** — Criar `src/db/client.ts` (abre conexão) e conectar ao app na inicialização.

## Etapa 2 — CRUD manual da lista com total funcionando

- [ ] **T-11** — **TDD** `src/lib/money.ts`: testes de `multiplyCents` (incluindo arredondamento) antes da implementação. *(RF-07, plan.md ADR-02)*
- [ ] **T-12** — **TDD** `src/lib/money.ts`: testes de `sumCents`/soma de totais antes da implementação. *(RF-02)*
- [ ] **T-13** — `src/lib/format.ts`: `formatCurrencyBRL`, `formatQuantity`, `formatCartSummary`, `formatDate`, com testes. *(RF-03)*
- [ ] **T-14** — `src/lib/validation.ts`: schemas zod de item e de lista, com testes dos limites de preço/quantidade/nome/loja/orçamento. *(RF-08, RF-09, RF-34, RF-38)*
- [ ] **T-15** — `src/db/itemsQueries.ts` e `listsQueries.ts`: CRUD parametrizado (criar lista, pegar lista ativa, adicionar/editar/remover item, listar itens).
- [ ] **T-16** — `src/features/cart/store.ts` (`useCartStore`): hydrate, addItem (item novo no topo), updateItem, removeItem, clearList; total e contadores sempre derivados dos itens. *(RF-11, plan.md ADR-01)*
- [ ] **T-17** — Tela de confirmação em modo manual: campos nome/preço/unidade/quantidade, ajuste por −/+ e digitação, subtotal ao vivo, validação zod antes de habilitar "Adicionar", botões Adicionar/Cancelar. *(RF-06, RF-07, RF-08, RF-26, RF-27)*
- [ ] **T-18** — Restringir quantidade a inteiro quando `un` e decimal quando `kg` no campo de quantidade. *(RF-09)*
- [ ] **T-19** — `CartScreen`: lista de itens, estado vazio, total fixo no rodapé com contagem de itens/unidades, botão flutuante de câmera. *(RF-01, RF-02, RF-03, RF-04, RF-05)*
- [ ] **T-20** — Editar item existente: toque no item reabre a tela de confirmação pré-preenchida em modo edição. *(RF-10)*
- [ ] **T-21** — Botões rápidos −/+ no card só para itens `un` (itens `kg` não têm botão rápido); remoção automática ao chegar a zero. *(RF-28, RF-29, RF-30)*
- [ ] **T-22** — Excluir item por swipe/lixeira com snackbar de desfazer de 5s (soft-delete agendado); exclusão definitiva apaga a foto associada. *(RF-31, RF-32, RF-56, plan.md ADR-05)*
- [ ] **T-23** — Limpar lista inteira com diálogo de confirmação prévio; apaga as fotos dos itens removidos. *(RF-33, RF-56)*
- [ ] **T-24** — Persistência automática do carrinho a cada alteração + restauração do carrinho e do histórico ao reabrir o app. *(RF-51, RF-52)*
- [ ] **T-25** — Teste de integração: adicionar item manualmente → subtotal e total geral corretos no rodapé.

## Etapa 3 — Câmera, OCR, parsing e confirmação automática

- [ ] **T-26** — Instalar/configurar `expo-camera`; tela explicativa de permissão antes da primeira solicitação (só pedida no momento do uso). *(RF-12, RF-54)*
- [ ] **T-27** — Tratar permissão negada: oferecer entrada manual sem travar o app. *(RF-13)*
- [ ] **T-28** — `CameraScreen`: preview da câmera com moldura/guia de enquadramento do preço. *(RF-14)*
- [ ] **T-29** — Capturar foto, recortar para a área da moldura (`expo-image-manipulator`) e salvar no diretório privado do app (nunca na galeria pública). *(RF-15, RF-55)*
- [ ] **T-30** — Redimensionar/comprimir a foto (largura máx. ~1080px) antes do OCR. *(RF-16)*
- [ ] **T-31** — **TDD** `src/lib/ocr-parser.ts`: testes de seleção de preço por maior altura de bounding box, contra os formatos `R$ 12,34`, `12,34`, `1.234,56`, `12.34` e valor quebrado em linhas. *(RF-17, RF-18)*
- [ ] **T-32** — **TDD** `src/lib/ocr-parser.ts`: testes ignorando código de barras, CNPJ, data e gramatura/volume como candidatos a preço. *(RF-19)*
- [ ] **T-33** — **TDD** `src/lib/ocr-parser.ts`: testes de extração de nome (linha alfabética mais longa, exclusão de palavras de ruído) e Title Case. *(RF-20, RF-21)*
- [ ] **T-34** — **TDD** `src/lib/ocr-parser.ts`: testes de detecção de unidade `kg` e do caso sem confiança (nem nome nem preço válidos). *(RF-22, RF-25)*
- [ ] **T-35** — Consolidar os testes de T-31 a T-34 em pelo menos 10 amostras reais de etiqueta, incluindo casos que devem falhar (cobertura obrigatória do pedido original).
- [ ] **T-36** — `src/features/scanner/scanLabel.ts`: adaptador ML Kit → `OcrBlock[]` e orquestração câmera → recorte → OCR → parser. *(plan.md ADR-03)*
- [ ] **T-37** — Integrar `scanLabel` à tela de confirmação: pré-preencher nome/preço/unidade/quantidade com o resultado do OCR. *(RF-23)*
- [ ] **T-38** — Tratar extração parcial: pré-preencher só os campos reconhecidos, deixar o resto em branco sem aviso de erro. *(RF-24)*
- [ ] **T-39** — Tratar falha total/baixa confiança: tela em branco com aviso discreto "Não consegui ler a etiqueta, preencha manualmente". *(RF-25)*
- [ ] **T-40** — Try/catch em torno de captura e OCR com mensagem amigável — nunca crashar por uma foto ruim.
- [ ] **T-41** — Teste de integração: etiqueta simulada → item pré-preenchido corretamente na confirmação → adicionar → total correto.

## Etapa 4 — Histórico, resumo de gastos e exportação

- [ ] **T-42** — Diálogo de finalizar compra: campo opcional "Loja" e nome sugerido (loja + data), editável. *(RF-38)*
- [ ] **T-43** — Bloquear finalização de carrinho sem nenhum item. *(RF-40)*
- [ ] **T-44** — Ao confirmar finalização: salvar com data/hora e total, esvaziar o carrinho para uma compra nova. *(RF-37, RF-39)*
- [ ] **T-45** — `HistoryScreen`: lista de compras salvas, mais recente primeiro, com nome/data/total. *(RF-41)*
- [ ] **T-46** — `HistoryDetailScreen`: detalhe somente leitura com todos os itens da compra. *(RF-42)*
- [ ] **T-47** — Reabrir compra do histórico como carrinho novo (duplica itens; compra original permanece intacta). *(RF-43)*
- [ ] **T-48** — Ao reabrir com um carrinho já ativo: avisar e pedir confirmação para finalizar ou descartar o carrinho atual antes de prosseguir. *(RF-44)*
- [ ] **T-49** — **TDD** `src/lib/money.ts`: testes de `calculateMonthSummary` (total do mês, média por compra, comparação com mês anterior) antes da implementação. *(RF-45, RF-46, RF-47)*
- [ ] **T-50** — `SummaryCard` no topo do histórico exibindo o resumo do mês. *(RF-45, RF-46, RF-47)*
- [ ] **T-51** — `src/features/history/export.ts`: gerar CSV de uma compra do histórico. *(RF-48)*
- [ ] **T-52** — `src/features/history/export.ts`: gerar texto simples de uma compra do histórico. *(RF-49)*
- [ ] **T-53** — Compartilhar o arquivo exportado via `expo-sharing`. *(RF-50)*
- [ ] **T-54** — Teste de integração: finalizar compra → aparece no histórico com o total correto.

## Etapa 5 — Orçamento, tema escuro e polimento

- [ ] **T-55** — Definir orçamento opcional por carrinho. *(RF-34)*
- [ ] **T-56** — Barra de progresso do total em relação ao orçamento. *(RF-35)*
- [ ] **T-57** — Mudar a cor do total ao ultrapassar o orçamento. *(RF-36)*
- [ ] **T-58** — Feedback tátil (`expo-haptics`) ao adicionar item e ao ultrapassar o orçamento. *(RF-59)*
- [ ] **T-59** — Revisão completa de tema escuro em todas as telas (além da base do T-06). *(RF-60)*
- [ ] **T-60** — Tela de "Privacidade" explicando que nenhum dado sai do aparelho. *(RF-53)*
- [ ] **T-61** — Auditoria de acessibilidade: `accessibilityLabel`/`accessibilityRole` e alvo de toque mínimo 48dp em todo controle interativo. *(RF-57)*
- [ ] **T-62** — Verificar que o layout respeita o tamanho de fonte do sistema sem quebrar. *(RF-58)*
- [ ] **T-63** — Auditoria final de estados vazio/carregamento/erro em todas as telas relevantes. *(RF-61)*
- [ ] **T-64** — Rodar `npm audit`, revisar dependências, confirmar zero chamada de rede no código.
- [ ] **T-65** — Escrever `README.md`: como rodar, como gerar build Android, permissões usadas.
