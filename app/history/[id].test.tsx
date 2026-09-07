import { fireEvent, render, waitFor } from '@testing-library/react-native';

import type { ListItem, ShoppingList } from '../../src/db/schema';
import { useCartStore } from '../../src/features/cart/store';
import HistoryDetailScreen from './[id]';

const mockGetListWithItems = jest.fn();
const mockPush = jest.fn();
let mockSearchParams: { id: string } = { id: '1' };

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock('../../src/db/listsQueries', () => ({
  getListWithItems: (...args: unknown[]) => mockGetListWithItems(...args),
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

beforeEach(() => {
  mockGetListWithItems.mockReset();
  mockPush.mockClear();
  mockSearchParams = { id: '1' };
  useCartStore.setState({ reopenFromHistory: jest.fn().mockResolvedValue(undefined) });
});

describe('HistoryDetailScreen', () => {
  it('mostra nome, data, itens e total da compra, somente leitura (RF-42)', async () => {
    mockGetListWithItems.mockResolvedValue({
      list: LIST,
      items: [
        makeItem({ id: 1, name: 'Arroz', subtotal: 3998 }),
        makeItem({ id: 2, name: 'Feijão', subtotal: 899, quantity: 1 }),
      ],
    });

    const { getByText, getByLabelText, queryByLabelText } = await render(<HistoryDetailScreen />);

    await waitFor(() => expect(getByText('Compra no Mercado X')).toBeTruthy());
    expect(getByText('01/09/2026')).toBeTruthy();
    expect(getByText('Arroz')).toBeTruthy();
    expect(getByText('Feijão')).toBeTruthy();
    expect(getByLabelText('Total da compra').props.children).toBe('R$ 48,97');

    // Somente leitura: nenhum controle de edição/exclusão/ajuste.
    expect(queryByLabelText('Excluir Arroz')).toBeNull();
    expect(queryByLabelText('Aumentar quantidade de Arroz')).toBeNull();
  });

  it('reabre a compra como carrinho novo e navega para o carrinho (RF-43)', async () => {
    mockGetListWithItems.mockResolvedValue({
      list: LIST,
      items: [makeItem({})],
    });

    const { getByLabelText } = await render(<HistoryDetailScreen />);
    await waitFor(() => getByLabelText('Reabrir como carrinho novo'));
    await fireEvent.press(getByLabelText('Reabrir como carrinho novo'));

    expect(useCartStore.getState().reopenFromHistory).toHaveBeenCalledWith({}, 1);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('mostra mensagem quando a compra não é encontrada', async () => {
    mockGetListWithItems.mockResolvedValue(null);

    const { getByText } = await render(<HistoryDetailScreen />);

    await waitFor(() => expect(getByText('Compra não encontrada.')).toBeTruthy());
  });
});
