import type { ListItem } from '../../db/schema';
import { createInMemoryDatabase } from '../../db/inMemoryTestDatabase';
import { deletePhotoIfExists } from '../../lib/photoStorage';
import type { ListItemInput } from '../../lib/validation';
import {
  type CartState,
  selectItemCount,
  selectTotalCents,
  selectUnitSum,
  useCartStore,
} from './store';

jest.mock('../../lib/photoStorage', () => ({ deletePhotoIfExists: jest.fn() }));

const validInput: ListItemInput = {
  name: 'Arroz',
  unitPrice: 1999,
  quantity: 2,
  unit: 'un',
};

beforeEach(() => {
  useCartStore.setState({ activeList: null, items: [], isHydrated: false });
  (deletePhotoIfExists as jest.Mock).mockClear();
});

describe('useCartStore.hydrate', () => {
  it('cria um carrinho novo quando não há nenhum em andamento', async () => {
    const db = createInMemoryDatabase();

    await useCartStore.getState().hydrate(db);

    const state = useCartStore.getState();
    expect(state.isHydrated).toBe(true);
    expect(state.activeList).not.toBeNull();
    expect(state.items).toEqual([]);
  });

  it('reaproveita o carrinho em andamento existente em vez de criar outro', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    const firstListId = useCartStore.getState().activeList?.id;

    useCartStore.setState({ activeList: null, items: [], isHydrated: false });
    await useCartStore.getState().hydrate(db);

    expect(useCartStore.getState().activeList?.id).toBe(firstListId);
  });
});

describe('persistência entre reaberturas do app (RF-51, RF-52)', () => {
  it('o carrinho volta exatamente como estava depois de "fechar e reabrir" o app', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, null);
    await useCartStore
      .getState()
      .addItem(db, { name: 'Feijão', unitPrice: 899, quantity: 1, unit: 'un' }, null);
    const itemId = useCartStore.getState().items[1].id; // Arroz, o mais antigo
    await useCartStore
      .getState()
      .updateItem(db, itemId, { name: 'Arroz', unitPrice: 1999, quantity: 5, unit: 'un' });

    // Simula o app fechando: nada além do banco (db) sobrevive.
    useCartStore.setState({ activeList: null, items: [], isHydrated: false });

    await useCartStore.getState().hydrate(db);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.items.find((item) => item.name === 'Arroz')?.quantity).toBe(5);
    expect(state.items.find((item) => item.name === 'Feijão')).toBeTruthy();
  });

  it('itens excluídos e confirmados (fora da janela de desfazer) não voltam ao reabrir', async () => {
    jest.useFakeTimers();
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, null);
    const itemId = useCartStore.getState().items[0].id;

    useCartStore.getState().scheduleRemoval(db, itemId);
    await jest.advanceTimersByTimeAsync(5000);
    jest.useRealTimers();

    useCartStore.setState({ activeList: null, items: [], isHydrated: false });
    await useCartStore.getState().hydrate(db);

    expect(useCartStore.getState().items).toEqual([]);
  });
});

describe('useCartStore.addItem', () => {
  it('lança erro se o carrinho ainda não foi hidratado', async () => {
    const db = createInMemoryDatabase();

    await expect(useCartStore.getState().addItem(db, validInput, null)).rejects.toThrow(
      'não foi hidratado',
    );
  });

  it('adiciona o item no topo da lista (RF-11)', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);

    await useCartStore.getState().addItem(db, validInput, null);
    await useCartStore
      .getState()
      .addItem(db, { name: 'Feijão', unitPrice: 899, quantity: 1, unit: 'un' }, null);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('Feijão'); // o mais recente fica no topo
  });

  it('rejeita entrada inválida mesmo com o tipo correto (defesa em profundidade)', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    const invalidInput = {
      name: 'Item',
      unitPrice: -100,
      quantity: 1,
      unit: 'un',
    } as ListItemInput;

    await expect(useCartStore.getState().addItem(db, invalidInput, null)).rejects.toThrow();
  });
});

describe('useCartStore.updateItem', () => {
  it('atualiza o item em memória com o retorno do banco', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, null);
    const itemId = useCartStore.getState().items[0].id;

    await useCartStore
      .getState()
      .updateItem(db, itemId, { name: 'Arroz Integral', unitPrice: 2499, quantity: 3, unit: 'un' });

    const updated = useCartStore.getState().items[0];
    expect(updated.name).toBe('Arroz Integral');
    expect(updated.subtotal).toBe(7497);
  });
});

describe('useCartStore.adjustQuantity', () => {
  it('aumenta a quantidade e recalcula o subtotal', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, null);
    const itemId = useCartStore.getState().items[0].id;

    await useCartStore.getState().adjustQuantity(db, itemId, 1);

    const item = useCartStore.getState().items[0];
    expect(item.quantity).toBe(3);
    expect(item.subtotal).toBe(5997);
  });

  it('remove o item quando a quantidade chega a zero (RF-30)', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore
      .getState()
      .addItem(db, { name: 'Item único', unitPrice: 500, quantity: 1, unit: 'un' }, null);
    const itemId = useCartStore.getState().items[0].id;

    await useCartStore.getState().adjustQuantity(db, itemId, -1);

    expect(useCartStore.getState().items).toEqual([]);
  });

  it('não faz nada se o item não existe mais', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);

    await expect(useCartStore.getState().adjustQuantity(db, 999, 1)).resolves.toBeUndefined();
  });
});

