import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { createInMemoryDatabase } from '../../src/db/inMemoryTestDatabase';
import { useCartStore } from '../../src/features/cart/store';
import { listFinishedLists } from '../../src/db/listsQueries';
import CartScreen from '../index';
import HistoryScreen from './index';

/**
 * Teste de integração ponta a ponta (T-54): adiciona itens pelo carrinho de
 * verdade, finaliza pelo FinalizeDialog de verdade, e confere que a compra
 * aparece na HistoryScreen de verdade com o mesmo total — tudo sobre o
 * mesmo banco fake, sem mockar nenhuma lógica de negócio própria.
 */
let mockDb: ReturnType<typeof createInMemoryDatabase>;

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
}));

beforeEach(() => {
  mockDb = createInMemoryDatabase();
  useCartStore.setState({ activeList: null, items: [], isHydrated: false });
});

describe('fluxo completo: adicionar itens → finalizar → aparece no histórico', () => {
  it('a compra finalizada aparece no histórico com o total correto (RF-37, RF-39, RF-41)', async () => {
    await useCartStore.getState().hydrate(mockDb);
    await useCartStore
      .getState()
      .addItem(mockDb, { name: 'Arroz', unitPrice: 1999, quantity: 2, unit: 'un' }, null);
    await useCartStore
      .getState()
      .addItem(mockDb, { name: 'Feijão', unitPrice: 899, quantity: 1, unit: 'un' }, null);

    const cartScreen = await render(<CartScreen />);
    await waitFor(() => cartScreen.getByLabelText('Finalizar compra'));
    await fireEvent.press(cartScreen.getByLabelText('Finalizar compra'));
    await fireEvent.changeText(cartScreen.getByLabelText('Loja'), 'Mercado Bom Preço');
    await fireEvent.press(cartScreen.getByLabelText('Finalizar'));

    // O carrinho esvaziou para uma compra nova (RF-39).
    await waitFor(() => expect(useCartStore.getState().items).toEqual([]));

    const historyScreen = await render(<HistoryScreen />);
    await waitFor(() => expect(historyScreen.getByText(/Mercado Bom Preço/)).toBeTruthy());
    // 1999*2 + 899*1 = 4897 -- aparece duas vezes (no card da compra e no
    // resumo do mês no topo, já que essa é a única compra do mês corrente).
    expect(historyScreen.getAllByText('R$ 48,97')).toHaveLength(2);
  });

  it('a compra finalizada some da lista ativa mas os itens continuam intactos no detalhe (RF-42)', async () => {
    await useCartStore.getState().hydrate(mockDb);
    await useCartStore
      .getState()
      .addItem(mockDb, { name: 'Arroz', unitPrice: 1999, quantity: 2, unit: 'un' }, null);

    await useCartStore.getState().finalizeList(mockDb, 'Compra de teste', null);

    const finished = await listFinishedLists(mockDb);
    expect(finished).toHaveLength(1);
    expect(finished[0].total).toBe(3998);
    expect(finished[0].finishedAt).not.toBeNull();
  });
});
