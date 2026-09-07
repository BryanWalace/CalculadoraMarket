import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { createInMemoryDatabase } from '../src/db/inMemoryTestDatabase';
import { useCartStore } from '../src/features/cart/store';
import CartScreen from './index';
import ConfirmationScreen from './scanner/confirm';

/**
 * Teste de integração ponta a ponta (T-25): passa pelas duas telas de
 * verdade (confirmação e carrinho) ligadas pela mesma store e um banco
 * fake, sem mockar addItem/updateItem — só expo-router e expo-sqlite,
 * que são os módulos nativos que não rodam no Jest.
 */
const mockBack = jest.fn();
let mockSearchParams: { itemId?: string } = {};
let mockDb: ReturnType<typeof createInMemoryDatabase>;

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: () => mockBack() },
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
}));

beforeEach(() => {
  mockBack.mockClear();
  mockSearchParams = {};
  mockDb = createInMemoryDatabase();
  useCartStore.setState({ activeList: null, items: [], isHydrated: false });
});

describe('fluxo adicionar item manualmente → total no rodapé', () => {
  it('preencher e confirmar o formulário reflete no total geral da CartScreen', async () => {
    await useCartStore.getState().hydrate(mockDb);

    const confirmationScreen = await render(<ConfirmationScreen />);

    await fireEvent.changeText(confirmationScreen.getByLabelText('Nome do produto'), 'Arroz');
    await fireEvent.changeText(confirmationScreen.getByLabelText('Preço unitário'), '1999');
    await fireEvent.press(confirmationScreen.getByLabelText('Aumentar quantidade'));
    await fireEvent.press(confirmationScreen.getByLabelText('Adicionar'));

    expect(mockBack).toHaveBeenCalled();

    const cartScreen = await render(<CartScreen />);

    await waitFor(() => expect(cartScreen.getByText('Arroz')).toBeTruthy());
    expect(cartScreen.getByLabelText('Total geral').props.children).toBe('R$ 39,98');
    expect(cartScreen.getByText('1 item · 2 unidades')).toBeTruthy();
  });

  it('adicionar um segundo item soma corretamente ao total já existente', async () => {
    // Primeiro item, direto pela store (equivalente a já ter passado pela tela antes).
    await useCartStore.getState().hydrate(mockDb);
    await useCartStore
      .getState()
      .addItem(mockDb, { name: 'Feijão', unitPrice: 899, quantity: 1, unit: 'un' }, null);

    const confirmationScreen = await render(<ConfirmationScreen />);
    await fireEvent.changeText(confirmationScreen.getByLabelText('Nome do produto'), 'Arroz');
    await fireEvent.changeText(confirmationScreen.getByLabelText('Preço unitário'), '1999');
    await fireEvent.press(confirmationScreen.getByLabelText('Adicionar'));

    const cartScreen = await render(<CartScreen />);

    await waitFor(() => expect(cartScreen.getByText('Arroz')).toBeTruthy());
    expect(cartScreen.getByLabelText('Total geral').props.children).toBe('R$ 28,98'); // 899 + 1999
    expect(cartScreen.getByText('2 itens · 2 unidades')).toBeTruthy();
  });
});
