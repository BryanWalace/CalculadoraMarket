import type { ListItemInput } from '../lib/validation';
import { addItem, deleteItem, listItemsByListId, updateItem } from './itemsQueries';
import type { AppDatabase } from './types';

const LIST_ITEM_ROW = {
  id: 10,
  list_id: 1,
  name: 'Arroz',
  unit_price: 1999,
  quantity: 2,
  unit: 'un' as const,
  subtotal: 3998,
  photo_uri: null,
  created_at: '2026-09-07T12:00:00.000Z',
};

function createFakeDatabase(overrides: Partial<AppDatabase> = {}): AppDatabase {
  return {
    execAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 10, changes: 1 }),
    withTransactionAsync: jest.fn(),
    ...overrides,
  };
}

const validInput: ListItemInput = {
  name: 'Arroz',
  unitPrice: 1999,
  quantity: 2,
  unit: 'un',
};

describe('addItem', () => {
  it('calcula o subtotal via multiplyCents e insere com query parametrizada', async () => {
    const db = createFakeDatabase();

    const result = await addItem(db, 1, validInput, null);

    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO list_items'),
      1,
      'Arroz',
      1999,
      2,
      'un',
      3998,
      null,
      expect.any(String),
    );
    expect(result.subtotal).toBe(3998);
    expect(result.id).toBe(10);
  });

  it('recalcula o subtotal corretamente para quantidade decimal (kg)', async () => {
    const db = createFakeDatabase();
    const kgInput: ListItemInput = { name: 'Picanha', unitPrice: 4999, quantity: 0.75, unit: 'kg' };

    const result = await addItem(db, 1, kgInput, null);

    expect(result.subtotal).toBe(3749); // 4999 * 0.75 = 3749.25 -> 3749
  });
});

describe('updateItem', () => {
  it('atualiza e relê o item do banco', async () => {
    const db = createFakeDatabase({
      getFirstAsync: jest.fn().mockResolvedValue(LIST_ITEM_ROW),
    });

    const result = await updateItem(db, 10, validInput);

    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE list_items'),
      'Arroz',
      1999,
      2,
      'un',
      3998,
      10,
    );
    expect(result.id).toBe(10);
    expect(result.listId).toBe(1);
  });

  it('lança erro claro se o item some entre o update e a releitura', async () => {
    const db = createFakeDatabase({ getFirstAsync: jest.fn().mockResolvedValue(null) });

    await expect(updateItem(db, 999, validInput)).rejects.toThrow('não encontrado');
  });
});

describe('deleteItem', () => {
  it('remove com query parametrizada', async () => {
    const db = createFakeDatabase();

    await deleteItem(db, 10);

    expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM list_items'), 10);
  });
});

describe('listItemsByListId', () => {
  it('lista os itens do mais novo para o mais antigo (item novo no topo)', async () => {
    const db = createFakeDatabase({
      getAllAsync: jest.fn().mockResolvedValue([LIST_ITEM_ROW]),
    });

    const result = await listItemsByListId(db, 1);

    expect(db.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('ORDER BY id DESC'), 1);
    expect(result).toEqual([
      {
        id: 10,
        listId: 1,
        name: 'Arroz',
        unitPrice: 1999,
        quantity: 2,
        unit: 'un',
        subtotal: 3998,
        photoUri: null,
        createdAt: '2026-09-07T12:00:00.000Z',
      },
    ]);
  });
});
