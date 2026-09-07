import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { ListItem, ShoppingList } from '../../db/schema';
import { formatCurrencyBRL, formatDate, formatQuantity } from '../../lib/format';

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

/** RF-49: exporta uma compra do histórico em texto simples (WhatsApp, e-mail etc.). */
export function generatePurchaseText(list: ShoppingList, items: ListItem[]): string {
  const lines = [
    list.name,
    ...(list.finishedAt ? [formatDate(list.finishedAt)] : []),
    '',
    ...items.map(
      (item) =>
        `${item.name} — ${formatQuantity(item.quantity, item.unit)} ${item.unit} × ${formatCurrencyBRL(item.unitPrice)} = ${formatCurrencyBRL(item.subtotal)}`,
    ),
    '',
    `Total: ${formatCurrencyBRL(list.total)}`,
  ];

  return lines.join('\n');
}

export type ExportFormat = 'csv' | 'text';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_ ]/g, '_') || 'compra';
}

function extensionFor(format: ExportFormat): string {
  return format === 'csv' ? 'csv' : 'txt';
}

/**
 * RF-50: grava o conteúdo exportado num arquivo temporário e abre o
 * compartilhamento nativo do sistema (WhatsApp, Drive, e-mail etc.).
 */
export async function shareExportedPurchase(
  list: ShoppingList,
  items: ListItem[],
  format: ExportFormat,
): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Compartilhamento não disponível neste aparelho');
  }

  const content =
    format === 'csv' ? generatePurchaseCsv(list, items) : generatePurchaseText(list, items);
  const file = new File(Paths.cache, `${sanitizeFileName(list.name)}.${extensionFor(format)}`);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(content);

  await Sharing.shareAsync(file.uri);
}
