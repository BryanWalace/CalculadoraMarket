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

const OLDER: ShoppingList = {
  id: 1,
  name: 'Compra antiga',
  store: null,
  createdAt: '2026-08-01T10:00:00.000Z',
  finishedAt: '2026-08-01T11:00:00.000Z',
  total: 5000,
  budget: null,
};

const NEWER: ShoppingList = {
  id: 2,
  name: 'Compra recente',
  store: 'Mercado X',
  createdAt: '2026-09-01T10:00:00.000Z',
  finishedAt: '2026-09-01T11:00:00.000Z',
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
});
