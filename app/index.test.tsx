import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

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

  it('pede confirmação antes de limpar a lista e só limpa se confirmado (RF-33)', async () => {
    const clearList = jest.fn().mockResolvedValue(undefined);
    useCartStore.setState({
      isHydrated: true,
      activeList: ACTIVE_LIST,
      items: [makeItem({})],
      clearList,
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      buttons?.find((button) => button.text === 'Limpar')?.onPress?.();
    });

    const { getByLabelText } = await render(<CartScreen />);
    await fireEvent.press(getByLabelText('Limpar lista'));

    expect(alertSpy).toHaveBeenCalled();
    expect(clearList).toHaveBeenCalled();
  });

  it('não mostra "Finalizar compra" quando a lista está vazia (RF-40)', async () => {
    useCartStore.setState({ isHydrated: true, activeList: ACTIVE_LIST, items: [] });

    const { queryByLabelText } = await render(<CartScreen />);

    expect(queryByLabelText('Finalizar compra')).toBeNull();
  });

  it('abre o diálogo de finalizar e chama finalizeList ao confirmar (RF-37, RF-38)', async () => {
    const finalizeList = jest.fn().mockResolvedValue(undefined);
    useCartStore.setState({
      isHydrated: true,
      activeList: ACTIVE_LIST,
      items: [makeItem({})],
      finalizeList,
    });

    const { getByLabelText } = await render(<CartScreen />);
    await fireEvent.press(getByLabelText('Finalizar compra'));
    await fireEvent.changeText(getByLabelText('Loja'), 'Mercado Bom Preço');
    await fireEvent.press(getByLabelText('Finalizar'));

    expect(finalizeList).toHaveBeenCalledWith(
      {},
      expect.stringContaining('Mercado Bom Preço'),
      'Mercado Bom Preço',
    );
  });

  it('mostra "Definir orçamento" quando não há orçamento definido (RF-34)', async () => {
    useCartStore.setState({ isHydrated: true, activeList: ACTIVE_LIST, items: [] });

    const { getByText } = await render(<CartScreen />);

    expect(getByText('Definir orçamento')).toBeTruthy();
  });

  it('mostra o valor do orçamento quando já definido (RF-34)', async () => {
    useCartStore.setState({
      isHydrated: true,
      activeList: { ...ACTIVE_LIST, budget: 10000 },
      items: [],
    });

    const { getByText } = await render(<CartScreen />);

    expect(getByText('Orçamento: R$ 100,00')).toBeTruthy();
  });

  it('não mostra barra de progresso sem orçamento definido', async () => {
    useCartStore.setState({ isHydrated: true, activeList: ACTIVE_LIST, items: [] });

    const { queryByLabelText } = await render(<CartScreen />);

    expect(queryByLabelText('Progresso do orçamento')).toBeNull();
  });

  it('mostra barra de progresso do total em relação ao orçamento (RF-35)', async () => {
    useCartStore.setState({
      isHydrated: true,
      activeList: { ...ACTIVE_LIST, budget: 10000 },
      items: [makeItem({ subtotal: 3998 })],
    });

    const { getByLabelText } = await render(<CartScreen />);

    expect(getByLabelText('Progresso do orçamento').props.accessibilityValue).toEqual({
      min: 0,
      max: 10000,
      now: 3998,
    });
  });

  it('mantém a cor padrão do total dentro do orçamento', async () => {
    useCartStore.setState({
      isHydrated: true,
      activeList: { ...ACTIVE_LIST, budget: 10000 },
      items: [makeItem({ subtotal: 3998 })],
    });

    const { getByLabelText } = await render(<CartScreen />);

    const style = getByLabelText('Total geral').props.style;
    expect(Array.isArray(style) ? style.flat() : [style]).not.toContainEqual(
      expect.objectContaining({ color: '#dc2626' }),
    );
  });

  it('muda a cor do total ao ultrapassar o orçamento (RF-36)', async () => {
    useCartStore.setState({
      isHydrated: true,
      activeList: { ...ACTIVE_LIST, budget: 3000 },
      items: [makeItem({ subtotal: 3998 })],
    });

    const { getByLabelText } = await render(<CartScreen />);

    const style = getByLabelText('Total geral').props.style;
    expect(Array.isArray(style) ? style.flat() : [style]).toContainEqual(
      expect.objectContaining({ color: '#dc2626' }),
    );
  });

  it('navega para a tela de privacidade (RF-53)', async () => {
    useCartStore.setState({ isHydrated: true, activeList: ACTIVE_LIST, items: [] });

    const { getByLabelText } = await render(<CartScreen />);
    await fireEvent.press(getByLabelText('Privacidade'));

    expect(mockPush).toHaveBeenCalledWith('/privacy');
  });

  it('abre o diálogo de orçamento e chama setBudget ao salvar (RF-34)', async () => {
    const setBudget = jest.fn().mockResolvedValue(undefined);
    useCartStore.setState({
      isHydrated: true,
      activeList: ACTIVE_LIST,
      items: [],
      setBudget,
    });

    const { getByLabelText } = await render(<CartScreen />);
    await fireEvent.press(getByLabelText('Definir orçamento'));
    await fireEvent.changeText(getByLabelText('Orçamento'), '15000');
    await fireEvent.press(getByLabelText('Salvar orçamento'));

    expect(setBudget).toHaveBeenCalledWith({}, 15000);
  });
});
