import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { ListItem, ShoppingList } from '../../db/schema';
import { generatePurchaseCsv, generatePurchaseText, shareExportedPurchase } from './export';

const mockWrite = jest.fn();
const mockCreate = jest.fn();
const mockDelete = jest.fn();

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
  Paths: { cache: 'file:///cache/' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

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

describe('generatePurchaseText', () => {
  it('gera nome, data, um item por linha e o total, prontos para colar em qualquer lugar', () => {
    const text = generatePurchaseText(LIST, [
      makeItem({ name: 'Arroz', quantity: 2, unit: 'un', unitPrice: 1999, subtotal: 3998 }),
      makeItem({ name: 'Picanha', quantity: 0.75, unit: 'kg', unitPrice: 4999, subtotal: 3749 }),
    ]);

    expect(text).toBe(
      [
        'Compra no Mercado X',
        '01/09/2026',
        '',
        'Arroz — 2 un × R$ 19,99 = R$ 39,98',
        'Picanha — 0,750 kg × R$ 49,99 = R$ 37,49',
        '',
        'Total: R$ 48,97',
      ].join('\n'),
    );
  });

  it('omite a linha de data quando a compra não tem finishedAt', () => {
    const text = generatePurchaseText({ ...LIST, finishedAt: null }, [makeItem({})]);

    expect(text.split('\n')[0]).toBe('Compra no Mercado X');
    expect(text.split('\n')[1]).toBe('');
  });

  it('gera texto válido mesmo para uma compra sem itens', () => {
    const text = generatePurchaseText(LIST, []);

    expect(text).toContain('Total: R$ 48,97');
  });
});

describe('shareExportedPurchase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (File as unknown as jest.Mock).mockImplementation((...segments: string[]) => ({
      uri: segments.join(''),
      exists: false,
      create: mockCreate,
      write: mockWrite,
      delete: mockDelete,
    }));
  });

  it('grava o conteúdo num arquivo temporário e compartilha (RF-50)', async () => {
    await shareExportedPurchase(LIST, [makeItem({})], 'csv');

    expect(mockCreate).toHaveBeenCalled();
    expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('Nome;Quantidade'));
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/Compra no Mercado X.csv');
  });

  it('usa a extensão .txt para o formato de texto simples', async () => {
    await shareExportedPurchase(LIST, [makeItem({})], 'text');

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/Compra no Mercado X.txt');
  });

  it('sanitiza caracteres inválidos no nome do arquivo', async () => {
    await shareExportedPurchase({ ...LIST, name: 'Compra: Mercado / 07-09' }, [], 'csv');

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/Compra_ Mercado _ 07-09.csv');
  });

  it('lança erro amigável quando o compartilhamento não está disponível', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    await expect(shareExportedPurchase(LIST, [], 'csv')).rejects.toThrow('não disponível');
    expect(mockWrite).not.toHaveBeenCalled();
  });
});
