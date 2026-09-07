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

describe('parseLabel — ignora candidatos que não são preço (RF-19)', () => {
  it('ignora código de barras (sequência longa de dígitos, sem separador decimal)', () => {
    const result = parseLabel([{ text: '7891234567895', boundingBoxHeight: 40 }]);
    expect(result.priceCents).toBeNull();
  });

  it('ignora CNPJ mesmo tendo pontos que parecem separador decimal', () => {
    const result = parseLabel([
      { text: 'CNPJ 12.345.678/0001-90', boundingBoxHeight: 40 },
      { text: 'R$ 12,34', boundingBoxHeight: 60 },
    ]);
    expect(result.priceCents).toBe(1234);
  });

  it('ignora data com ponto como separador (não confunde com preço em formato de ponto decimal)', () => {
    const result = parseLabel([
      { text: 'VALIDADE 15.03.2026', boundingBoxHeight: 40 },
      { text: 'R$ 8,50', boundingBoxHeight: 40 },
    ]);
    expect(result.priceCents).toBe(850);
  });

  it('ignora gramatura/volume (500g, 0,500) mesmo com formato parecido com preço', () => {
    const result = parseLabel([
      { text: '0,500 KG', boundingBoxHeight: 40 },
      { text: 'R$ 15,90', boundingBoxHeight: 50 },
    ]);
    expect(result.priceCents).toBe(1590);
  });

  it('reconhece preço por kg mesmo com sufixo /kg colado', () => {
    const result = parseLabel([{ text: 'R$ 15,90/kg', boundingBoxHeight: 40 }]);
    expect(result.priceCents).toBe(1590);
  });

  it('não reconhece nada quando só há código de barras, CNPJ, data e gramatura', () => {
    const result = parseLabel([
      { text: '7891234567895', boundingBoxHeight: 40 },
      { text: 'CNPJ 12.345.678/0001-90', boundingBoxHeight: 40 },
      { text: 'VALIDADE 15.03.2026', boundingBoxHeight: 40 },
      { text: '500g', boundingBoxHeight: 40 },
    ]);
    expect(result.priceCents).toBeNull();
  });
});

describe('parseLabel — extração do nome (RF-20, RF-21)', () => {
  it('escolhe a linha alfabética mais longa como nome do produto', () => {
    const result = parseLabel([
      { text: 'ARROZ BRANCO TIPO 1 5KG', boundingBoxHeight: 30 },
      { text: 'R$ 24,90', boundingBoxHeight: 40 },
      { text: 'COD', boundingBoxHeight: 20 },
    ]);
    expect(result.name).toBe('Arroz Branco Tipo 1 5kg');
  });

  it('aplica Title Case ao nome extraído', () => {
    const result = parseLabel([{ text: 'FEIJÃO PRETO CARIOCA', boundingBoxHeight: 30 }]);
    expect(result.name).toBe('Feijão Preto Carioca');
  });

  it('exclui palavras de ruído comuns em etiquetas (OFERTA, PROMOÇÃO, VALIDADE, CÓD, EAN, À VISTA, LEVE, PAGUE)', () => {
    const result = parseLabel([
      { text: 'OFERTA IMPERDÍVEL', boundingBoxHeight: 50 },
      { text: 'PROMOÇÃO DA SEMANA', boundingBoxHeight: 45 },
      { text: 'LEVE 3 PAGUE 2', boundingBoxHeight: 40 },
      { text: 'À VISTA NO PIX', boundingBoxHeight: 35 },
      { text: 'Biscoito Recheado', boundingBoxHeight: 20 },
    ]);
    expect(result.name).toBe('Biscoito Recheado');
  });

  it('não escolhe o preço nem o código como nome', () => {
    const result = parseLabel([
      { text: 'R$ 12,34', boundingBoxHeight: 40 },
      { text: '7891234567895', boundingBoxHeight: 40 },
      { text: 'Leite Integral', boundingBoxHeight: 20 },
    ]);
    expect(result.name).toBe('Leite Integral');
  });

  it('retorna name null quando nenhuma linha alfabética sobra', () => {
    const result = parseLabel([
      { text: 'R$ 12,34', boundingBoxHeight: 40 },
      { text: '7891234567895', boundingBoxHeight: 40 },
      { text: 'OFERTA', boundingBoxHeight: 20 },
    ]);
    expect(result.name).toBeNull();
  });
});

describe('parseLabel — detecção de unidade kg (RF-22)', () => {
  it('detecta "kg" e marca a unidade como peso', () => {
    const result = parseLabel([
      { text: 'Picanha Bovina', boundingBoxHeight: 30 },
      { text: 'R$ 49,90/kg', boundingBoxHeight: 40 },
    ]);
    expect(result.unit).toBe('kg');
  });

  it('detecta "Kg" e "KG" em qualquer capitalização', () => {
    expect(parseLabel([{ text: 'R$ 10,00 Kg', boundingBoxHeight: 40 }]).unit).toBe('kg');
    expect(parseLabel([{ text: 'R$ 10,00 KG', boundingBoxHeight: 40 }]).unit).toBe('kg');
  });

  it('detecta kg mesmo numa linha só de gramatura (ex.: "0,500 KG")', () => {
    const result = parseLabel([
      { text: '0,500 KG', boundingBoxHeight: 40 },
      { text: 'R$ 15,90', boundingBoxHeight: 50 },
    ]);
    expect(result.unit).toBe('kg');
  });

  it('assume "un" quando não há nenhuma menção a kg', () => {
    const result = parseLabel([
      { text: 'Refrigerante 2L', boundingBoxHeight: 30 },
      { text: 'R$ 8,99', boundingBoxHeight: 40 },
    ]);
    expect(result.unit).toBe('un');
  });

  it('assume "un" para lista de blocos vazia', () => {
    expect(parseLabel([]).unit).toBe('un');
  });
});

describe('parseLabel — confiança do reconhecimento (RF-25)', () => {
  it('confident é true quando encontra preço e nome', () => {
    const result = parseLabel([
      { text: 'Arroz Branco', boundingBoxHeight: 30 },
      { text: 'R$ 24,90', boundingBoxHeight: 40 },
    ]);
    expect(result.confident).toBe(true);
  });

  it('confident é true na extração parcial: só preço (RF-24 não é falha)', () => {
    const result = parseLabel([{ text: 'R$ 24,90', boundingBoxHeight: 40 }]);
    expect(result.confident).toBe(true);
    expect(result.priceCents).toBe(2490);
    expect(result.name).toBeNull();
  });

  it('confident é true na extração parcial: só nome (RF-24 não é falha)', () => {
    const result = parseLabel([{ text: 'Arroz Branco Tipo 1', boundingBoxHeight: 30 }]);
    expect(result.confident).toBe(true);
    expect(result.name).toBe('Arroz Branco Tipo 1');
    expect(result.priceCents).toBeNull();
  });

  it('confident é false só quando nem preço nem nome são encontrados (RF-25)', () => {
    const result = parseLabel([
      { text: '7891234567895', boundingBoxHeight: 40 },
      { text: 'OFERTA', boundingBoxHeight: 20 },
    ]);
    expect(result.confident).toBe(false);
    expect(result.name).toBeNull();
    expect(result.priceCents).toBeNull();
  });

  it('confident é false para lista de blocos vazia', () => {
    expect(parseLabel([]).confident).toBe(false);
  });
});
