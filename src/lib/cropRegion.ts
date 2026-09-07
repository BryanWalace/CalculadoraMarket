export interface FrameBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CropRegion {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/**
 * Converte a moldura de enquadramento (medida em coordenadas de tela) para
 * a região equivalente em pixels da foto capturada, assumindo que a prévia
 * da câmera preenche a tela inteira (RF-15). Resultado sempre em inteiros —
 * a API nativa de recorte não aceita fração de pixel.
 */
export function calculateCropRegion(frame: FrameBounds, screen: Size, photo: Size): CropRegion {
  const scaleX = photo.width / screen.width;
  const scaleY = photo.height / screen.height;

  return {
    originX: Math.round(frame.x * scaleX),
    originY: Math.round(frame.y * scaleY),
    width: Math.round(frame.width * scaleX),
    height: Math.round(frame.height * scaleY),
  };
}
