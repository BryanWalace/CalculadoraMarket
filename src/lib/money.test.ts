import { multiplyCents, sumCents } from './money';

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
