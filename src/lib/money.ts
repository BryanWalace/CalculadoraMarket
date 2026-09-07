/**
 * Subtotal = preço unitário (centavos) × quantidade, arredondado meia-unidade
 * para cima (round half up) uma única vez — nunca truncado, nunca
 * arredondamento bancário. Ver docs/plan.md ADR-02.
 */
export function multiplyCents(unitPriceCents: number, quantity: number): number {
  return Math.round(unitPriceCents * quantity);
}
