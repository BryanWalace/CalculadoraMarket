import { formatCartSummary, formatCurrencyBRL, formatDate, formatQuantity } from './format';

describe('formatCurrencyBRL', () => {
  it('formata milhar e centavos com vírgula decimal', () => {
    expect(formatCurrencyBRL(123456)).toBe('R$ 1.234,56');
  });

  it('formata valores menores que 1 real com zero à esquerda nos centavos', () => {
    expect(formatCurrencyBRL(5)).toBe('R$ 0,05');
  });

  it('formata zero', () => {
    expect(formatCurrencyBRL(0)).toBe('R$ 0,00');
  });

  it('formata valores redondos sem casas decimais perdidas', () => {
    expect(formatCurrencyBRL(100)).toBe('R$ 1,00');
  });

  it('formata milhões com múltiplos separadores de milhar', () => {
    expect(formatCurrencyBRL(123456789)).toBe('R$ 1.234.567,89');
  });
});

describe('formatQuantity', () => {
  it('formata quantidade inteira de itens por unidade sem casas decimais', () => {
    expect(formatQuantity(3, 'un')).toBe('3');
  });

  it('formata quantidade decimal de peso com três casas e vírgula', () => {
    expect(formatQuantity(0.75, 'kg')).toBe('0,750');
  });
});

describe('formatCartSummary', () => {
  it('formata contagem de itens e unidades no plural', () => {
    expect(formatCartSummary(12, 19)).toBe('12 itens · 19 unidades');
  });

  it('formata no singular quando a contagem é 1', () => {
    expect(formatCartSummary(1, 1)).toBe('1 item · 1 unidade');
  });

  it('formata soma de unidades decimal (itens por kg no total)', () => {
    expect(formatCartSummary(2, 1.5)).toBe('2 itens · 1,500 unidades');
  });
});

describe('formatDate', () => {
  it('formata data ISO em dd/mm/aaaa no horário local', () => {
    const localDate = new Date(2026, 8, 7, 12, 0, 0); // 7 de setembro de 2026, meio-dia local

    expect(formatDate(localDate.toISOString())).toBe('07/09/2026');
  });
});
