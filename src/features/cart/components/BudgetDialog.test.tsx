import { fireEvent, render } from '@testing-library/react-native';

import { BudgetDialog } from './BudgetDialog';

describe('BudgetDialog', () => {
  it('começa em branco quando não há orçamento definido', async () => {
    const { getByLabelText } = await render(
      <BudgetDialog currentBudgetCents={null} onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );

    expect(getByLabelText('Orçamento').props.value).toBe('');
  });

  it('começa preenchido com o orçamento atual', async () => {
    const { getByLabelText } = await render(
      <BudgetDialog currentBudgetCents={10000} onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );

    expect(getByLabelText('Orçamento').props.value).toBe('R$ 100,00');
  });

  it('chama onConfirm com o valor em centavos digitado', async () => {
    const onConfirm = jest.fn();
    const { getByLabelText } = await render(
      <BudgetDialog currentBudgetCents={null} onConfirm={onConfirm} onCancel={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Orçamento'), '15000');
    await fireEvent.press(getByLabelText('Salvar orçamento'));

    expect(onConfirm).toHaveBeenCalledWith(15000);
  });

  it('campo vazio confirma com null (remove o orçamento)', async () => {
    const onConfirm = jest.fn();
    const { getByLabelText } = await render(
      <BudgetDialog currentBudgetCents={10000} onConfirm={onConfirm} onCancel={jest.fn()} />,
    );

    await fireEvent.changeText(getByLabelText('Orçamento'), '');
    await fireEvent.press(getByLabelText('Salvar orçamento'));

    expect(onConfirm).toHaveBeenCalledWith(null);
  });

  it('chama onCancel ao cancelar', async () => {
    const onCancel = jest.fn();
    const { getByLabelText } = await render(
      <BudgetDialog currentBudgetCents={null} onConfirm={jest.fn()} onCancel={onCancel} />,
    );

    await fireEvent.press(getByLabelText('Cancelar'));

    expect(onCancel).toHaveBeenCalled();
  });
});
