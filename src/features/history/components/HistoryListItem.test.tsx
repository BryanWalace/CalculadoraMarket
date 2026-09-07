import { fireEvent, render } from '@testing-library/react-native';

import type { ShoppingList } from '../../../db/schema';
import { HistoryListItem } from './HistoryListItem';

const LIST: ShoppingList = {
  id: 1,
  name: 'Compra no Mercado X',
  store: 'Mercado X',
  createdAt: '2026-09-01T10:00:00.000Z',
  finishedAt: '2026-09-01T11:30:00.000Z',
  total: 12345,
  budget: null,
};

describe('HistoryListItem', () => {
  it('mostra nome, data e total (RF-41)', async () => {
    const { getByText } = await render(<HistoryListItem list={LIST} onPress={jest.fn()} />);

    expect(getByText('Compra no Mercado X')).toBeTruthy();
    expect(getByText('01/09/2026')).toBeTruthy();
    expect(getByText('R$ 123,45')).toBeTruthy();
  });

  it('chama onPress ao tocar', async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await render(<HistoryListItem list={LIST} onPress={onPress} />);

    await fireEvent.press(getByLabelText('Compra Compra no Mercado X'));

    expect(onPress).toHaveBeenCalled();
  });
});
