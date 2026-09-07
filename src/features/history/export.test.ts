import type { ListItem, ShoppingList } from '../../db/schema';
import { generatePurchaseCsv } from './export';

const LIST: ShoppingList = {
  id: 1,
  name: 'Compra no Mercado X',
  store: 'Mercado X',
  createdAt: '2026-09-01T10:00:00.000Z',
  finishedAt: '2026-09-01T11:00:00.000Z',
  total: 4897,
  budget: null,
};

function makeItem(overrides: Partial<ListItem>): ListItem {
  return {
    id: 1,
    listId: 1,
    name: 'Arroz',
    unitPrice: 1999,
    quantity: 2,
    unit: 'un',
    subtotal: 3998,
    photoUri: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('generatePurchaseCsv', () => {
  it('gera cabeçalho, uma linha por item e uma linha de total, separados por ponto e vírgula', () => {
    const csv = generatePurchaseCsv(LIST, [
      makeItem({ name: 'Arroz', quantity: 2, unit: 'un', unitPrice: 1999, subtotal: 3998 }),
      makeItem({ name: 'Picanha', quantity: 0.75, unit: 'kg', unitPrice: 4999, subtotal: 3749 }),
    ]);
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Nome;Quantidade;Unidade;Preço unitário;Subtotal');
    expect(lines[1]).toBe('Arroz;2;un;R$ 19,99;R$ 39,98');
    expect(lines[2]).toBe('Picanha;0,750;kg;R$ 49,99;R$ 37,49');
    expect(lines[3]).toBe('Total;;;;R$ 48,97');
  });

  it('coloca entre aspas e escapa um nome de item que contenha ponto e vírgula', () => {
    const csv = generatePurchaseCsv(LIST, [makeItem({ name: 'Item; com ponto e vírgula' })]);

    expect(csv.split('\n')[1]).toContain('"Item; com ponto e vírgula"');
  });

  it('escapa aspas duplas dentro do nome do item', () => {
    const csv = generatePurchaseCsv(LIST, [makeItem({ name: 'Sabonete "Extra" 90g' })]);

    expect(csv.split('\n')[1]).toContain('"Sabonete ""Extra"" 90g"');
  });

  it('gera só cabeçalho e total quando a compra não tem itens', () => {
    const csv = generatePurchaseCsv(LIST, []);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe('Total;;;;R$ 48,97');
  });
});
