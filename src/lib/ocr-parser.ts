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

/**
 * Rejeita o "match" se ele for só um pedaço de um número maior — ex.: "12.34"
 * dentro de um CNPJ ("12.345.678/...") ou de uma data ("15.03.2026"). Um
 * preço de verdade nunca tem outro dígito ou ponto colado imediatamente
 * antes/depois (RF-19). Evita lookbehind no regex (suporte incerto no
 * Hermes) checando os caracteres vizinhos manualmente.
 */
function isIsolatedNumber(text: string, match: RegExpExecArray): boolean {
  const isDigitOrDot = (char: string | undefined) => char !== undefined && /[\d.]/.test(char);
  const before = text[match.index - 1];
  const after = text[match.index + match[0].length];
  return !isDigitOrDot(before) && !isDigitOrDot(after);
}

function matchIsolatedPrice(text: string): RegExpExecArray | null {
  const match = PRICE_PATTERN.exec(text);
  return match && isIsolatedNumber(text, match) ? match : null;
}

function findPriceCandidates(blocks: OcrBlock[]): PriceCandidate[] {
  const candidates: PriceCandidate[] = [];

  for (const block of blocks) {
    const match = matchIsolatedPrice(block.text);
    if (match) {
      candidates.push({ cents: parsePriceMatchToCents(match[1]), height: block.boundingBoxHeight });
    }
  }

  // Preço quebrado em linhas separadas: só conta quando nenhuma das duas
  // linhas isoladas já formava um preço válido por conta própria.
  for (let i = 0; i < blocks.length - 1; i += 1) {
    const first = blocks[i];
    const second = blocks[i + 1];
    if (matchIsolatedPrice(first.text) || matchIsolatedPrice(second.text)) {
      continue;
    }
    const combinedMatch = matchIsolatedPrice(first.text + second.text);
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

/** Palavras comuns em etiquetas que nunca são o nome do produto (RF-20). */
const NOISE_WORDS = [
  'OFERTA',
  'PROMOÇÃO',
  'PROMOCAO',
  'VALIDADE',
  'CÓD',
  'COD',
  'EAN',
  'À VISTA',
  'A VISTA',
  'LEVE',
  'PAGUE',
];

function countLetters(text: string): number {
  return (text.match(/[a-zA-ZÀ-ÿ]/g) ?? []).length;
}

function countDigits(text: string): number {
  return (text.match(/\d/g) ?? []).length;
}

function isNoiseLine(text: string): boolean {
  const upper = text.toUpperCase();
  return NOISE_WORDS.some((word) => upper.includes(word));
}

/** Código de barras, CNPJ etc.: mais dígito do que letra. */
function isCodeLine(text: string): boolean {
  return countDigits(text) > countLetters(text);
}

function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

/** RF-20: a linha alfabética mais longa que não seja preço, código nem ruído. */
function selectProductName(blocks: OcrBlock[]): string | null {
  const candidates = blocks
    .map((block) => block.text)
    .filter(
      (text) =>
        countLetters(text) > 0 &&
        !matchIsolatedPrice(text) &&
        !isCodeLine(text) &&
        !isNoiseLine(text),
    );

  if (candidates.length === 0) {
    return null;
  }

  const longest = candidates.reduce((best, current) =>
    countLetters(current) > countLetters(best) ? current : best,
  );

  return toTitleCase(longest);
}

/**
 * RF-22: kg só quando há indicação de peso variável — preço com sufixo
 * "/kg" (ex.: "R$ 39,90/kg") ou uma quantidade decimal antes de "kg" (ex.:
 * "0,850 KG", típico de balança). Um "kg" colado a um número inteiro (ex.:
 * "Arroz 5kg") é só o tamanho da embalagem, vendida inteira — fica "un".
 */
function detectUnit(blocks: OcrBlock[]): Unit {
  const hasKg = blocks.some((block) => /\d,\d+\s?kg|\/\s?kg/i.test(block.text));
  return hasKg ? 'kg' : 'un';
}

export function parseLabel(blocks: OcrBlock[]): ParsedLabel {
  const priceCents = selectBestPrice(blocks);
  const name = selectProductName(blocks);

  return {
    name,
    priceCents,
    unit: detectUnit(blocks),
    // RF-25: só é falha quando nem preço nem nome sobraram. Extração
    // parcial (só um dos dois) é sucesso normal, ver RF-24 e spec §3.
    confident: priceCents !== null || name !== null,
  };
}
