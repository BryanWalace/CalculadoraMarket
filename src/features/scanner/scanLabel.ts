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
