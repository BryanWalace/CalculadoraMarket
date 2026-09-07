import {
  createList,
  finalizeList,
  getActiveList,
  getListById,
  getListWithItems,
  listFinishedLists,
  setBudget,
} from './listsQueries';
import type { AppDatabase } from './types';

const SHOPPING_LIST_ROW = {
  id: 1,
  name: 'Compra de sábado',
  store: null,
  created_at: '2026-09-07T12:00:00.000Z',
  finished_at: null,
  total: 0,
  budget: null,
};

function createFakeDatabase(overrides: Partial<AppDatabase> = {}): AppDatabase {
  return {
    execAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    withTransactionAsync: jest.fn(),
    ...overrides,
  };
}

describe('createList', () => {
  it('insere com query parametrizada e devolve a lista criada', async () => {
    const db = createFakeDatabase();

    const result = await createList(db, 'Compra de sábado');

    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO shopping_lists'),
      'Compra de sábado',
      expect.any(String),
    );
    // Sem interpolação de valor na query — só placeholders.
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.not.stringContaining('Compra de sábado'),
      expect.anything(),
      expect.anything(),
    );
    expect(result).toMatchObject({ id: 1, name: 'Compra de sábado', finishedAt: null, total: 0 });
  });
});

describe('getActiveList', () => {
  it('mapeia a linha do banco para o formato camelCase', async () => {
    const db = createFakeDatabase({
      getFirstAsync: jest.fn().mockResolvedValue(SHOPPING_LIST_ROW),
    });

    const result = await getActiveList(db);

    expect(db.getFirstAsync).toHaveBeenCalledWith(
      expect.stringContaining('WHERE finished_at IS NULL'),
    );
    expect(result).toEqual({
      id: 1,
      name: 'Compra de sábado',
      store: null,
      createdAt: '2026-09-07T12:00:00.000Z',
      finishedAt: null,
      total: 0,
      budget: null,
    });
  });

  it('retorna null quando não há carrinho em andamento', async () => {
    const db = createFakeDatabase({ getFirstAsync: jest.fn().mockResolvedValue(null) });

    expect(await getActiveList(db)).toBeNull();
  });
});

describe('setBudget', () => {
  it('atualiza o orçamento com query parametrizada', async () => {
    const db = createFakeDatabase();

    await setBudget(db, 1, 50000);

    expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('SET budget = ?'), 50000, 1);
  });
});

describe('finalizeList', () => {
  it('recalcula o total via SQL a partir de list_items, nunca recebe o total como parâmetro', async () => {
    const db = createFakeDatabase();

    await finalizeList(db, 1, 'Compra do Mercado X', 'Mercado X');

    const [sql, ...params] = (db.runAsync as jest.Mock).mock.calls[0];
    expect(sql).toContain('SELECT COALESCE(SUM(subtotal), 0) FROM list_items');
    expect(params).toEqual(['Compra do Mercado X', 'Mercado X', expect.any(String), 1, 1]);
  });
});

describe('listFinishedLists', () => {
  it('lista só compras finalizadas, mais recente primeiro', async () => {
    const db = createFakeDatabase({
      getAllAsync: jest.fn().mockResolvedValue([SHOPPING_LIST_ROW]),
    });

    const result = await listFinishedLists(db);

    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringMatching(/WHERE finished_at IS NOT NULL.*ORDER BY finished_at DESC/s),
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

describe('getListWithItems', () => {
  it('retorna null quando a lista não existe', async () => {
    const db = createFakeDatabase({ getFirstAsync: jest.fn().mockResolvedValue(null) });

    expect(await getListWithItems(db, 999)).toBeNull();
  });

  it('combina a lista com seus itens quando ela existe', async () => {
    const db = createFakeDatabase({
      getFirstAsync: jest.fn().mockResolvedValue(SHOPPING_LIST_ROW),
      getAllAsync: jest.fn().mockResolvedValue([]),
    });

    const result = await getListWithItems(db, 1);

    expect(result).not.toBeNull();
    expect(result?.list.id).toBe(1);
    expect(result?.items).toEqual([]);
  });
});

describe('getListById', () => {
  it('busca uma lista pelo id', async () => {
    const db = createFakeDatabase({
      getFirstAsync: jest.fn().mockResolvedValue(SHOPPING_LIST_ROW),
    });

    const result = await getListById(db, 1);

    expect(db.getFirstAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ?'), 1);
    expect(result?.id).toBe(1);
  });
});
