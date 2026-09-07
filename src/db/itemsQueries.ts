import { multiplyCents } from '../lib/money';
import type { ListItemInput, Unit } from '../lib/validation';
import type { ListItem } from './schema';
import type { AppDatabase } from './types';

interface ListItemRow {
  id: number;
  list_id: number;
  name: string;
  unit_price: number;
  quantity: number;
  unit: Unit;
  subtotal: number;
  photo_uri: string | null;
  created_at: string;
}

function mapRow(row: ListItemRow): ListItem {
  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    unitPrice: row.unit_price,
    quantity: row.quantity,
    unit: row.unit,
    subtotal: row.subtotal,
    photoUri: row.photo_uri,
    createdAt: row.created_at,
  };
}

export async function addItem(
  db: AppDatabase,
  listId: number,
  input: ListItemInput,
  photoUri: string | null,
): Promise<ListItem> {
  const subtotal = multiplyCents(input.unitPrice, input.quantity);
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO list_items (list_id, name, unit_price, quantity, unit, subtotal, photo_uri, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    listId,
    input.name,
    input.unitPrice,
    input.quantity,
    input.unit,
    subtotal,
    photoUri,
    createdAt,
  );

  return {
    id: result.lastInsertRowId,
    listId,
    name: input.name,
    unitPrice: input.unitPrice,
    quantity: input.quantity,
    unit: input.unit,
    subtotal,
    photoUri,
    createdAt,
  };
}

export async function updateItem(
  db: AppDatabase,
  id: number,
  input: ListItemInput,
): Promise<ListItem> {
  const subtotal = multiplyCents(input.unitPrice, input.quantity);
  await db.runAsync(
    'UPDATE list_items SET name = ?, unit_price = ?, quantity = ?, unit = ?, subtotal = ? WHERE id = ?',
    input.name,
    input.unitPrice,
    input.quantity,
    input.unit,
    subtotal,
    id,
  );

  const row = await db.getFirstAsync<ListItemRow>('SELECT * FROM list_items WHERE id = ?', id);
  if (!row) {
    throw new Error(`Item ${id} não encontrado após atualização`);
  }

  return mapRow(row);
}

export async function deleteItem(db: AppDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM list_items WHERE id = ?', id);
}

export async function listItemsByListId(db: AppDatabase, listId: number): Promise<ListItem[]> {
  const rows = await db.getAllAsync<ListItemRow>(
    'SELECT * FROM list_items WHERE list_id = ? ORDER BY id DESC',
    listId,
  );

  return rows.map(mapRow);
}
