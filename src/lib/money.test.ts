import { calculateMonthSummary, multiplyCents, sumCents } from './money';

describe('multiplyCents', () => {
  it('multiplica preço unitário por quantidade inteira', () => {
    expect(multiplyCents(500, 3)).toBe(1500);
  });

  it('arredonda para o centavo mais próximo com quantidade decimal (kg)', () => {
    // 1099 * 0.75 = 824.25 -> 824
    expect(multiplyCents(1099, 0.75)).toBe(824);
  });

  it('arredonda meia-unidade de centavo para cima (ADR-02)', () => {
    // 100 * 0.125 = 12.5 exatos -> arredonda para 13, nunca para 12
    expect(multiplyCents(100, 0.125)).toBe(13);
  });

  it('lida com quantidade decimal de kg em um caso realista', () => {
    // 350 * 0.333 = 116.55 -> 117
    expect(multiplyCents(350, 0.333)).toBe(117);
  });

  it('quantidade 1 retorna o próprio preço unitário', () => {
    expect(multiplyCents(1234, 1)).toBe(1234);
  });
});

describe('sumCents', () => {
  it('soma uma lista de subtotais', () => {
    expect(sumCents([1500, 824, 13])).toBe(2337);
  });

  it('retorna 0 para uma lista vazia (carrinho sem itens)', () => {
    expect(sumCents([])).toBe(0);
  });

  it('retorna o próprio valor para uma lista de um item', () => {
    expect(sumCents([999])).toBe(999);
  });

  it('nunca acumula fora da lista: o resultado depende só dos valores recebidos', () => {
    // Regra de negócio (spec §3): o total é sempre derivado dos itens atuais,
    // nunca um acumulador que sobrevive além da lista passada.
    expect(sumCents([100, 200])).toBe(300);
    expect(sumCents([100])).toBe(100);
  });
});

describe('calculateMonthSummary', () => {
  // Meio-dia local evita qualquer risco de virada de data por fuso horário.
  const localIso = (year: number, monthIndex: number, day: number) =>
    new Date(year, monthIndex, day, 12).toISOString();

  const referenceDate = new Date(2026, 8, 15); // 15 de setembro de 2026

  it('soma o total do mês corrente e calcula a média por compra (RF-45, RF-46)', () => {
    const summary = calculateMonthSummary(
      [
        { total: 5000, finishedAt: localIso(2026, 8, 5) },
        { total: 3000, finishedAt: localIso(2026, 8, 12) },
      ],
      referenceDate,
    );

    expect(summary.currentMonthTotalCents).toBe(8000);
    expect(summary.averagePerPurchaseCents).toBe(4000);
  });

  it('ignora compras de meses fora do corrente/anterior', () => {
    const summary = calculateMonthSummary(
      [
        { total: 5000, finishedAt: localIso(2026, 8, 5) },
        { total: 9999, finishedAt: localIso(2026, 6, 1) }, // dois meses atrás
      ],
      referenceDate,
    );

    expect(summary.currentMonthTotalCents).toBe(5000);
  });

  it('retorna zero (não divide por zero) quando não há compras no mês corrente', () => {
    const summary = calculateMonthSummary([], referenceDate);

    expect(summary.currentMonthTotalCents).toBe(0);
    expect(summary.averagePerPurchaseCents).toBe(0);
  });

  it('calcula o total do mês anterior e a diferença em centavos (RF-47)', () => {
    const summary = calculateMonthSummary(
      [
        { total: 8000, finishedAt: localIso(2026, 8, 5) },
        { total: 6000, finishedAt: localIso(2026, 7, 20) },
      ],
      referenceDate,
    );

    expect(summary.previousMonthTotalCents).toBe(6000);
    expect(summary.diffCents).toBe(2000);
  });

  it('calcula a variação percentual frente ao mês anterior', () => {
    const summary = calculateMonthSummary(
      [
        { total: 12000, finishedAt: localIso(2026, 8, 5) },
        { total: 10000, finishedAt: localIso(2026, 7, 20) },
      ],
      referenceDate,
    );

    expect(summary.diffPercent).toBe(20); // (12000 - 10000) / 10000 * 100
  });

  it('diffPercent é null quando o mês anterior não teve nenhuma compra', () => {
    const summary = calculateMonthSummary(
      [{ total: 5000, finishedAt: localIso(2026, 8, 5) }],
      referenceDate,
    );

    expect(summary.previousMonthTotalCents).toBe(0);
    expect(summary.diffPercent).toBeNull();
  });

  it('lida corretamente com a virada de ano (janeiro -> dezembro do ano anterior)', () => {
    const januaryReference = new Date(2026, 0, 15); // 15 de janeiro de 2026
    const summary = calculateMonthSummary(
      [
        { total: 5000, finishedAt: localIso(2026, 0, 10) },
        { total: 3000, finishedAt: localIso(2025, 11, 20) },
      ],
      januaryReference,
    );

    expect(summary.currentMonthTotalCents).toBe(5000);
    expect(summary.previousMonthTotalCents).toBe(3000);
  });

  it('ignora compras com finishedAt null (carrinho ainda em andamento, não deveria chegar aqui)', () => {
    const summary = calculateMonthSummary(
      [
        { total: 5000, finishedAt: localIso(2026, 8, 5) },
        { total: 999999, finishedAt: null },
      ],
      referenceDate,
    );

    expect(summary.currentMonthTotalCents).toBe(5000);
  });
});
