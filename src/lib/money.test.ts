import { multiplyCents } from './money';

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
