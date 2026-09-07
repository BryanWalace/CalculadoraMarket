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
