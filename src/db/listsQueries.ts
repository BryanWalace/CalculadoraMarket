import { listItemsByListId } from './itemsQueries';
import type { ListItem, ShoppingList } from './schema';
import type { AppDatabase } from './types';

interface ShoppingListRow {
  id: number;
  name: string;
  store: string | null;
  created_at: string;
  finished_at: string | null;
  total: number;
  budget: number | null;
}

function mapRow(row: ShoppingListRow): ShoppingList {
  return {
    id: row.id,
    name: row.name,
    store: row.store,
    createdAt: row.created_at,
    finishedAt: row.finished_at,
    total: row.total,
    budget: row.budget,
  };
}

export async function createList(db: AppDatabase, name: string): Promise<ShoppingList> {
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO shopping_lists (name, created_at, total) VALUES (?, ?, 0)',
    name,
    createdAt,
  );

  return {
    id: result.lastInsertRowId,
    name,
    store: null,
    createdAt,
    finishedAt: null,
    total: 0,
    budget: null,
  };
}

export async function getActiveList(db: AppDatabase): Promise<ShoppingList | null> {
  const row = await db.getFirstAsync<ShoppingListRow>(
    'SELECT * FROM shopping_lists WHERE finished_at IS NULL ORDER BY id DESC LIMIT 1',
  );

  return row ? mapRow(row) : null;
}

export async function setBudget(
  db: AppDatabase,
  listId: number,
  budget: number | null,
): Promise<void> {
  await db.runAsync('UPDATE shopping_lists SET budget = ? WHERE id = ?', budget, listId);
}

/**
 * total é recalculado direto no SQL a partir de list_items, nunca recebido
 * como parâmetro — o total nunca é acumulado fora dos itens (spec §3).
 */
export async function finalizeList(
  db: AppDatabase,
  listId: number,
  name: string,
  store: string | null,
): Promise<void> {
  const finishedAt = new Date().toISOString();
  await db.runAsync(
    `UPDATE shopping_lists
     SET name = ?, store = ?, finished_at = ?,
         total = (SELECT COALESCE(SUM(subtotal), 0) FROM list_items WHERE list_id = ?)
     WHERE id = ?`,
    name,
    store,
    finishedAt,
    listId,
    listId,
  );
}

export async function listFinishedLists(db: AppDatabase): Promise<ShoppingList[]> {
  const rows = await db.getAllAsync<ShoppingListRow>(
    'SELECT * FROM shopping_lists WHERE finished_at IS NOT NULL ORDER BY finished_at DESC',
  );

  return rows.map(mapRow);
}

export async function getListById(db: AppDatabase, listId: number): Promise<ShoppingList | null> {
  const row = await db.getFirstAsync<ShoppingListRow>(
    'SELECT * FROM shopping_lists WHERE id = ?',
    listId,
  );

  return row ? mapRow(row) : null;
}

export async function getListWithItems(
  db: AppDatabase,
  listId: number,
): Promise<{ list: ShoppingList; items: ListItem[] } | null> {
  const list = await getListById(db, listId);
  if (!list) {
    return null;
  }

  const items = await listItemsByListId(db, listId);
  return { list, items };
}
