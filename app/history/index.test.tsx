import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { ShoppingList } from '../../src/db/schema';
import HistoryScreen from './index';

const mockPush = jest.fn();
const mockListFinishedLists = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock('../../src/db/listsQueries', () => ({
  listFinishedLists: (...args: unknown[]) => mockListFinishedLists(...args),
}));

// Seis e sete meses atrás relativos a "agora": nunca colidem com o mês
// corrente/anterior que o SummaryCard calcula (RF-45/46/47), então o total
// de cada compra aqui não se repete acidentalmente no resumo do mês.
const now = new Date();
const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1, 12).toISOString();
const sevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 7, 1, 12).toISOString();

const OLDER: ShoppingList = {
  id: 1,
  name: 'Compra antiga',
  store: null,
  createdAt: sevenMonthsAgo,
  finishedAt: sevenMonthsAgo,
  total: 5000,
  budget: null,
};

const NEWER: ShoppingList = {
  id: 2,
  name: 'Compra recente',
  store: 'Mercado X',
  createdAt: sixMonthsAgo,
  finishedAt: sixMonthsAgo,
  total: 12345,
  budget: null,
};

beforeEach(() => {
  mockPush.mockClear();
  mockListFinishedLists.mockReset();
});

describe('HistoryScreen', () => {
  it('mostra estado vazio quando não há compras finalizadas', async () => {
    mockListFinishedLists.mockResolvedValue([]);

    const { getByText } = await render(<HistoryScreen />);

    await waitFor(() => expect(getByText('Nenhuma compra finalizada ainda')).toBeTruthy());
  });

  it('lista as compras, mais recente primeiro (RF-41)', async () => {
    // A query já devolve ordenado por finished_at DESC (T-15); a tela só exibe.
    mockListFinishedLists.mockResolvedValue([NEWER, OLDER]);

    const { getByText } = await render(<HistoryScreen />);

    await waitFor(() => expect(getByText('Compra recente')).toBeTruthy());
    expect(getByText('Compra antiga')).toBeTruthy();
    expect(getByText('R$ 123,45')).toBeTruthy();
  });

  it('navega para o detalhe ao tocar numa compra (RF-42)', async () => {
    mockListFinishedLists.mockResolvedValue([NEWER]);

    const { getByLabelText } = await render(<HistoryScreen />);

    await waitFor(() => getByLabelText('Compra Compra recente'));
    await fireEvent.press(getByLabelText('Compra Compra recente'));

    expect(mockPush).toHaveBeenCalledWith('/history/2');
  });

  it('mostra o SummaryCard com o resumo do mês corrente no topo (RF-45, RF-46, RF-47)', async () => {
    const thisMonthIso = new Date(now.getFullYear(), now.getMonth(), 10, 12).toISOString();
    const thisMonthList: ShoppingList = { ...NEWER, id: 3, total: 10000, finishedAt: thisMonthIso };

    mockListFinishedLists.mockResolvedValue([thisMonthList]);

    const { getByLabelText } = await render(<HistoryScreen />);

    await waitFor(() => expect(getByLabelText('Total do mês').props.children).toBe('R$ 100,00'));
  });
});
