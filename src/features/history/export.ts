import type { ListItem, ShoppingList } from '../../db/schema';
import { formatCurrencyBRL, formatQuantity } from '../../lib/format';

/**
 * Ponto e vírgula como separador (não vírgula): no Excel em pt-BR a vírgula
 * já é o separador decimal usado nos valores em R$, então ; é o padrão
 * local para evitar ambiguidade ao abrir a planilha.
 */
const CSV_DELIMITER = ';';

function escapeCsvField(field: string): string {
  if (/[";\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** RF-48: exporta uma compra do histórico em CSV. */
export function generatePurchaseCsv(list: ShoppingList, items: ListItem[]): string {
  const header = ['Nome', 'Quantidade', 'Unidade', 'Preço unitário', 'Subtotal'];
  const itemRows = items.map((item) => [
    item.name,
    formatQuantity(item.quantity, item.unit),
    item.unit,
    formatCurrencyBRL(item.unitPrice),
    formatCurrencyBRL(item.subtotal),
  ]);
  const totalRow = ['Total', '', '', '', formatCurrencyBRL(list.total)];

  return [header, ...itemRows, totalRow]
    .map((row) => row.map(escapeCsvField).join(CSV_DELIMITER))
    .join('\n');
}
