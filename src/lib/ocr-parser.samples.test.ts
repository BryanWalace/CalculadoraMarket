import { parseLabel, type OcrBlock, type ParsedLabel } from './ocr-parser';

/**
 * Consolida T-31 a T-34 contra amostras completas de etiqueta (várias
 * linhas de texto reconhecido, como o ML Kit devolveria de uma foto real),
 * em vez de blocos isolados testando uma regra por vez. Cobre o "cobertura
 * obrigatória... pelo menos 10 amostras reais de texto de etiqueta,
 * incluindo casos que devem falhar" do pedido original.
 */
interface Sample {
  description: string;
  blocks: OcrBlock[];
  expected: Partial<ParsedLabel>;
}

const samples: Sample[] = [
  {
    description: 'etiqueta simples de mercearia (nome + preço em un)',
    blocks: [
      { text: 'Arroz Tipo 1 5kg', boundingBoxHeight: 24 },
      { text: 'R$ 22,90', boundingBoxHeight: 48 },
      { text: 'COD 123456', boundingBoxHeight: 16 },
    ],
    expected: { name: 'Arroz Tipo 1 5kg', priceCents: 2290, unit: 'un', confident: true },
  },
  {
    description: 'etiqueta de açougue com preço por kg',
    blocks: [
      { text: 'Alcatra Bovina', boundingBoxHeight: 26 },
      { text: 'R$ 39,90/kg', boundingBoxHeight: 44 },
    ],
    expected: { name: 'Alcatra Bovina', priceCents: 3990, unit: 'kg', confident: true },
  },
  {
    description: 'etiqueta com selo de oferta e preço pequeno',
    blocks: [
      { text: 'OFERTA', boundingBoxHeight: 30 },
      { text: 'Sabonete Lux 90g', boundingBoxHeight: 20 },
      { text: 'R$ 2,49', boundingBoxHeight: 36 },
    ],
    expected: { name: 'Sabonete Lux 90g', priceCents: 249, unit: 'un', confident: true },
  },
  {
    description: 'etiqueta completa com código de barras, CNPJ e validade concorrendo',
    blocks: [
      { text: 'Leite Integral 1L', boundingBoxHeight: 22 },
      { text: 'R$ 6,49', boundingBoxHeight: 42 },
      { text: '7891000100103', boundingBoxHeight: 14 },
      { text: 'CNPJ 12.345.678/0001-90', boundingBoxHeight: 14 },
      { text: 'VALIDADE 15.03.2026', boundingBoxHeight: 14 },
    ],
    // Title Case por palavra (RF-21) não sabe que "1L" convenciona L
    // maiúsculo — comportamento aceitável, não é uma regra da spec.
    expected: { name: 'Leite Integral 1l', priceCents: 649, unit: 'un', confident: true },
  },
  {
    description: 'preço quebrado em duas linhas (inteiro numa, centavos na outra)',
    blocks: [
      { text: 'Queijo Mussarela', boundingBoxHeight: 24 },
      { text: 'R$ 34,', boundingBoxHeight: 40 },
      { text: '90', boundingBoxHeight: 20 },
    ],
    expected: { name: 'Queijo Mussarela', priceCents: 3490, unit: 'un', confident: true },
  },
  {
    description: 'etiqueta com "leve/pague" e à vista',
    blocks: [
      { text: 'LEVE 3 PAGUE 2', boundingBoxHeight: 28 },
      { text: 'Iogurte Morango', boundingBoxHeight: 20 },
      { text: 'R$ 4,99', boundingBoxHeight: 38 },
      { text: 'À VISTA NO PIX', boundingBoxHeight: 16 },
    ],
    expected: { name: 'Iogurte Morango', priceCents: 499, unit: 'un', confident: true },
  },
  {
    description: 'hortifruti com gramatura e preço por kg',
    blocks: [
      { text: 'Tomate Salada', boundingBoxHeight: 22 },
      { text: '0,850 KG', boundingBoxHeight: 18 },
      { text: 'R$ 7,99/kg', boundingBoxHeight: 40 },
    ],
    expected: { name: 'Tomate Salada', priceCents: 799, unit: 'kg', confident: true },
  },
  {
    description: 'nome acentuado em caixa alta, Title Case correto',
    blocks: [
      { text: 'FEIJÃO PRETO CARIOCA 1KG', boundingBoxHeight: 24 },
      { text: 'R$ 8,79', boundingBoxHeight: 40 },
    ],
    expected: { name: 'Feijão Preto Carioca 1kg', priceCents: 879, unit: 'un', confident: true },
  },
  {
    description: 'FALHA PARCIAL: preço reconhecido, nome ilegível (só ruído/código sobrou)',
    blocks: [
      { text: 'R$ 12,34', boundingBoxHeight: 40 },
      { text: '7891234567895', boundingBoxHeight: 16 },
      { text: 'COD', boundingBoxHeight: 14 },
    ],
    expected: { name: null, priceCents: 1234, confident: true },
  },
  {
    description:
      'FALHA PARCIAL: nome reconhecido, preço em formato inválido (sem 2 casas decimais)',
    blocks: [
      { text: 'Detergente Neutro', boundingBoxHeight: 24 },
      { text: 'R$ 2,5', boundingBoxHeight: 40 },
    ],
    expected: { name: 'Detergente Neutro', priceCents: null, confident: true },
  },
  {
    description: 'FALHA TOTAL: etiqueta ilegível, só código de barras e ruído',
    blocks: [
      { text: '7891234567895', boundingBoxHeight: 40 },
      { text: 'CNPJ 12.345.678/0001-90', boundingBoxHeight: 16 },
      { text: 'OFERTA', boundingBoxHeight: 20 },
    ],
    expected: { name: null, priceCents: null, confident: false },
  },
  {
    description: 'FALHA TOTAL: nenhum texto reconhecido (foto sem nada legível)',
    blocks: [],
    expected: { name: null, priceCents: null, unit: 'un', confident: false },
  },
];

describe('parseLabel — amostras completas de etiqueta (T-35)', () => {
  it.each(samples)('$description', ({ blocks, expected }) => {
    const result = parseLabel(blocks);
    expect(result).toMatchObject(expected);
  });

  it('cobre pelo menos 10 amostras, incluindo casos que devem falhar', () => {
    expect(samples.length).toBeGreaterThanOrEqual(10);
    const failingSamples = samples.filter((sample) => sample.expected.confident === false);
    expect(failingSamples.length).toBeGreaterThan(0);
  });
});
