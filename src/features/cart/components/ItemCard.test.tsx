import { fireEvent, render } from '@testing-library/react-native';

import type { ListItem } from '../../../db/schema';
import { ItemCard } from './ItemCard';

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

describe('ItemCard', () => {
  it('mostra botões rápidos −/+ para itens un (RF-28)', async () => {
    const onAdjustQuantity = jest.fn();
    const { getByLabelText } = await render(
      <ItemCard item={makeItem({})} onPress={jest.fn()} onAdjustQuantity={onAdjustQuantity} />,
    );

    await fireEvent.press(getByLabelText('Aumentar quantidade de Arroz'));
    expect(onAdjustQuantity).toHaveBeenCalledWith(1);

    await fireEvent.press(getByLabelText('Diminuir quantidade de Arroz'));
    expect(onAdjustQuantity).toHaveBeenCalledWith(-1);
  });

  it('não mostra botões rápidos para itens kg (RF-29)', async () => {
    const { queryByLabelText } = await render(
      <ItemCard
        item={makeItem({ unit: 'kg', quantity: 0.75 })}
        onPress={jest.fn()}
        onAdjustQuantity={jest.fn()}
      />,
    );

    expect(queryByLabelText('Aumentar quantidade de Arroz')).toBeNull();
    expect(queryByLabelText('Diminuir quantidade de Arroz')).toBeNull();
  });

  it('toque no conteúdo do card chama onPress (abre edição)', async () => {
    const onPress = jest.fn();
    const { getByLabelText } = await render(
      <ItemCard item={makeItem({})} onPress={onPress} onAdjustQuantity={jest.fn()} />,
    );

    await fireEvent.press(getByLabelText('Item Arroz, toque para editar'));

    expect(onPress).toHaveBeenCalled();
  });
});
