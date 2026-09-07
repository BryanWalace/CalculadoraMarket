# Plano técnico — Carrinho

Status: **rascunho para revisão** (Fase 2 do processo de Spec-Driven Development — ver `docs/spec.md` para os RF-xx referenciados aqui)

## 1. Visão geral da arquitetura

App Expo/React Native/TypeScript, 100% client-side, sem backend. Quatro camadas:

- **Rotas** (`app/`, expo-router): telas finas que só compõem e navegam — nenhuma lógica de negócio aqui.
- **Features** (`src/features/*`): componentes de UI e stores zustand por área (`cart`, `scanner`, `history`).
- **Lib** (`src/lib/*`): toda lógica de negócio em funções puras, zero React, testável isoladamente (RF de cálculo, parsing e validação).
- **Dados** (`src/db/*`): schema, migrações e consultas SQLite parametrizadas.

Capacidades nativas (câmera, OCR, sistema de arquivos, compartilhamento, haptics) são acessadas só a partir de `src/features/*`, nunca de `src/lib`.

Fluxo de captura (RF-12 a RF-27): câmera → recorte na moldura (`expo-image-manipulator`, RF-15) → redimensionamento/compressão (RF-16) → ML Kit `recognizeText` → adaptação para `OcrBlock[]` → `parseLabel()` (`src/lib/ocr-parser`) → tela de confirmação pré-preenchida (RF-23/24/25) → validação zod (RF-08/09) → gravação em SQLite → store `cart` atualizada → total recalculado (RF-02).

**SQLite é a fonte da verdade.** A store `cart` (zustand) é uma cópia em memória hidratada do banco, nunca o dado primário — ver ADR-01.

## 2. Estrutura de pastas

```
app/                              (expo-router; telas finas, sem lógica de negócio)
  index.tsx                       → CartScreen            RF-01–05, 28–36
  scanner/
    camera.tsx                    → CameraScreen           RF-12–16
    confirm.tsx                   → ConfirmationScreen      RF-06–10, 23–27
  history/
    index.tsx                     → HistoryScreen (inclui SummaryCard)  RF-41, 45–47
    [id].tsx                      → HistoryDetailScreen     RF-42–44, 48–50
  privacy.tsx                     → PrivacyScreen           RF-53
  _layout.tsx                     → tema claro/escuro, providers

src/
  features/
    cart/
      components/                 (ItemCard, BudgetBar, FinalizeDialog, EmptyState)
      store.ts                    (useCartStore — ADR-01)
    scanner/
      components/                 (CaptureGuideOverlay)
      scanLabel.ts                (orquestra câmera → OCR → parser; adapta ML Kit → OcrBlock[] — ADR-03)
    history/
      components/                 (HistoryListItem, SummaryCard)
      export.ts                   (exportPurchase — RF-48/49/50)
  lib/
    money.ts                      (aritmética monetária, resumo mensal — RF-02/07/45–47, ADR-02)
    ocr-parser.ts                 (parsing puro do texto reconhecido — RF-17–22)
    format.ts                     (formatação de exibição — RF-21, RF-03, datas)
    validation.ts                 (schemas zod — RF-08/09/34/38)
  db/
    schema.ts                     (DDL)
    migrations.ts                 (versionamento — ADR-04)
    client.ts                     (abre conexão SQLite)
    listsQueries.ts
    itemsQueries.ts

docs/
  spec.md
  plan.md
  tasks.md                        (Fase 3, a criar)
  backlog.md                      (a criar quando surgir a primeira ideia fora de escopo)
```

## 3. Modelo de dados

Mantém os nomes de coluna do schema original do pedido; único campo novo é `store` (desvio já registrado em `docs/spec.md` §6, RF-38). Todo valor monetário é inteiro em centavos.

