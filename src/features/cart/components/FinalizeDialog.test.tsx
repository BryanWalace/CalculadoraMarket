import { fireEvent, render } from '@testing-library/react-native';

import { FinalizeDialog } from './FinalizeDialog';

describe('FinalizeDialog', () => {
  it('sugere "Compra de <data>" quando a loja está vazia', async () => {
    const { getByLabelText } = await render(
      <FinalizeDialog onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    expect(getByLabelText('Nome da compra').props.value).toBe(
      `Compra de ${dd}/${mm}/${today.getFullYear()}`,
    );
  });

  it('atualiza a sugestão de nome ao digitar a loja, enquanto o nome não for editado à mão', async () => {
    const { getByLabelText } = await render(
      <FinalizeDialog onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Loja'), 'Mercado Bom Preço');

    expect(getByLabelText('Nome da compra').props.value).toMatch(/^Mercado Bom Preço - \d{2}/);
  });

  it('para de seguir a sugestão depois que o usuário edita o nome à mão', async () => {
    const { getByLabelText } = await render(
      <FinalizeDialog onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Nome da compra'), 'Nome escolhido por mim');
    await fireEvent.changeText(getByLabelText('Loja'), 'Mercado Bom Preço');

    expect(getByLabelText('Nome da compra').props.value).toBe('Nome escolhido por mim');
  });

  it('chama onConfirm com o nome e a loja ao finalizar', async () => {
    const onConfirm = jest.fn();
    const { getByLabelText } = await render(
      <FinalizeDialog onConfirm={onConfirm} onCancel={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Loja'), 'Mercado Bom Preço');
    await fireEvent.press(getByLabelText('Finalizar'));

    expect(onConfirm).toHaveBeenCalledWith({
      name: expect.stringMatching(/^Mercado Bom Preço - \d{2}/),
      store: 'Mercado Bom Preço',
    });
  });

  it('loja em branco vira store null ao confirmar', async () => {
    const onConfirm = jest.fn();
    const { getByLabelText } = await render(
      <FinalizeDialog onConfirm={onConfirm} onCancel={jest.fn()} />,
    );

    await fireEvent.press(getByLabelText('Finalizar'));

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ store: null }));
  });

  it('chama onCancel ao cancelar', async () => {
    const onCancel = jest.fn();
    const { getByLabelText } = await render(
      <FinalizeDialog onConfirm={jest.fn()} onCancel={onCancel} />,
    );

    await fireEvent.press(getByLabelText('Cancelar'));

    expect(onCancel).toHaveBeenCalled();
  });
});
