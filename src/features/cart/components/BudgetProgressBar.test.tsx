import { render } from '@testing-library/react-native';

import { BudgetProgressBar } from './BudgetProgressBar';

describe('BudgetProgressBar', () => {
  it('expõe min/max/now de acessibilidade proporcionais ao gasto (RF-35)', async () => {
    const { getByLabelText } = await render(
      <BudgetProgressBar totalCents={5000} budgetCents={10000} />,
    );

    expect(getByLabelText('Progresso do orçamento').props.accessibilityValue).toEqual({
      min: 0,
      max: 10000,
      now: 5000,
    });
  });

  it('não deixa "now" passar do orçamento mesmo quando o total ultrapassa', async () => {
    const { getByLabelText } = await render(
      <BudgetProgressBar totalCents={15000} budgetCents={10000} />,
    );

    expect(getByLabelText('Progresso do orçamento').props.accessibilityValue.now).toBe(10000);
  });
});