```sql
CREATE TABLE shopping_lists (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  store       TEXT,                        -- opcional; RF-38, desvio de schema (spec §6)
  created_at  TEXT NOT NULL,                -- ISO 8601
  finished_at TEXT,                         -- NULL enquanto em andamento — RF-51
  total       INTEGER NOT NULL DEFAULT 0,   -- centavos; sempre recalculado a partir de list_items (spec §3)
  budget      INTEGER                       -- centavos; NULL = sem orçamento — RF-34
);

CREATE TABLE list_items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id        INTEGER NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  unit_price     INTEGER NOT NULL,          -- centavos
  quantity       REAL NOT NULL,             -- inteiro se unit='un', decimal se unit='kg' — RF-09
  unit           TEXT NOT NULL CHECK (unit IN ('un', 'kg')),
  subtotal       INTEGER NOT NULL,          -- centavos; unit_price × quantity arredondado — ADR-02
  photo_uri      TEXT,                      -- diretório privado do app; NULL se item manual — RF-55
  created_at     TEXT NOT NULL
);

CREATE INDEX idx_list_items_list_id ON list_items(list_id);
```

Tipos TypeScript derivados (não duplicados à mão — `z.infer` dos schemas de `src/lib/validation.ts` mais os campos gerados pelo banco: `id`, `createdAt`, `total`/`subtotal` calculados):

```ts
type Unit = 'un' | 'kg';

interface ShoppingList {
  id: number;
  name: string;
  store: string | null;
  createdAt: string;
  finishedAt: string | null;
  total: number; // centavos
  budget: number | null;
}

interface ListItem {
  id: number;
  listId: number;
  name: string;
  unitPrice: number; // centavos
  quantity: number;
  unit: Unit;
  subtotal: number; // centavos
  photoUri: string | null;
  createdAt: string;
}
```

## 4. Contratos dos módulos principais

### `src/lib/validation.ts` — RF-08, RF-09, RF-34, RF-38

```ts
const unitSchema = z.enum(['un', 'kg']);

const listItemInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    unitPrice: z.number().int().positive().max(9_999_999), // até R$ 99.999,99 — teto contra lixo de OCR
    quantity: z.number().positive(),
    unit: unitSchema,
  })
  .refine((v) => v.unit === 'kg' || Number.isInteger(v.quantity), {
    message: 'Quantidade deve ser inteira para itens por unidade',
    path: ['quantity'],
  });

const shoppingListInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  store: z.string().trim().max(80).nullable().optional(),
  budget: z.number().int().positive().max(99_999_999).nullable().optional(),
});
```

Todo dado vindo do OCR passa por `listItemInputSchema` antes de chegar ao banco — sem exceção (spec §3).

### `src/lib/ocr-parser.ts` — RF-17 a RF-22

```ts
interface OcrBlock {
  text: string;
  boundingBoxHeight: number;
}

interface ParsedLabel {
  name: string | null;
  priceCents: number | null;
  unit: Unit; // 'kg' se detectado (RF-22), senão 'un'
  confident: boolean; // false quando name e priceCents são ambos null — dispara RF-25
}

function parseLabel(blocks: OcrBlock[]): ParsedLabel;
```

`OcrBlock` é um tipo próprio, desacoplado do retorno real do ML Kit — ver ADR-03. O adaptador que converte o resultado do ML Kit para `OcrBlock[]` vive em `src/features/scanner/scanLabel.ts`, não em `src/lib`.

### `src/lib/money.ts` — RF-02, RF-07, RF-45–47

```ts
function multiplyCents(unitPriceCents: number, quantity: number): number; // arredondamento — ADR-02
function sumCents(values: number[]): number;

function calculateMonthSummary(
  finishedLists: Pick<ShoppingList, 'total' | 'finishedAt'>[],
  referenceDate: Date,
): {
  currentMonthTotalCents: number;
  averagePerPurchaseCents: number;
  previousMonthTotalCents: number;
  diffCents: number;
  diffPercent: number | null; // null se o mês anterior não teve nenhuma compra
};
```

### `src/lib/format.ts` — RF-03, RF-21

