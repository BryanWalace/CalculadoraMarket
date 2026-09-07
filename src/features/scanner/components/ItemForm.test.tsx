import { fireEvent, render } from '@testing-library/react-native';

import { ItemForm } from './ItemForm';

describe('ItemForm', () => {
  it('começa com "Adicionar" desabilitado (nome vazio, preço zero)', async () => {
    const { getByLabelText } = await render(<ItemForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

    expect(getByLabelText('Adicionar').props.accessibilityState.disabled).toBe(true);
  });

  it('calcula o subtotal ao vivo conforme nome, preço e quantidade mudam', async () => {
    const { getByLabelText } = await render(<ItemForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

    await fireEvent.changeText(getByLabelText('Nome do produto'), 'Arroz');
    await fireEvent.changeText(getByLabelText('Preço unitário'), '1999');
    await fireEvent.press(getByLabelText('Aumentar quantidade'));

    expect(getByLabelText('Subtotal').props.children.join('')).toBe('Subtotal: R$ 39,98');
    expect(getByLabelText('Adicionar').props.accessibilityState.disabled).toBe(false);
  });

  it('chama onSubmit com a entrada validada ao tocar em Adicionar', async () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = await render(<ItemForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    await fireEvent.changeText(getByLabelText('Nome do produto'), 'Arroz');
    await fireEvent.changeText(getByLabelText('Preço unitário'), '1999');
    await fireEvent.press(getByLabelText('Adicionar'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Arroz',
      unitPrice: 1999,
      quantity: 1,
      unit: 'un',
    });
  });

  it('chama onCancel ao tocar em Cancelar', async () => {
    const onCancel = jest.fn();
    const { getByLabelText } = await render(<ItemForm onSubmit={jest.fn()} onCancel={onCancel} />);

    await fireEvent.press(getByLabelText('Cancelar'));

    expect(onCancel).toHaveBeenCalled();
  });

  it('aceita quantidade decimal ao trocar a unidade para kg', async () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = await render(<ItemForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    await fireEvent.changeText(getByLabelText('Nome do produto'), 'Picanha');
    await fireEvent.changeText(getByLabelText('Preço unitário'), '4999');
    await fireEvent.press(getByLabelText('Unidade: kg'));
    await fireEvent.changeText(getByLabelText('Quantidade'), '0,75');
    await fireEvent.press(getByLabelText('Adicionar'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Picanha',
      unitPrice: 4999,
      quantity: 0.75,
      unit: 'kg',
    });
  });

  it('arredonda a quantidade ao voltar de kg para un, evitando decimal inválido', async () => {
    const { getByLabelText } = await render(
      <ItemForm
        initialValues={{ unit: 'kg', quantity: 1.5 }}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    await fireEvent.press(getByLabelText('Unidade: un'));

    expect(getByLabelText('Quantidade').props.value).toBe('2');
  });

  it('exibe o aviso discreto quando fornecido (RF-25)', async () => {
    const { getByRole } = await render(
      <ItemForm
        notice="Não consegui ler a etiqueta, preencha manualmente"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(getByRole('alert').props.children).toBe(
      'Não consegui ler a etiqueta, preencha manualmente',
    );
  });
});
