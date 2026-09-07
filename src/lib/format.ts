/**
 * Formatação manual (sem Intl.NumberFormat): o Hermes, motor JS do React
 * Native, pode não embarcar dados de locale pt-BR completos em toda build,
 * mesmo passando no Jest (que roda em Node, com ICU completo). Preferimos
 * uma implementação determinística e idêntica em qualquer ambiente.
 */
export function formatCurrencyBRL(cents: number): string {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const reaisComMilhar = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${reaisComMilhar},${centavos.toString().padStart(2, '0')}`;
}

export function formatQuantity(quantity: number, unit: 'un' | 'kg'): string {
  if (unit === 'kg') {
    return quantity.toFixed(3).replace('.', ',');
  }
  return quantity.toString();
}

export function formatCartSummary(itemCount: number, unitSum: number): string {
  const itemLabel = itemCount === 1 ? 'item' : 'itens';
  const unitLabel = unitSum === 1 ? 'unidade' : 'unidades';
  const unitSumFormatted = Number.isInteger(unitSum)
    ? unitSum.toString()
    : unitSum.toFixed(3).replace('.', ',');

  return `${itemCount} ${itemLabel} · ${unitSumFormatted} ${unitLabel}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
