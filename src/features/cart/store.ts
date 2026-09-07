import { create } from 'zustand';

import {
  addItem as addItemQuery,
  deleteItem as deleteItemQuery,
  deleteItemsByListId,
  listItemsByListId,
  updateItem as updateItemQuery,
} from '../../db/itemsQueries';
import { createList, getActiveList } from '../../db/listsQueries';
import type { ListItem, ShoppingList } from '../../db/schema';
import type { AppDatabase } from '../../db/types';
import { sumCents } from '../../lib/money';
import { listItemInputSchema, type ListItemInput } from '../../lib/validation';

/**
 * Nome interno do carrinho antes de ser finalizado — nunca aparece para o
 * usuário; RF-38 sobrescreve o nome de verdade no momento de finalizar.
 */
const DRAFT_LIST_NAME = 'Carrinho';

export interface CartState {
  activeList: ShoppingList | null;
  items: ListItem[];
  isHydrated: boolean;
  hydrate: (db: AppDatabase) => Promise<void>;
  addItem: (db: AppDatabase, input: ListItemInput, photoUri: string | null) => Promise<void>;
  updateItem: (db: AppDatabase, id: number, input: ListItemInput) => Promise<void>;
  /** Só para itens `un` (RF-28/29); remove o item se a quantidade chegar a zero (RF-30). */
  adjustQuantity: (db: AppDatabase, id: number, delta: number) => Promise<void>;
  removeItem: (db: AppDatabase, id: number) => Promise<void>;
  clearList: (db: AppDatabase) => Promise<void>;
}

/**
 * SQLite é a fonte da verdade; esta store é só uma cópia em memória
 * hidratada do banco. Toda ação grava primeiro no banco e só depois
 * atualiza o estado a partir do retorno da escrita — nunca o contrário.
 * Ver docs/plan.md ADR-01.
 */
export const useCartStore = create<CartState>((set, get) => ({
  activeList: null,
  items: [],
  isHydrated: false,

  hydrate: async (db) => {
    const existingList = await getActiveList(db);
    const activeList = existingList ?? (await createList(db, DRAFT_LIST_NAME));
    const items = await listItemsByListId(db, activeList.id);
    set({ activeList, items, isHydrated: true });
  },

  addItem: async (db, input, photoUri) => {
    const { activeList } = get();
    if (!activeList) {
      throw new Error('O carrinho ainda não foi hidratado');
    }
    const validInput = listItemInputSchema.parse(input);
    const newItem = await addItemQuery(db, activeList.id, validInput, photoUri);
    set((state) => ({ items: [newItem, ...state.items] }));
  },

  updateItem: async (db, id, input) => {
    const validInput = listItemInputSchema.parse(input);
    const updatedItem = await updateItemQuery(db, id, validInput);
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? updatedItem : item)),
    }));
  },

  adjustQuantity: async (db, id, delta) => {
    const item = get().items.find((current) => current.id === id);
    if (!item) {
      return;
    }
    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      await get().removeItem(db, id);
      return;
    }
    await get().updateItem(db, id, {
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: newQuantity,
      unit: item.unit,
    });
  },

  removeItem: async (db, id) => {
    await deleteItemQuery(db, id);
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },

  clearList: async (db) => {
    const { activeList } = get();
    if (!activeList) {
      return;
    }
    await deleteItemsByListId(db, activeList.id);
    set({ items: [] });
  },
}));

/** Total geral sempre derivado dos itens atuais — nunca um campo à parte. */
export function selectTotalCents(state: Pick<CartState, 'items'>): number {
  return sumCents(state.items.map((item) => item.subtotal));
}

export function selectItemCount(state: Pick<CartState, 'items'>): number {
  return state.items.length;
}

/** Soma das quantidades de todos os itens (RF-03: "12 itens · 19 unidades"). */
export function selectUnitSum(state: Pick<CartState, 'items'>): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}
