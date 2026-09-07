import type { Unit } from './validation';

export interface OcrBlock {
  text: string;
  boundingBoxHeight: number;
}

export interface ParsedLabel {
  name: string | null;
  priceCents: number | null;
  unit: Unit;
  /** false quando nada foi reconhecido com confiança — dispara RF-25. */
  confident: boolean;
}

/**
 * Cobre R$ 12,34 / 12,34 / 1.234,56 (milhar) / 12.34 (ponto como decimal,
 * comum quando o OCR confunde vírgula com ponto). O grupo capturado é só a
 * parte numérica, sem o prefixo R$.
 */
const PRICE_PATTERN = /R?\$?\s?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+\.\d{2})/;

interface PriceCandidate {
  cents: number;
  height: number;
}

function parsePriceMatchToCents(match: string): number {
  const normalized = match.includes(',') ? match.replace(/\./g, '').replace(',', '.') : match;
  return Math.round(parseFloat(normalized) * 100);
}

function findPriceCandidates(blocks: OcrBlock[]): PriceCandidate[] {
  const candidates: PriceCandidate[] = [];

  for (const block of blocks) {
    const match = PRICE_PATTERN.exec(block.text);
    if (match) {
      candidates.push({ cents: parsePriceMatchToCents(match[1]), height: block.boundingBoxHeight });
    }
  }

  // Preço quebrado em linhas separadas: só conta quando nenhuma das duas
  // linhas isoladas já formava um preço válido por conta própria.
  for (let i = 0; i < blocks.length - 1; i += 1) {
    const first = blocks[i];
    const second = blocks[i + 1];
    if (PRICE_PATTERN.exec(first.text) || PRICE_PATTERN.exec(second.text)) {
      continue;
    }
    const combinedMatch = PRICE_PATTERN.exec(first.text + second.text);
    if (combinedMatch) {
      candidates.push({
        cents: parsePriceMatchToCents(combinedMatch[1]),
        height: Math.max(first.boundingBoxHeight, second.boundingBoxHeight),
      });
    }
  }

  return candidates;
}

/** RF-17: entre os candidatos, vence o de maior altura de bounding box. */
function selectBestPrice(blocks: OcrBlock[]): number | null {
  const candidates = findPriceCandidates(blocks);
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce((best, current) => (current.height > best.height ? current : best))
    .cents;
}

export function parseLabel(blocks: OcrBlock[]): ParsedLabel {
  const priceCents = selectBestPrice(blocks);

  return {
    name: null,
    priceCents,
    unit: 'un',
    confident: priceCents !== null,
  };
}
