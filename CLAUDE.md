# CLAUDE.md — Carrinho

Guia de trabalho para este repositório. Mantido atualizado a cada decisão nova das Fases 2 e 3 do processo descrito em `docs/spec.md`.

## O que é o projeto

Carrinho é um app mobile Android que soma o valor de uma compra de mercado em tempo real, lendo etiquetas de preço pela câmera via OCR on-device. Custo zero, 100% offline, sem backend. Ver `docs/spec.md` para requisitos funcionais (RF-xx) e `docs/plan.md` para arquitetura (quando existir).

## Processo de trabalho — não pular

1. **Spec-Driven Development em fases**: `docs/spec.md` → `docs/plan.md` → `docs/tasks.md` → implementação. Cada fase para revisão antes da próxima.
2. **Nunca escrever código de app antes da spec estar aprovada.**
3. **Uma tarefa de `docs/tasks.md` por vez.** Ao terminar: marcar checkbox, rodar lint + testes, commitar, mostrar o diff e parar — nunca emendar a tarefa seguinte sem aprovação.
4. **Se a spec se mostrar errada durante a implementação, parar e atualizar a spec primeiro.** A spec é a fonte da verdade; código que diverge dela é bug.
5. Ideia boa fora do escopo da tarefa atual vai para `docs/backlog.md`, nunca direto para o código.
6. Perguntar antes de adicionar qualquer dependência nova, justificando por que a biblioteca padrão ou o Expo não resolvem.

## Stack

- Expo SDK 57 + React Native 0.86 + React 19 + TypeScript (`strict`). A API do Expo muda entre versões — consultar a documentação versionada em https://docs.expo.dev/versions/v57.0.0/ antes de usar qualquer API, em vez de assumir comportamento de versões antigas.
- `expo-router` — navegação
- `expo-camera` — captura da etiqueta
- `expo-image-manipulator` — recorte (para a área da moldura) e redimensionamento da foto antes do OCR
- `@react-native-ml-kit/text-recognition` — OCR on-device, offline, gratuito (código nativo — **o app não roda no Expo Go**, precisa de `expo-dev-client`)
- `expo-sqlite` — persistência local de listas e itens
- `zustand` — estado global
- `expo-file-system` + `expo-sharing` — exportação e compartilhamento de arquivos
- `zod` — validação de toda entrada antes de persistir (preço, quantidade, nome, inclusive dados vindos do OCR)
- Estilização: `StyleSheet` nativo ou NativeWind — sem bibliotecas de UI pesadas
- Testes: Jest (preset `jest-expo`) + React Native Testing Library — decisão registrada em `docs/plan.md` ADR-06

## Comandos

| Comando | Descrição |
|---|---|
| `npx expo start --dev-client` | Ambiente de desenvolvimento (requer dev client instalado — ML Kit não roda no Expo Go) |
| `npm run lint` | ESLint |
| `npm run test` | Suíte de testes |
| `npx tsc --noEmit` | Checagem de tipos |
| `npx expo prebuild` | Gera os projetos nativos `android`/`ios` |
| `npx expo run:android` | Build e instalação local no Android (gratuito, sem depender de cota de nuvem) |
| `eas build -p android --profile preview` | Alternativa via EAS Build, plano gratuito |

## Estrutura de pastas (por feature, não por tipo de arquivo)

```
app/             — rotas do expo-router; telas finas, sem lógica de negócio (ver docs/plan.md §2)
src/
  features/
    cart/       — lista atual, itens, orçamento
    scanner/     — câmera, OCR, tela de confirmação
    history/     — histórico, resumo de gastos, exportação
  lib/           — funções puras, zero React: money, ocr-parser, format, validation
  db/            — schema, migrations, queries (SQLite)
docs/
  spec.md        — Fase 1: requisitos (aprovada)
  plan.md        — Fase 2: arquitetura, modelo de dados, ADRs (aprovada)
  tasks.md       — Fase 3: checklist granular, 65 tarefas em 5 etapas (rascunho, aguardando revisão)
  backlog.md     — ideias fora de escopo (a criar quando necessário)
```

## Convenções

- TypeScript `strict`, sem `any` e sem `@ts-ignore`. Tipos derivados do modelo de dados, não duplicados à mão.
- Toda lógica de negócio em funções puras dentro de `src/lib`, testável sem renderizar componente nenhum. Componente não faz conta.
- Cálculo monetário sempre em centavos (inteiros); formatação em R$ só na exibição.
- Total sempre recalculado a partir dos itens, nunca acumulado em variável separada.
- Consultas SQL sempre parametrizadas (`?` + array de parâmetros) — nunca concatenação de string, nem com dado "confiável" vindo do OCR.
- TDD obrigatório em `lib/money` e `lib/ocr-parser`: teste falhando primeiro, depois a implementação.
- Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`), mensagem em português, um commit por tarefa de `docs/tasks.md`.
- Sem código morto, comentário explicando o óbvio ou `console.log` esquecido. Comentário só para explicar *por quê*, nunca *o quê*.
- Sem `catch` silencioso: todo erro é tratado com feedback ao usuário, ou propagado.
- `accessibilityLabel`/`accessibilityRole` em todo controle interativo; alvo de toque mínimo 48dp.
- Interface e mensagens sempre em português do Brasil; moeda em BRL (`R$ 1.234,56`, vírgula decimal).

## Não faça

- Nenhum serviço pago, API key, backend ou banco na nuvem.
- Nenhum OCR por API (Google Cloud Vision, OpenAI, AWS Textract etc.) — só ML Kit on-device.
- Nenhuma chamada de rede em nenhuma funcionalidade — o app é offline-first por design.
- Nenhuma soma monetária em ponto flutuante.
- Nenhuma query SQL montada por concatenação de string.
- Nenhum `any` ou `@ts-ignore` para contornar erro de tipo.
- Nenhuma implementação além da tarefa atual de `docs/tasks.md` — ideia nova vai para `docs/backlog.md`.
- Nenhuma dependência nova sem perguntar antes e justificar.
- Nenhuma foto de etiqueta salva na galeria pública — só no diretório privado do app.
- Nenhuma permissão além de câmera (sem localização, contatos ou armazenamento externo).
- Nenhum analytics, crash reporting de terceiros ou upload de foto.
- Nenhum segredo ou `.env` commitado no repositório.
