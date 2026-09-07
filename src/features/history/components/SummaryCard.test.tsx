import { render } from '@testing-library/react-native';

import type { MonthSummary } from '../../../lib/money';
import { SummaryCard } from './SummaryCard';

describe('SummaryCard', () => {
  it('mostra total do mês e média por compra (RF-45, RF-46)', async () => {
    const summary: MonthSummary = {
      currentMonthTotalCents: 12345,
      averagePerPurchaseCents: 6172,
      previousMonthTotalCents: 10000,
      diffCents: 2345,
      diffPercent: 23,
    };

    const { getByLabelText } = await render(<SummaryCard summary={summary} />);

    expect(getByLabelText('Total do mês').props.children).toBe('R$ 123,45');
    expect(getByLabelText('Média por compra').props.children.join('')).toBe(
      'Média por compra: R$ 61,72',
    );
  });

  it('mostra a variação percentual com sinal frente ao mês anterior (RF-47)', async () => {
    const summary: MonthSummary = {
      currentMonthTotalCents: 12000,
      averagePerPurchaseCents: 12000,
      previousMonthTotalCents: 10000,
      diffCents: 2000,
      diffPercent: 20,
    };

    const { getByLabelText } = await render(<SummaryCard summary={summary} />);

    expect(getByLabelText('Comparação com o mês anterior').props.children.join('')).toBe(
      '+20% frente a R$ 100,00 no mês anterior',
    );
  });

  it('mostra sinal negativo quando o gasto caiu frente ao mês anterior', async () => {
    const summary: MonthSummary = {
      currentMonthTotalCents: 8000,
      averagePerPurchaseCents: 8000,
      previousMonthTotalCents: 10000,
      diffCents: -2000,
      diffPercent: -20,
    };

    const { getByLabelText } = await render(<SummaryCard summary={summary} />);

    expect(getByLabelText('Comparação com o mês anterior').props.children.join('')).toBe(
      '-20% frente a R$ 100,00 no mês anterior',
    );
  });

  it('mostra aviso quando não há dados do mês anterior', async () => {
    const summary: MonthSummary = {
      currentMonthTotalCents: 5000,
      averagePerPurchaseCents: 5000,
      previousMonthTotalCents: 0,
      diffCents: 5000,
      diffPercent: null,
    };

    const { getByLabelText } = await render(<SummaryCard summary={summary} />);

    expect(getByLabelText('Comparação com o mês anterior').props.children).toBe(
      'Sem compras no mês anterior para comparar',
    );
  });
});
