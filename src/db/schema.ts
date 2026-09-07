import type { Unit } from '../lib/validation';

export interface ShoppingList {
  id: number;
  name: string;
  store: string | null;
  createdAt: string;
  finishedAt: string | null;
  total: number;
  budget: number | null;
}

export interface ListItem {
  id: number;
  listId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  unit: Unit;
  subtotal: number;
  photoUri: string | null;
  createdAt: string;
}

/**
 * Nomes de coluna herdados do schema original do pedido; único campo novo é
 * `store` (desvio registrado em docs/spec.md §6, RF-38). Todo valor
 * monetário é inteiro em centavos — ver docs/plan.md §3.
 */
export const CREATE_SHOPPING_LISTS_TABLE = `
  CREATE TABLE IF NOT EXISTS shopping_lists (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    store       TEXT,
    created_at  TEXT NOT NULL,
    finished_at TEXT,
    total       INTEGER NOT NULL DEFAULT 0,
    budget      INTEGER
  );
`;

export const CREATE_LIST_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS list_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id     INTEGER NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    unit_price  INTEGER NOT NULL,
    quantity    REAL NOT NULL,
    unit        TEXT NOT NULL CHECK (unit IN ('un', 'kg')),
    subtotal    INTEGER NOT NULL,
    photo_uri   TEXT,
    created_at  TEXT NOT NULL
  );
`;

export const CREATE_LIST_ITEMS_LIST_ID_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
`;
