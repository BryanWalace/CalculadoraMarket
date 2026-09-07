import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { useCartStore } from '../src/features/cart/store';
import type { ListItem, ShoppingList } from '../src/db/schema';
import CartScreen from './index';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

const ACTIVE_LIST: ShoppingList = {
  id: 1,
  name: 'Carrinho',
  store: null,
  createdAt: '2026-09-07T12:00:00.000Z',
  finishedAt: null,
  total: 0,
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
    createdAt: '2026-09-07T12:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  mockPush.mockClear();
  useCartStore.setState({
    activeList: null,
    items: [],
    isHydrated: false,
    hydrate: jest.fn().mockResolvedValue(undefined),
  });
});

describe('CartScreen', () => {
  it('mostra "Carregando…" antes de hidratar', async () => {
    const { getByText } = await render(<CartScreen />);

    expect(getByText('Carregando…')).toBeTruthy();
  });

  it('mostra o estado vazio quando não há itens', async () => {
    useCartStore.setState({ isHydrated: true, activeList: ACTIVE_LIST, items: [] });

    const { getByText } = await render(<CartScreen />);

    await waitFor(() => expect(getByText('Seu carrinho está vazio')).toBeTruthy());
  });

  it('exibe os itens e o total/resumo no rodapé (RF-01, RF-02, RF-03)', async () => {
    useCartStore.setState({
      isHydrated: true,
      activeList: ACTIVE_LIST,
      items: [
        makeItem({ id: 1, name: 'Arroz', subtotal: 3998, quantity: 2 }),
        makeItem({ id: 2, name: 'Feijão', subtotal: 899, quantity: 1 }),
      ],
    });

    const { getByText, getByLabelText } = await render(<CartScreen />);

    await waitFor(() => expect(getByText('Arroz')).toBeTruthy());
    expect(getByText('Feijão')).toBeTruthy();
    expect(getByLabelText('Total geral').props.children).toBe('R$ 48,97');
    expect(getByText('2 itens · 3 unidades')).toBeTruthy();
  });

  it('navega para a câmera ao tocar no botão flutuante (RF-04)', async () => {
    useCartStore.setState({ isHydrated: true, activeList: ACTIVE_LIST, items: [] });

    const { getByLabelText } = await render(<CartScreen />);
    await fireEvent.press(getByLabelText('Fotografar etiqueta'));

    expect(mockPush).toHaveBeenCalledWith('/scanner/camera');
  });
});
