import { listItemInputSchema, shoppingListInputSchema } from './validation';

describe('listItemInputSchema', () => {
  it('aceita item válido em unidade (quantidade inteira)', () => {
    const result = listItemInputSchema.safeParse({
      name: 'Arroz',
      unitPrice: 1999,
      quantity: 2,
      unit: 'un',
    });

    expect(result.success).toBe(true);
  });

  it('aceita item válido por peso (quantidade decimal)', () => {
    const result = listItemInputSchema.safeParse({
      name: 'Picanha',
      unitPrice: 4999,
      quantity: 0.75,
      unit: 'kg',
    });

    expect(result.success).toBe(true);
  });

  it('rejeita quantidade decimal para itens em unidade', () => {
    const result = listItemInputSchema.safeParse({
      name: 'Arroz',
      unitPrice: 1999,
      quantity: 2.5,
      unit: 'un',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita preço zero ou negativo', () => {
    expect(
      listItemInputSchema.safeParse({ name: 'Item', unitPrice: 0, quantity: 1, unit: 'un' })
        .success,
    ).toBe(false);
    expect(
      listItemInputSchema.safeParse({ name: 'Item', unitPrice: -100, quantity: 1, unit: 'un' })
        .success,
    ).toBe(false);
  });

  it('rejeita quantidade zero ou negativa', () => {
    expect(
      listItemInputSchema.safeParse({ name: 'Item', unitPrice: 100, quantity: 0, unit: 'un' })
        .success,
    ).toBe(false);
  });

  it('rejeita preço acima do teto de R$ 99.999,99 (lixo de OCR)', () => {
    const result = listItemInputSchema.safeParse({
      name: 'Item',
      unitPrice: 10_000_000,
      quantity: 1,
      unit: 'un',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita nome vazio', () => {
    const result = listItemInputSchema.safeParse({
      name: '   ',
      unitPrice: 100,
      quantity: 1,
      unit: 'un',
    });

    expect(result.success).toBe(false);
  });

  it('rejeita nome acima de 120 caracteres', () => {
    const result = listItemInputSchema.safeParse({
      name: 'a'.repeat(121),
      unitPrice: 100,
      quantity: 1,
      unit: 'un',
    });

    expect(result.success).toBe(false);
  });
});

describe('shoppingListInputSchema', () => {
  it('aceita lista só com nome (loja e orçamento são opcionais)', () => {
    const result = shoppingListInputSchema.safeParse({ name: 'Compra de sábado' });

    expect(result.success).toBe(true);
  });

  it('aceita lista com loja e orçamento definidos', () => {
    const result = shoppingListInputSchema.safeParse({
      name: 'Compra de sábado',
      store: 'Supermercado Bom Preço',
      budget: 50000,
    });

    expect(result.success).toBe(true);
  });

  it('rejeita orçamento zero ou negativo', () => {
    const result = shoppingListInputSchema.safeParse({ name: 'Compra', budget: 0 });

    expect(result.success).toBe(false);
  });

  it('rejeita nome vazio', () => {
    const result = shoppingListInputSchema.safeParse({ name: '' });

    expect(result.success).toBe(false);
  });
});
