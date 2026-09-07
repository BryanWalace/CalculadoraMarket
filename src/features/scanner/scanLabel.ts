import type { CameraView } from 'expo-camera';
import TextRecognition, { type TextRecognitionResult } from '@react-native-ml-kit/text-recognition';

import { parseLabel, type OcrBlock, type ParsedLabel } from '../../lib/ocr-parser';
import type { FrameBounds, Size } from '../../lib/cropRegion';
import { captureAndCropPhoto } from './capturePhoto';

/**
 * Converte o retorno do ML Kit para o tipo simples que src/lib/ocr-parser
 * entende. O parser nunca importa o ML Kit diretamente — mantém a lógica de
 * decisão testável sem o módulo nativo (docs/plan.md ADR-03).
 */
export function adaptMlKitResult(result: TextRecognitionResult): OcrBlock[] {
  return result.blocks.flatMap((block) =>
    block.lines.map((line) => ({
      text: line.text,
      boundingBoxHeight: line.frame?.height ?? 0,
    })),
  );
}

export interface ScanResult {
  photoUri: string;
  parsed: ParsedLabel;
}

/** Orquestra câmera → recorte (T-29/30) → OCR (ML Kit) → parser (T-31–35). */
export async function scanLabel(
  cameraRef: React.RefObject<CameraView | null>,
  frame: FrameBounds,
  screen: Size,
): Promise<ScanResult> {
  const photoUri = await captureAndCropPhoto(cameraRef, frame, screen);
  const result = await TextRecognition.recognize(photoUri);
  const blocks = adaptMlKitResult(result);

  return { photoUri, parsed: parseLabel(blocks) };
}

/**
 * Monta a query string de navegação para a tela de confirmação a partir do
 * resultado do escaneamento — só inclui os campos que o OCR realmente
 * reconheceu (RF-23/24); o que faltar, a tela de confirmação deixa em
 * branco para preenchimento manual.
 */
export function buildConfirmRouteQuery(scanResult: ScanResult): string {
  const { photoUri, parsed } = scanResult;
  const params: Record<string, string> = { photoUri };

  if (parsed.name !== null) {
    params.name = parsed.name;
  }
  if (parsed.priceCents !== null) {
    params.priceCents = String(parsed.priceCents);
  }
  params.unit = parsed.unit;
  if (!parsed.confident) {
    params.lowConfidence = '1';
  }

  return Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
}
