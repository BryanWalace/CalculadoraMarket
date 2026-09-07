# Especificação — Carrinho

Status: **rascunho para revisão** (Fase 1 do processo de Spec-Driven Development)

## 1. Visão geral

Carrinho é um aplicativo mobile que ajuda a somar o valor de uma compra de mercado em tempo real, enquanto o produto ainda está no carrinho físico. O usuário fotografa a etiqueta de preço, o app tenta reconhecer nome e preço automaticamente, e o usuário confirma ou corrige antes de adicionar o item à lista. O app também aceita entrada 100% manual, funciona inteiramente offline, não depende de nenhum serviço pago, e não envia nenhum dado para fora do aparelho.

Este documento descreve **o quê** o app deve fazer e **por quê**, sem detalhes de arquitetura, bibliotecas ou implementação — isso é assunto do plano técnico (`docs/plan.md`, Fase 2).

## 2. Requisitos funcionais

### 2.1 Carrinho / lista atual

- **RF-01** — O app exibe a lista de itens do carrinho atual, cada um mostrando nome, quantidade × preço unitário e subtotal.
- **RF-02** — O app exibe o total geral da compra fixo no rodapé, sempre visível, recalculado a partir da soma dos subtotais dos itens presentes na lista naquele momento.
- **RF-03** — O rodapé exibe a contagem de itens distintos e a soma de unidades da lista (ex.: "12 itens · 19 unidades").
- **RF-04** — A tela do carrinho exibe um botão flutuante que inicia a captura de uma nova etiqueta pela câmera.
- **RF-05** — Quando não há itens no carrinho, o app exibe um estado vazio explicativo, nunca uma tela em branco sem contexto.

### 2.2 Adicionar e editar item manualmente

- **RF-06** — O usuário pode adicionar um item preenchendo manualmente nome, preço unitário, unidade (`un` ou `kg`) e quantidade, sem depender da câmera.
- **RF-07** — Enquanto o usuário preenche preço e quantidade, o app calcula e exibe o subtotal (preço × quantidade) ao vivo, antes de confirmar a adição.
- **RF-08** — O app só permite salvar um item se preço e quantidade forem valores positivos.
- **RF-09** — Para itens com unidade `un`, a quantidade deve ser um número inteiro. Para itens com unidade `kg`, a quantidade aceita valores decimais (ex.: `0,750`).
- **RF-10** — Tocar em um item existente reabre a tela de edição pré-preenchida com seus dados atuais (nome, preço, unidade, quantidade), permitindo alterá-los.
- **RF-11** — Um item recém-adicionado aparece no topo da lista, e o total geral e os contadores do rodapé são recalculados imediatamente.

### 2.3 Captura por câmera

- **RF-12** — Antes do primeiro uso da câmera, o app solicita a permissão correspondente exibindo uma tela explicando por que ela é necessária.
- **RF-13** — Se a permissão de câmera for negada, o app continua funcional, oferecendo a entrada manual de item como alternativa — a negativa nunca impede o uso do app.
- **RF-14** — A tela da câmera exibe uma moldura/guia indicando ao usuário onde posicionar o preço da etiqueta antes de capturar a foto.
- **RF-15** — Antes de rodar o reconhecimento de texto, o app recorta a foto capturada para a área delimitada pela moldura exibida ao usuário.
- **RF-16** — Antes do reconhecimento de texto, o app redimensiona/comprime a foto (largura máxima de aproximadamente 1080px) para manter velocidade e uso de memória sob controle.

### 2.4 Reconhecimento e interpretação da etiqueta (OCR e parsing)

- **RF-17** — Quando o texto reconhecido contém mais de um número que poderia ser um preço, o app prioriza como preço o candidato com maior altura de caixa delimitadora (o preço costuma ser o texto de maior destaque visual na etiqueta).
- **RF-18** — O app reconhece preço nos formatos comuns de etiquetas brasileiras, incluindo `R$ 12,34`, `12,34`, `1.234,56` e `12.34`, além de valores quebrados em linhas separadas do texto reconhecido.
- **RF-19** — O app não considera como candidatos a preço: códigos de barras, números de CNPJ, datas e indicações de gramatura ou volume (ex.: `500g`, `1L`).
- **RF-20** — O app identifica o nome do produto como a linha alfabética mais longa do texto reconhecido que não seja um preço, um código, nem uma palavra de ruído comum em etiquetas (ex.: `OFERTA`, `PROMOÇÃO`, `VALIDADE`, `CÓD`, `EAN`, `À VISTA`, `LEVE`, `PAGUE`).
- **RF-21** — O nome extraído é normalizado para Title Case antes de ser exibido ao usuário.
- **RF-22** — Quando o texto da etiqueta contém indicação de "kg"/"Kg", o app pré-seleciona a unidade do item como peso (`kg`) em vez de unidade (`un`).

