import { parseLabel } from './ocr-parser';

describe('parseLabel — seleção de preço (RF-17, RF-18)', () => {
  it('reconhece o formato "R$ 12,34"', () => {
    const result = parseLabel([{ text: 'R$ 12,34', boundingBoxHeight: 40 }]);
    expect(result.priceCents).toBe(1234);
  });

  it('reconhece o formato "12,34" sem o prefixo R$', () => {
    const result = parseLabel([{ text: '12,34', boundingBoxHeight: 40 }]);
    expect(result.priceCents).toBe(1234);
  });

  it('reconhece o formato "1.234,56" com separador de milhar', () => {
    const result = parseLabel([{ text: '1.234,56', boundingBoxHeight: 40 }]);
    expect(result.priceCents).toBe(123456);
  });

  it('reconhece o formato "12.34" com ponto como decimal', () => {
    const result = parseLabel([{ text: '12.34', boundingBoxHeight: 40 }]);
    expect(result.priceCents).toBe(1234);
  });

  it('reconhece preço quebrado em duas linhas separadas', () => {
    const result = parseLabel([
      { text: 'R$ 12,', boundingBoxHeight: 40 },
      { text: '34', boundingBoxHeight: 20 },
    ]);
    expect(result.priceCents).toBe(1234);
  });

  it('escolhe o candidato de maior altura de bounding box quando há vários números', () => {
    const result = parseLabel([
      { text: '7,99', boundingBoxHeight: 15 }, // preço por kg, texto pequeno
      { text: '12,34', boundingBoxHeight: 60 }, // preço principal, texto grande
    ]);
    expect(result.priceCents).toBe(1234);
  });

  it('retorna priceCents null quando não há nenhum preço reconhecível', () => {
    const result = parseLabel([{ text: 'OFERTA IMPERDÍVEL', boundingBoxHeight: 40 }]);
    expect(result.priceCents).toBeNull();
  });

  it('retorna priceCents null para lista de blocos vazia', () => {
    const result = parseLabel([]);
    expect(result.priceCents).toBeNull();
  });
});
