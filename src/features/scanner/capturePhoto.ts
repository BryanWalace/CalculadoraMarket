import type { CameraView } from 'expo-camera';
import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { calculateCropRegion, type FrameBounds, type Size } from '../../lib/cropRegion';

/**
 * Fotografa, recorta para a área da moldura (RF-15, calculada só depois da
 * captura — é quando sabemos a resolução real da foto) e move o resultado
 * do diretório de cache (onde o manipulador salva por padrão) para o
 * diretório privado e persistente do app (RF-55) — nunca a galeria pública.
 */
export async function captureAndCropPhoto(
  cameraRef: React.RefObject<CameraView | null>,
  frame: FrameBounds,
  screen: Size,
): Promise<string> {
  const photo = await cameraRef.current?.takePictureAsync();
  if (!photo) {
    throw new Error('Não foi possível capturar a foto');
  }

  const cropRegion = calculateCropRegion(frame, screen, {
    width: photo.width,
    height: photo.height,
  });

  const manipulated = await ImageManipulator.manipulate(photo.uri).crop(cropRegion).renderAsync();
  const cached = await manipulated.saveAsync({ format: SaveFormat.JPEG });

  const destination = new File(Paths.document, `etiqueta-${Date.now()}.jpg`);
  const cachedFile = new File(cached.uri);
  await cachedFile.move(destination);

  return destination.uri;
}
