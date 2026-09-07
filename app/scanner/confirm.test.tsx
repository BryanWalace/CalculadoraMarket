import { fireEvent, render } from '@testing-library/react-native';

import type { ListItem } from '../../src/db/schema';
import { useCartStore } from '../../src/features/cart/store';
import ConfirmationScreen from './confirm';

const mockBack = jest.fn();
let mockSearchParams: { itemId?: string } = {};

jest.mock('expo-router', () => ({
  router: { back: () => mockBack() },
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => ({}),
}));

const EXISTING_ITEM: ListItem = {
  id: 5,
  listId: 1,
  name: 'Arroz',
  unitPrice: 1999,
  quantity: 2,
  unit: 'un',
  subtotal: 3998,
  photoUri: null,
  createdAt: '2026-09-07T12:00:00.000Z',
};

beforeEach(() => {
  mockBack.mockClear();
  mockSearchParams = {};
  useCartStore.setState({
    activeList: null,
    items: [EXISTING_ITEM],
    isHydrated: true,
    addItem: jest.fn().mockResolvedValue(undefined),
    updateItem: jest.fn().mockResolvedValue(undefined),
  });
});

describe('ConfirmationScreen', () => {
  it('sem itemId, abre em branco e chama addItem ao adicionar', async () => {
    const { getByLabelText } = await render(<ConfirmationScreen />);

    expect(getByLabelText('Nome do produto').props.value).toBe('');

    await fireEvent.changeText(getByLabelText('Nome do produto'), 'Feijão');
    await fireEvent.changeText(getByLabelText('Preço unitário'), '899');
    await fireEvent.press(getByLabelText('Adicionar'));

    expect(useCartStore.getState().addItem).toHaveBeenCalled();
    expect(useCartStore.getState().updateItem).not.toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });

  it('com itemId, pré-preenche com os dados do item e chama updateItem (RF-10)', async () => {
    mockSearchParams = { itemId: '5' };

    const { getByLabelText } = await render(<ConfirmationScreen />);

    expect(getByLabelText('Nome do produto').props.value).toBe('Arroz');
    expect(getByLabelText('Preço unitário').props.value).toBe('R$ 19,99');

    await fireEvent.press(getByLabelText('Adicionar'));

    expect(useCartStore.getState().updateItem).toHaveBeenCalledWith(
      {},
      5,
      expect.objectContaining({ name: 'Arroz' }),
    );
    expect(useCartStore.getState().addItem).not.toHaveBeenCalled();
  });

  it('cancelar volta para a tela anterior sem gravar nada', async () => {
    const { getByLabelText } = await render(<ConfirmationScreen />);

    await fireEvent.press(getByLabelText('Cancelar'));

    expect(mockBack).toHaveBeenCalled();
    expect(useCartStore.getState().addItem).not.toHaveBeenCalled();
  });
});
