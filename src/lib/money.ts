/**
 * Subtotal = preço unitário (centavos) × quantidade, arredondado meia-unidade
 * para cima (round half up) uma única vez — nunca truncado, nunca
 * arredondamento bancário. Ver docs/plan.md ADR-02.
 */
export function multiplyCents(unitPriceCents: number, quantity: number): number {
  return Math.round(unitPriceCents * quantity);
}

/**
 * Total geral = soma dos subtotais já arredondados. Não re-arredonda a soma
 * (spec §3: o total é sempre derivado dos itens atuais, nunca acumulado à
 * parte).
 */
export function sumCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export interface MonthSummary {
  currentMonthTotalCents: number;
  averagePerPurchaseCents: number;
  previousMonthTotalCents: number;
  diffCents: number;
  diffPercent: number | null;
}

function isSameMonth(iso: string, year: number, monthIndex: number): boolean {
  const date = new Date(iso);
  return date.getFullYear() === year && date.getMonth() === monthIndex;
}

/** RF-45, RF-46, RF-47: resumo de gastos do mês corrente frente ao anterior. */
export function calculateMonthSummary<T extends { total: number; finishedAt: string | null }>(
  finishedLists: T[],
  referenceDate: Date,
): MonthSummary {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  // getMonth() já "estoura" de 0 para 11 e volta um ano com Date, sem
  // precisar tratar a virada de ano manualmente.
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const previousYear = previousMonthDate.getFullYear();
  const previousMonth = previousMonthDate.getMonth();

  const finished = finishedLists.filter(
    (list): list is T & { finishedAt: string } => list.finishedAt !== null,
  );

  const currentMonthLists = finished.filter((list) =>
    isSameMonth(list.finishedAt, currentYear, currentMonth),
  );
  const previousMonthLists = finished.filter((list) =>
    isSameMonth(list.finishedAt, previousYear, previousMonth),
  );

  const currentMonthTotalCents = sumCents(currentMonthLists.map((list) => list.total));
  const previousMonthTotalCents = sumCents(previousMonthLists.map((list) => list.total));
  const averagePerPurchaseCents =
    currentMonthLists.length === 0
      ? 0
      : Math.round(currentMonthTotalCents / currentMonthLists.length);
  const diffCents = currentMonthTotalCents - previousMonthTotalCents;
  const diffPercent =
    previousMonthTotalCents === 0 ? null : Math.round((diffCents / previousMonthTotalCents) * 100);

  return {
    currentMonthTotalCents,
    averagePerPurchaseCents,
    previousMonthTotalCents,
    diffCents,
    diffPercent,
  };
}
