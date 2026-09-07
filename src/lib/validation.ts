import { z } from 'zod';

const unitSchema = z.enum(['un', 'kg']);

/**
 * Preço em centavos, teto de R$ 99.999,99 (9_999_999 centavos) — generoso
 * para qualquer item de mercado real, mas suficiente para rejeitar lixo de
 * OCR (ex.: um código de barras lido como preço). RF-08.
 */
export const listItemInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    unitPrice: z.number().int().positive().max(9_999_999),
    quantity: z.number().positive(),
    unit: unitSchema,
  })
  .refine((value) => value.unit === 'kg' || Number.isInteger(value.quantity), {
    message: 'Quantidade deve ser inteira para itens por unidade',
    path: ['quantity'],
  });

/**
 * Orçamento em centavos, teto de R$ 999.999,99 (99_999_999 centavos) — o
 * valor total de uma compra pode ser maior que o preço de um único item.
 * RF-34, RF-38.
 */
export const shoppingListInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  store: z.string().trim().max(80).nullable().optional(),
  budget: z.number().int().positive().max(99_999_999).nullable().optional(),
});

export type Unit = z.infer<typeof unitSchema>;
export type ListItemInput = z.infer<typeof listItemInputSchema>;
export type ShoppingListInput = z.infer<typeof shoppingListInputSchema>;