```ts
function formatCurrencyBRL(cents: number): string; // "R$ 1.234,56"
function formatQuantity(quantity: number, unit: Unit): string; // "3" | "0,750"
function formatCartSummary(itemCount: number, unitSum: number): string; // "12 itens · 19 unidades"
function titleCase(text: string): string;
function formatDate(iso: string): string; // "07/09/2026"
```

### `src/db/listsQueries.ts` e `itemsQueries.ts`

```ts
// listsQueries.ts
function createList(input: { name: string }): Promise<ShoppingList>; // RF-51, RF-43
function getActiveList(): Promise<ShoppingList | null>; // RF-51/52
function setBudget(listId: number, budget: number | null): Promise<void>; // RF-34
function finalizeList(listId: number, name: string, store: string | null): Promise<void>; // RF-37–39
function listFinishedLists(): Promise<ShoppingList[]>; // RF-41
function getListWithItems(listId: number): Promise<{ list: ShoppingList; items: ListItem[] }>; // RF-42

// itemsQueries.ts
function addItem(
  input: ListItemInput & { listId: number; photoUri: string | null },
): Promise<ListItem>; // RF-06/11/23
function updateItem(id: number, changes: Partial<ListItemInput>): Promise<ListItem>; // RF-10
function deleteItem(id: number): Promise<void>; // RF-31, após o timer — ADR-05
function listItemsByListId(listId: number): Promise<ListItem[]>;
```

Todas as queries usam `?` parametrizado — nunca concatenação de string, inclusive para `name`/`store` vindos do OCR ou digitados pelo usuário.

### `src/features/cart/store.ts` — `useCartStore` (zustand)

Estado: `activeList: ShoppingList | null`, `items: ListItem[]`, `pendingDeletion: { itemId: number; timer: ... } | null`.
Derivados (nunca armazenados): `total = sumCents(items.map(i => i.subtotal))`, `itemCount = items.length`, `unitSum = sumCents-like soma de quantity`.
Ações: `hydrate()`, `addItem()`, `updateItem()`, `adjustQuantity(id, delta)` (só itens `un` — RF-28/29), `removeItem(id)` (agenda exclusão — ADR-05), `undoRemove(id)`, `setBudget()`, `clearList()`, `finalize()`, `reopenFromHistory(listId)` (RF-43/44).

## 5. Decisões técnicas (ADRs)

### ADR-01 — Zustand como cache em memória, SQLite como fonte da verdade

- **Contexto:** RF-51/52 exigem que nada se perca ao fechar o app; a regra de negócio proíbe acumular o total à parte dos itens.
- **Decisão:** SQLite é a fonte da verdade. A store `cart` hidrata do banco na abertura do app e, a cada ação, grava primeiro no banco e só depois atualiza o estado em memória a partir do retorno da escrita. Total e contadores são sempre derivados de `items`, nunca campos próprios da store.
- **Alternativas descartadas:** zustand como fonte única com persistência assíncrona "best-effort" (risco de perda de dados se o app fechar entre a mutação em memória e a gravação); ler o SQLite a cada render sem cache (custo de I/O repetido, complexidade de re-render).
- **Consequência:** toda ação da store é assíncrona; testes da store precisam de um banco (em memória ou mock de `src/db`).

### ADR-02 — Arredondamento monetário: metade para cima, uma vez só

- **Contexto:** `subtotal = unit_price × quantity`; quantidade decimal (kg) quase nunca gera um número inteiro de centavos.
- **Decisão:** arredondar "metade para cima" para o centavo mais próximo, uma única vez, no cálculo do subtotal de cada item. O total soma os subtotais já arredondados, nunca re-arredonda a soma.
- **Alternativas descartadas:** truncar sempre para baixo (subestima o total sistematicamente); arredondamento bancário/half-to-even (menos previsível para o usuário leigo, sem ganho real numa lista curta).
- **Consequência:** `multiplyCents()` implementa a regra uma vez; todo subtotal exibido é exatamente o valor persistido.

