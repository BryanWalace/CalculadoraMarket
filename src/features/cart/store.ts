import { create } from 'zustand';

import {
  addItem as addItemQuery,
  deleteItem as deleteItemQuery,
  deleteItemsByListId,
  listItemsByListId,
  updateItem as updateItemQuery,
} from '../../db/itemsQueries';
import {
  createList,
  finalizeList as finalizeListQuery,
  getActiveList,
  getListWithItems,
  setBudget as setBudgetQuery,
} from '../../db/listsQueries';
import type { ListItem, ShoppingList } from '../../db/schema';
import type { AppDatabase } from '../../db/types';
import { sumCents } from '../../lib/money';
import { deletePhotoIfExists } from '../../lib/photoStorage';
import {
  listItemInputSchema,
  shoppingListInputSchema,
  type ListItemInput,
} from '../../lib/validation';

/**
 * Nome interno do carrinho antes de ser finalizado — nunca aparece para o
 * usuário; RF-38 sobrescreve o nome de verdade no momento de finalizar.
 */
const DRAFT_LIST_NAME = 'Carrinho';

/** Janela de desfazer da exclusão (RF-31/32). */
const UNDO_WINDOW_MS = 5000;

interface PendingDeletion {
  item: ListItem;
  timeoutId: ReturnType<typeof setTimeout>;
}

async function commitDeletion(db: AppDatabase, item: ListItem): Promise<void> {
  await deleteItemQuery(db, item.id);
  deletePhotoIfExists(item.photoUri);
}

export interface CartState {
  activeList: ShoppingList | null;
  items: ListItem[];
  isHydrated: boolean;
  pendingDeletion: PendingDeletion | null;
  hydrate: (db: AppDatabase) => Promise<void>;
  addItem: (db: AppDatabase, input: ListItemInput, photoUri: string | null) => Promise<void>;
  updateItem: (db: AppDatabase, id: number, input: ListItemInput) => Promise<void>;
  /** Só para itens `un` (RF-28/29); remove o item se a quantidade chegar a zero (RF-30). */
  adjustQuantity: (db: AppDatabase, id: number, delta: number) => Promise<void>;
  removeItem: (db: AppDatabase, id: number) => Promise<void>;
  /**
   * Some da lista na hora e agenda a exclusão real (banco + foto) para
   * daqui a 5s; `undoRemoval` cancela. Ver docs/plan.md ADR-05.
   */
  scheduleRemoval: (db: AppDatabase, id: number) => void;
  undoRemoval: () => void;
  clearList: (db: AppDatabase) => Promise<void>;
  /** Bloqueia carrinho vazio (RF-40); esvazia para uma compra nova ao terminar (RF-39). */
  finalizeList: (db: AppDatabase, name: string, store: string | null) => Promise<void>;
  /** Orçamento opcional do carrinho atual, em centavos; `null` remove o orçamento (RF-34). */
  setBudget: (db: AppDatabase, budgetCents: number | null) => Promise<void>;
  /** Duplica os itens de uma compra do histórico num carrinho novo (RF-43). */
  reopenFromHistory: (db: AppDatabase, historicalListId: number) => Promise<void>;
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
  pendingDeletion: null,

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

  scheduleRemoval: (db, id) => {
    const item = get().items.find((current) => current.id === id);
    if (!item) {
      return;
    }

    const existingPending = get().pendingDeletion;
    if (existingPending) {
      clearTimeout(existingPending.timeoutId);
      void commitDeletion(db, existingPending.item);
    }

    set((state) => ({ items: state.items.filter((current) => current.id !== id) }));

    const timeoutId = setTimeout(() => {
      void commitDeletion(db, item).then(() => {
        set((state) =>
          state.pendingDeletion?.item.id === item.id ? { pendingDeletion: null } : state,
        );
      });
    }, UNDO_WINDOW_MS);

    set({ pendingDeletion: { item, timeoutId } });
  },

  undoRemoval: () => {
    const { pendingDeletion } = get();
    if (!pendingDeletion) {
      return;
    }
    clearTimeout(pendingDeletion.timeoutId);
    set((state) => ({
      items: [pendingDeletion.item, ...state.items],
      pendingDeletion: null,
    }));
  },

  clearList: async (db) => {
    const { activeList, items, pendingDeletion } = get();
    if (!activeList) {
      return;
    }

    if (pendingDeletion) {
      clearTimeout(pendingDeletion.timeoutId);
      deletePhotoIfExists(pendingDeletion.item.photoUri);
    }
    for (const item of items) {
      deletePhotoIfExists(item.photoUri);
    }

    await deleteItemsByListId(db, activeList.id);
    set({ items: [], pendingDeletion: null });
  },

  finalizeList: async (db, name, store) => {
    const { activeList, items } = get();
    if (!activeList) {
      throw new Error('O carrinho ainda não foi hidratado');
    }
    if (items.length === 0) {
      throw new Error('Não é possível finalizar um carrinho sem itens');
    }

    await finalizeListQuery(db, activeList.id, name, store);
    const newList = await createList(db, DRAFT_LIST_NAME);
    set({ activeList: newList, items: [] });
  },

  setBudget: async (db, budgetCents) => {
    const { activeList } = get();
    if (!activeList) {
      throw new Error('O carrinho ainda não foi hidratado');
    }
    const validBudget = shoppingListInputSchema.shape.budget.parse(budgetCents);
    await setBudgetQuery(db, activeList.id, validBudget ?? null);
    set({ activeList: { ...activeList, budget: validBudget ?? null } });
  },

  reopenFromHistory: async (db, historicalListId) => {
    const historical = await getListWithItems(db, historicalListId);
    if (!historical) {
      throw new Error('Compra não encontrada no histórico');
    }

    const newList = await createList(db, DRAFT_LIST_NAME);
    const newItems: ListItem[] = [];
    for (const item of historical.items) {
      // Sem foto: o arquivo original pertence ao registro histórico, que
      // continua intacto — duplicar a referência arriscaria apagar a foto
      // de um item de lá se este aqui fosse excluído depois (RF-56).
      const newItem = await addItemQuery(
        db,
        newList.id,
        { name: item.name, unitPrice: item.unitPrice, quantity: item.quantity, unit: item.unit },
        null,
      );
      newItems.push(newItem);
    }

    set({ activeList: newList, items: newItems });
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