### 2.5 Tela de confirmação

- **RF-23** — Após o reconhecimento de texto, o app abre a tela de confirmação com nome, preço, unidade e quantidade pré-preenchidos com o que foi extraído da etiqueta.
- **RF-24** — Se apenas parte dos dados for reconhecida com sucesso (ex.: só o preço, ou só o nome), o app pré-preenche os campos reconhecidos e deixa os demais em branco para preenchimento manual, sem exibir aviso de erro.
- **RF-25** — Se nenhum dado for reconhecido com confiança (nem nome nem preço válidos), o app abre a tela de confirmação em branco com um aviso discreto — "Não consegui ler a etiqueta, preencha manualmente" — e nunca trava ou impede o usuário de continuar.
- **RF-26** — Na tela de confirmação, o usuário ajusta a quantidade por botões `−`/`+` ou por digitação direta, aceitando valores decimais quando a unidade for `kg`.
- **RF-27** — A tela de confirmação oferece as ações "Adicionar" (salva o item na lista) e "Cancelar" (descarta e volta ao carrinho).

### 2.6 Ajuste rápido e remoção de item

- **RF-28** — Cada item com unidade `un` exibe, diretamente no seu card na lista, botões `−`/`+` para ajuste rápido da quantidade em incrementos de uma unidade.
- **RF-29** — Itens com unidade `kg` não exibem botões de ajuste rápido no card; a alteração de quantidade desses itens ocorre exclusivamente pela tela de edição (RF-10), com digitação do valor decimal.
- **RF-30** — Se o ajuste rápido de quantidade (RF-28) chegar a zero, o item é removido da lista.
- **RF-31** — O usuário pode excluir qualquer item por gesto de arrastar (swipe) ou pelo botão de lixeira, o que aciona um snackbar de "desfazer" visível por 5 segundos.
- **RF-32** — Se o usuário tocar em "desfazer" dentro da janela de 5 segundos, o item é restaurado à lista com todos os seus dados, incluindo a foto da etiqueta, se houver.
- **RF-33** — O usuário pode limpar a lista inteira de uma vez, com um diálogo de confirmação exibido antes da exclusão.

### 2.7 Orçamento

- **RF-34** — O usuário pode definir, opcionalmente, um valor de orçamento (teto de gasto) para o carrinho/compra atual.
- **RF-35** — Quando um orçamento está definido, o app exibe uma barra de progresso mostrando o total atual em relação a esse teto.
- **RF-36** — Quando o total geral ultrapassa o orçamento definido, o app muda a cor do total exibido para sinalizar o estouro.

### 2.8 Finalizar compra

- **RF-37** — O usuário pode finalizar a compra, encerrando o carrinho atual.
- **RF-38** — Ao finalizar, o app permite informar opcionalmente o nome da loja onde a compra foi feita, e sugere um nome para a compra combinando a loja informada (quando houver) com a data atual — sugestão sempre editável pelo usuário.
- **RF-39** — Ao confirmar a finalização, o app salva a compra com data/hora e total, e esvazia o carrinho atual para o início de uma nova compra.
- **RF-40** — O app não permite finalizar um carrinho que não tenha nenhum item.

### 2.9 Histórico

- **RF-41** — O app exibe uma tela de histórico com as compras já finalizadas, ordenadas da mais recente para a mais antiga, mostrando nome, data e total de cada uma.
- **RF-42** — Tocar em uma compra do histórico abre seus detalhes em modo somente leitura, listando todos os itens daquela compra.
- **RF-43** — A partir dos detalhes de uma compra do histórico, o usuário pode reabri-la como um carrinho novo: os itens da compra são duplicados para um carrinho em edição, e a compra original permanece intacta no histórico.
- **RF-44** — Se já existir um carrinho em andamento no momento em que o usuário tentar reabrir uma compra do histórico (RF-43), o app avisa sobre o carrinho ativo e pede que o usuário o finalize ou o descarte antes de prosseguir — a reabertura nunca substitui um carrinho em andamento silenciosamente.

### 2.10 Resumo de gastos

- **RF-45** — O app exibe o total gasto no mês corrente, somando as compras finalizadas nesse período.
- **RF-46** — O app exibe a média de gasto por compra no mês corrente.
- **RF-47** — O app exibe uma comparação entre o total do mês corrente e o total do mês anterior.

### 2.11 Exportação

