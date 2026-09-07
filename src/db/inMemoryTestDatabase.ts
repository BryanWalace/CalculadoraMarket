import type { AppDatabase } from './types';

/**
 * Fake de banco em memória, real o bastante para exercitar a store e as
 * queries de verdade (createList, addItem, updateItem, etc.), sem precisar
 * do módulo nativo do expo-sqlite (não roda no Jest). Usado só em testes.
 */
export function createInMemoryDatabase(): AppDatabase {
  let nextListId = 1;
  let nextItemId = 1;
  const lists = new Map<number, Record<string, unknown>>();
  const items = new Map<number, Record<string, unknown>>();

  return {
    execAsync: jest.fn(async () => undefined),
    withTransactionAsync: jest.fn(async (task) => {
      await task();
    }),
    runAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      if (sql.includes('INSERT INTO shopping_lists')) {
        const [name, createdAt] = params;
        const id = nextListId++;
        lists.set(id, {
          id,
          name,
          store: null,
          created_at: createdAt,
          finished_at: null,
          total: 0,
          budget: null,
        });
        return { lastInsertRowId: id, changes: 1 };
      }
      if (sql.includes('INSERT INTO list_items')) {
        const [listId, name, unitPrice, quantity, unit, subtotal, photoUri, createdAt] = params;
        const id = nextItemId++;
        items.set(id, {
          id,
          list_id: listId,
          name,
          unit_price: unitPrice,
          quantity,
          unit,
          subtotal,
          photo_uri: photoUri,
          created_at: createdAt,
        });
        return { lastInsertRowId: id, changes: 1 };
      }
      if (sql.includes('UPDATE list_items')) {
        const [name, unitPrice, quantity, unit, subtotal, id] = params as [
          string,
          number,
          number,
          string,
          number,
          number,
        ];
        const row = items.get(id);
        if (row) {
          Object.assign(row, {
            name,
            unit_price: unitPrice,
            quantity,
            unit,
            subtotal,
          });
        }
        return { lastInsertRowId: 0, changes: row ? 1 : 0 };
      }
      if (sql.includes('UPDATE shopping_lists')) {
        const [name, store, finishedAt, subqueryListId, whereListId] = params as [
          string,
          string | null,
          string,
          number,
          number,
        ];
        const list = lists.get(whereListId);
        if (list) {
          const total = [...items.values()]
            .filter((item) => item.list_id === subqueryListId)
            .reduce((sum, item) => sum + (item.subtotal as number), 0);
          Object.assign(list, { name, store, finished_at: finishedAt, total });
        }
        return { lastInsertRowId: 0, changes: list ? 1 : 0 };
      }
      if (sql.includes('DELETE FROM list_items WHERE list_id')) {
        const [listId] = params as [number];
        for (const [id, row] of items) {
          if (row.list_id === listId) items.delete(id);
        }
        return { lastInsertRowId: 0, changes: 1 };
      }
      if (sql.includes('DELETE FROM list_items')) {
        const [id] = params as [number];
        const existed = items.delete(id);
        return { lastInsertRowId: 0, changes: existed ? 1 : 0 };
      }
      throw new Error(`runAsync não implementado no fake: ${sql}`);
    }),
    getFirstAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      if (sql.includes('shopping_lists') && sql.includes('finished_at IS NULL')) {
        return [...lists.values()].find((row) => row.finished_at === null) ?? null;
      }
      if (sql.includes('FROM shopping_lists WHERE id')) {
        const [id] = params as [number];
        return lists.get(id) ?? null;
      }
      if (sql.includes('FROM list_items WHERE id')) {
        const [id] = params as [number];
        return items.get(id) ?? null;
      }
      throw new Error(`getFirstAsync não implementado no fake: ${sql}`);
    }),
    getAllAsync: jest.fn(async (sql: string, ...params: unknown[]) => {
      if (sql.includes('list_items') && sql.includes('list_id')) {
        const [listId] = params as [number];
        return [...items.values()].filter((row) => row.list_id === listId);
      }
      if (sql.includes('shopping_lists') && sql.includes('finished_at IS NOT NULL')) {
        return [...lists.values()]
          .filter((row) => row.finished_at !== null)
          .sort((a, b) => String(b.finished_at).localeCompare(String(a.finished_at)));
      }
      throw new Error(`getAllAsync não implementado no fake: ${sql}`);
    }),
  };
}