### ADR-03 — Fronteira entre ML Kit e `ocr-parser.ts`

- **Contexto:** `ocr-parser.ts` precisa ser testável com 10+ amostras reais (TDD) sem depender de código nativo.
- **Decisão:** `src/features/scanner/scanLabel.ts` converte o retorno do ML Kit para o tipo simples `OcrBlock[]` antes de chamar `parseLabel()`. `src/lib/ocr-parser.ts` não importa `@react-native-ml-kit/text-recognition`.
- **Alternativas descartadas:** testar o parser contra o tipo de retorno nativo do ML Kit diretamente (acopla os testes a uma lib nativa que não roda em ambiente de teste puro, e é frágil a mudanças de versão).
- **Consequência:** um adaptador fino em `scanLabel.ts` (sem lógica de decisão, só mapeamento); toda a lógica de parsing fica isolada e testável em `ocr-parser.ts`.

### ADR-04 — Migração de schema via `PRAGMA user_version`

- **Contexto:** o schema já parte com um campo além do desenho original (`store`); mudanças futuras de schema precisam preservar carrinho e histórico existentes (RF-52).
- **Decisão:** versionar o schema com `PRAGMA user_version`; `src/db/migrations.ts` aplica sequencialmente as migrações numeradas que faltam ao abrir o banco.
- **Alternativas descartadas:** recriar o banco do zero a cada mudança (destruiria dados do usuário); biblioteca externa de migração (dependência desnecessária para um problema que o SQLite resolve nativamente).
- **Consequência:** toda mudança de schema futura é uma nova função de migração numerada, nunca uma edição da migração inicial.

### ADR-05 — Exclusão com desfazer: soft-delete de 5 segundos antes de apagar de vez

- **Contexto:** RF-31/32 exigem desfazer completo (incluindo foto) por 5 segundos; RF-56 exige apagar a foto na exclusão definitiva.
- **Decisão:** ao excluir, o item some da lista em memória e a exclusão real (banco + arquivo de foto) fica agendada para 5 segundos depois. Se o usuário desfizer antes, o agendamento é cancelado e nada é apagado.
- **Alternativas descartadas:** apagar imediatamente e restaurar a partir de um buffer em memória no "desfazer" (a foto, sendo um arquivo, já teria sido apagada e não haveria como restaurá-la).
- **Consequência:** a store do carrinho mantém um temporizador de exclusão pendente; o item "pendente" é filtrado da lista exibida mas ainda existe no banco até o temporizador expirar.

### ADR-06 — Test runner: Jest (`jest-expo`) em vez de Vitest

- **Contexto:** o pedido permite "Vitest (ou Jest) + React Native Testing Library"; há testes de unidade puros (`lib/money`, `lib/ocr-parser`) e testes de integração com componentes React Native.
- **Decisão:** Jest com o preset `jest-expo`, caminho oficialmente documentado pelo Expo, já configurado com mocks para módulos nativos (câmera, SQLite etc.) usados nos testes de integração.
- **Alternativas descartadas:** Vitest (mais rápido em projetos web puros, mas exige configuração manual extra para o pipeline Metro/Babel do React Native e para os mocks nativos — atrito sem ganho real neste projeto).
- **Consequência:** `npm run test` roda `jest`; testes de `src/lib` não precisam de nenhum mock nativo.

## 6. Observação para a Fase 3

`react-native-gesture-handler` (usado para o swipe-to-delete do RF-31) é, com alta probabilidade, já uma dependência transitiva de `expo-router`/`@react-navigation` — mas isso precisa ser confirmado olhando o `package.json` gerado no scaffolding inicial (Fase 1 de "Ordem de entrega", ainda não feita) antes de decidir se é preciso perguntar sobre uma dependência nova. Vou verificar isso na tarefa de setup do projeto e só pergunto se realmente for necessário adicionar algo além do que o Expo já traz.