- **RF-48** — O usuário pode exportar uma compra do histórico em formato CSV.
- **RF-49** — O usuário pode exportar uma compra do histórico em formato de texto simples.
- **RF-50** — O arquivo exportado é compartilhado através do mecanismo nativo de compartilhamento do sistema operacional (ex.: WhatsApp, Drive, e-mail).

### 2.12 Persistência e continuidade

- **RF-51** — O carrinho em andamento é salvo automaticamente a cada alteração, sem exigir uma ação explícita de "salvar" do usuário.
- **RF-52** — Ao fechar e reabrir o app, o carrinho em andamento e o histórico de compras continuam disponíveis exatamente como estavam.

### 2.13 Privacidade e permissões

- **RF-53** — O app tem uma tela de "Privacidade" explicando, em linguagem simples, que nenhum dado do usuário sai do aparelho.
- **RF-54** — O app solicita apenas a permissão de câmera, e somente no momento em que a câmera vai ser usada.
- **RF-55** — Fotos de etiquetas são guardadas apenas em uma área privada do app, nunca na galeria pública do aparelho.
- **RF-56** — Ao excluir definitivamente um item ou uma lista inteira, a foto associada a cada item excluído também é apagada.

### 2.14 Acessibilidade e tema

- **RF-57** — Todo controle interativo do app tem rótulo e papel de acessibilidade, com alvo de toque de no mínimo 48dp.
- **RF-58** — O app respeita o tamanho de fonte configurado no sistema operacional, sem quebrar o layout das telas.
- **RF-59** — O app dá feedback tátil ao adicionar um item à lista e ao ultrapassar o orçamento definido.
- **RF-60** — O app oferece tema claro e tema escuro, seguindo (ou permitindo seguir) a preferência do sistema.
- **RF-61** — Toda tela relevante tem estados de vazio, carregamento e erro desenhados — o app nunca mostra uma tela em branco sem explicação.

## 3. Regras de negócio

- Todo cálculo monetário é feito internamente em centavos (valores inteiros); a formatação em Real (`R$ 1.234,56`, vírgula decimal) acontece apenas na exibição, nunca durante o cálculo.
- O total geral e os subtotais nunca são acumulados em uma variável separada — são sempre recalculados a partir da lista de itens vigente no momento da exibição.
- Existe no máximo um carrinho em andamento por vez (uma compra com `finished_at` vazio). Não há suporte a múltiplos carrinhos simultâneos nesta fase (ver RF-44 e seção 6).
- Preço reconhecido pelo OCR (RF-17 a RF-19) é sempre tratado como candidato, nunca como valor definitivo, até o usuário confirmar ou editar na tela de confirmação.
- "Reconhecimento com baixa confiança" (RF-25) é definido como: **nem** um candidato a preço válido **nem** uma linha candidata a nome sobreviveram ao filtro de ruído — ou seja, os dois ausentes ao mesmo tempo, equivalendo funcionalmente a uma falha de leitura. Havendo pelo menos um dos dois (só preço, ou só nome), o caso é extração parcial (RF-24), não falha — a correção deste texto (antes dizia "e/ou", o que contradizia a RF-24) foi feita na Fase 3 ao implementar o parser (T-34).
- Todo dado vindo do reconhecimento de texto (OCR) é tratado como entrada não confiável: passa pelas mesmas validações (RF-08, RF-09) que uma entrada manual antes de poder ser salvo.
- Excluir um item ou uma lista sempre remove também a(s) foto(s) associada(s) (RF-56). Durante a janela de desfazer de 5 segundos (RF-31/RF-32), a exclusão — incluindo a foto — precisa ser totalmente reversível.
- O orçamento (RF-34) é um valor por carrinho/compra, não um teto fixo compartilhado entre compras diferentes.
- O app não realiza nenhuma chamada de rede em nenhuma funcionalidade: toda a experiência, incluindo o reconhecimento de texto, roda inteiramente no aparelho.
- Nenhuma consulta aos dados salvos é montada por concatenação de texto; toda consulta usa parâmetros, inclusive para dados vindos do OCR.

## 4. Casos de borda

- Etiqueta fotografada sem nenhum número reconhecível como preço.
- Etiqueta com vários números concorrentes na mesma foto (preço por kg, código de barras, CNPJ, data de validade, gramatura/volume).
- Reconhecimento parcial: só o nome é identificado, ou só o preço, mas não ambos.
- Ajuste rápido de quantidade (RF-28) leva a quantidade a zero.
- Total geral ultrapassa o orçamento definido enquanto o usuário ainda está adicionando itens.
- Usuário nega a permissão de câmera na primeira tentativa de uso.
- Usuário tenta reabrir uma compra do histórico como carrinho novo enquanto já existe um carrinho em andamento.
- Usuário tenta finalizar um carrinho sem nenhum item.
- App é fechado ou interrompido no meio da captura de foto ou do reconhecimento de texto.
- Usuário finaliza a compra sem informar o nome da loja.
- Usuário desfaz a exclusão de um item (RF-32) depois de já ter adicionado outros itens — o item restaurado volta à lista, mas não necessariamente na mesma posição anterior.