describe('useCartStore.scheduleRemoval / undoRemoval (ADR-05)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('some da lista na hora, mas só apaga do banco depois de 5s', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, null);
    const itemId = useCartStore.getState().items[0].id;

    useCartStore.getState().scheduleRemoval(db, itemId);

    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().pendingDeletion?.item.id).toBe(itemId);
    // Ainda não passaram os 5s: o item continua no banco.
    expect(await db.getFirstAsync('SELECT * FROM list_items WHERE id = ?', itemId)).not.toBeNull();

    await jest.advanceTimersByTimeAsync(5000);

    expect(useCartStore.getState().pendingDeletion).toBeNull();
    expect(await db.getFirstAsync('SELECT * FROM list_items WHERE id = ?', itemId)).toBeNull();
  });

  it('desfazer restaura o item e cancela a exclusão agendada', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, null);
    const itemId = useCartStore.getState().items[0].id;

    useCartStore.getState().scheduleRemoval(db, itemId);
    useCartStore.getState().undoRemoval();

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().pendingDeletion).toBeNull();

    await jest.advanceTimersByTimeAsync(5000);

    // O item nunca foi apagado do banco, mesmo depois do prazo.
    expect(await db.getFirstAsync('SELECT * FROM list_items WHERE id = ?', itemId)).not.toBeNull();
  });

  it('excluir um segundo item enquanto o primeiro ainda está pendente finaliza o primeiro na hora', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, null);
    await useCartStore
      .getState()
      .addItem(db, { name: 'Feijão', unitPrice: 899, quantity: 1, unit: 'un' }, null);
    const [second, first] = useCartStore.getState().items;

    useCartStore.getState().scheduleRemoval(db, first.id);
    useCartStore.getState().scheduleRemoval(db, second.id);
    await Promise.resolve(); // deixa a exclusão imediata do primeiro (fire-and-forget) resolver

    expect(useCartStore.getState().pendingDeletion?.item.id).toBe(second.id);
    expect(await db.getFirstAsync('SELECT * FROM list_items WHERE id = ?', first.id)).toBeNull();
  });
});

describe('useCartStore.removeItem', () => {
  it('remove o item do estado', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, null);
    const itemId = useCartStore.getState().items[0].id;

    await useCartStore.getState().removeItem(db, itemId);

    expect(useCartStore.getState().items).toEqual([]);
  });
});

describe('useCartStore.clearList', () => {
  it('esvazia todos os itens da lista', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, null);
    await useCartStore
      .getState()
      .addItem(db, { name: 'Feijão', unitPrice: 899, quantity: 1, unit: 'un' }, null);

    await useCartStore.getState().clearList(db);

    expect(useCartStore.getState().items).toEqual([]);
  });

  it('apaga a foto de cada item removido (RF-56)', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, 'file:///a.jpg');
    await useCartStore
      .getState()
      .addItem(db, { name: 'Feijão', unitPrice: 899, quantity: 1, unit: 'un' }, 'file:///b.jpg');

    await useCartStore.getState().clearList(db);

    expect(deletePhotoIfExists).toHaveBeenCalledWith('file:///a.jpg');
    expect(deletePhotoIfExists).toHaveBeenCalledWith('file:///b.jpg');
  });

  it('cancela e finaliza uma exclusão pendente junto com o resto da lista', async () => {
    jest.useFakeTimers();
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    await useCartStore.getState().addItem(db, validInput, 'file:///pendente.jpg');
    const itemId = useCartStore.getState().items[0].id;

    useCartStore.getState().scheduleRemoval(db, itemId);
    await useCartStore.getState().clearList(db);

    expect(useCartStore.getState().pendingDeletion).toBeNull();
    expect(deletePhotoIfExists).toHaveBeenCalledWith('file:///pendente.jpg');

    await jest.advanceTimersByTimeAsync(5000);
    jest.useRealTimers();
  });
});

describe('useCartStore.finalizeList', () => {
  it('bloqueia finalizar um carrinho sem nenhum item (RF-40)', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);

    await expect(
      useCartStore.getState().finalizeList(db, 'Compra de 07/09/2026', null),
    ).rejects.toThrow('sem itens');
  });

  it('salva com o total correto e esvazia o carrinho para uma compra nova (RF-37, RF-39)', async () => {
    const db = createInMemoryDatabase();
    await useCartStore.getState().hydrate(db);
    const originalListId = useCartStore.getState().activeList?.id;
    await useCartStore.getState().addItem(db, validInput, null); // 1999 * 2 = 3998
    await useCartStore
      .getState()
      .addItem(db, { name: 'Feijão', unitPrice: 899, quantity: 1, unit: 'un' }, null);

    await useCartStore.getState().finalizeList(db, 'Compra no Mercado X', 'Mercado X');

    // Esvaziou e criou um carrinho novo, diferente do finalizado.
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().activeList?.id).not.toBe(originalListId);

    // A compra finalizada ficou gravada com o total certo (3998 + 899).
    const finalized = await db.getFirstAsync<{ total: number; name: string; finished_at: string }>(
      'SELECT * FROM shopping_lists WHERE id = ?',
      originalListId as number,
    );
    expect(finalized?.total).toBe(4897);
    expect(finalized?.name).toBe('Compra no Mercado X');
    expect(finalized?.finished_at).not.toBeNull();
  });
});

describe('seletores derivados', () => {
  it('nunca armazenam total/contagem à parte — sempre calculados dos itens', () => {
    const state: Pick<CartState, 'items'> = {
      items: [
        { subtotal: 1000, quantity: 2 } as ListItem,
        { subtotal: 500, quantity: 0.5 } as ListItem,
      ],
    };

    expect(selectTotalCents(state)).toBe(1500);
    expect(selectItemCount(state)).toBe(2);
    expect(selectUnitSum(state)).toBe(2.5);
  });
});