## 5. Fora de escopo nesta fase

- Aplicativo iOS (o esforço inicial é exclusivamente Android).
- Múltiplos carrinhos em andamento simultaneamente.
- Sincronização ou backup na nuvem.
- Suporte a múltiplos idiomas ou moedas além de português do Brasil / Real.
- Login ou conta de usuário.
- Recorte manual da foto pelo usuário (o recorte é sempre automático, pela moldura de captura).

## 6. Ambiguidades encontradas e decisões assumidas

As quatro ambiguidades abaixo foram levantadas durante a Fase 1 e resolvidas em conversa com o autor do pedido antes da redação final desta spec:

1. **Nome da loja ao finalizar.** O pedido original sugeria pré-preencher o nome da compra com "nome do mercado + data", mas nenhuma outra parte do fluxo captura o nome do mercado, e permissão de localização é explicitamente proibida. **Decisão:** adicionar um campo opcional "Loja" na finalização da compra (RF-38). _Isso implica um campo adicional no modelo de dados de `shopping_lists` que não estava no schema original do pedido — será registrado explicitamente no plano técnico (Fase 2)._
2. **Carrinho ativo ao reabrir compra do histórico.** O modelo de dados descreve "o carrinho em andamento" no singular, sugerindo um único carrinho ativo por vez. **Decisão:** ao reabrir uma compra do histórico (RF-43) com um carrinho já ativo, o app avisa e pede confirmação para finalizar ou descartar o carrinho atual antes de prosseguir (RF-44) — nunca substitui silenciosamente.
3. **Área processada pelo reconhecimento de texto.** Não estava claro se a moldura da câmera era só uma referência visual ou se delimitava o recorte real da foto. **Decisão:** a foto é recortada para a área da moldura antes do reconhecimento de texto (RF-15).
4. **Passo do ajuste rápido para itens em `kg`.** Somar "1" não faz sentido para peso. **Decisão:** os botões rápidos `−`/`+` no card existem apenas para itens `un` (RF-28); itens `kg` só mudam de quantidade pela tela de edição, com digitação do valor decimal (RF-29).

Além dessas, ficam registradas as seguintes suposições menores, também abertas a correção:

- Exportação (RF-48/RF-49) vale para compras já finalizadas, acessadas pelo histórico. O carrinho em andamento não tem exportação própria nesta fase.
- Uma compra sem nenhum item não pode ser finalizada (RF-40) — não há utilidade em salvar uma compra vazia no histórico.
- "Baixa confiança" do OCR (RF-25) é operacionalizada como ausência de candidato válido de preço **e** nome ao mesmo tempo, não como um número de confiança específico — ver seção 3 (corrigido de "e/ou" para "nem...nem" na Fase 3, T-34, por contradizer a RF-24).
- A comparação com o mês anterior (RF-47) mostra tanto a diferença em valor quanto, quando aplicável, a variação percentual.

## 7. Critérios de aceite

Critérios de comportamento do produto, cada um rastreável aos RF-xx correspondentes:

- [x] Fotografar uma etiqueta preenche nome e preço automaticamente na tela de confirmação — RF-14, RF-15, RF-17, RF-18, RF-20, RF-21, RF-23
- [x] Informar a quantidade calcula o subtotal e soma ao total geral — RF-07, RF-02
- [x] Editar quantidade ou preço de um item atualiza subtotal e total geral — RF-10, RF-07, RF-02
- [x] Excluir item recalcula o total e permite desfazer — RF-31, RF-32, RF-02
- [x] Produto por peso aceita quantidade decimal — RF-09, RF-26, RF-29
- [x] Finalizar salva a compra e ela aparece no histórico com o total correto — RF-37, RF-39, RF-41
- [x] Fechar e reabrir o app mantém o carrinho e o histórico — RF-51, RF-52
- [x] Funciona 100% offline, sem nenhuma chave de API no código — regra de negócio (seção 3, "chamada de rede"), RF-53

Critérios de qualidade de engenharia, transversais a todos os RF-xx (não são requisitos de comportamento visível ao usuário, mas condição de aceite do projeto como um todo):

- [x] `npx tsc --noEmit`, lint e suíte de testes passam sem erro nem warning
- [x] Toda regra de negócio implementada tem um RF-xx correspondente nesta spec
- [x] Nenhuma query SQL montada por concatenação de string — regra de negócio, seção 3
