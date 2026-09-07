import type { CameraView } from 'expo-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';

import { adaptMlKitResult, scanLabel } from './scanLabel';
import { captureAndCropPhoto } from './capturePhoto';

jest.mock('@react-native-ml-kit/text-recognition', () => ({
  __esModule: true,
  default: { recognize: jest.fn() },
  TextRecognitionScript: { LATIN: 'Latin' },
}));

jest.mock('./capturePhoto', () => ({
  captureAndCropPhoto: jest.fn(),
}));

describe('adaptMlKitResult', () => {
  it('achata os blocos do ML Kit em uma lista de linhas com altura', () => {
    const result = adaptMlKitResult({
      text: 'ignorado',
      blocks: [
        {
          text: 'ignorado',
          lines: [
            {
              text: 'Arroz Tipo 1',
              frame: { width: 100, height: 24, top: 0, left: 0 },
              elements: [],
              recognizedLanguages: [],
            },
          ],
          recognizedLanguages: [],
        },
        {
          text: 'ignorado',
          lines: [
            {
              text: 'R$ 22,90',
              frame: { width: 80, height: 48, top: 30, left: 0 },
              elements: [],
              recognizedLanguages: [],
            },
          ],
          recognizedLanguages: [],
        },
      ],
    });

    expect(result).toEqual([
      { text: 'Arroz Tipo 1', boundingBoxHeight: 24 },
      { text: 'R$ 22,90', boundingBoxHeight: 48 },
    ]);
  });

  it('usa altura 0 quando a linha não tem frame', () => {
    const result = adaptMlKitResult({
      text: 'x',
      blocks: [
        {
          text: 'x',
          lines: [{ text: 'Sem frame', elements: [], recognizedLanguages: [] }],
          recognizedLanguages: [],
        },
      ],
    });

    expect(result).toEqual([{ text: 'Sem frame', boundingBoxHeight: 0 }]);
  });
});

describe('scanLabel', () => {
  it('captura, recorta, roda o OCR e devolve a etiqueta interpretada', async () => {
    (captureAndCropPhoto as jest.Mock).mockResolvedValue('file:///document/etiqueta-1.jpg');
    (TextRecognition.recognize as jest.Mock).mockResolvedValue({
      text: 'ignorado',
      blocks: [
        {
          text: 'ignorado',
          lines: [
            {
              text: 'Arroz Tipo 1',
              frame: { width: 100, height: 24, top: 0, left: 0 },
              elements: [],
              recognizedLanguages: [],
            },
            {
              text: 'R$ 22,90',
              frame: { width: 80, height: 48, top: 30, left: 0 },
              elements: [],
              recognizedLanguages: [],
            },
          ],
          recognizedLanguages: [],
        },
      ],
    });
    const cameraRef = {} as React.RefObject<CameraView | null>;
    const frame = { x: 0, y: 0, width: 100, height: 100 };
    const screen = { width: 100, height: 100 };

    const result = await scanLabel(cameraRef, frame, screen);

    expect(captureAndCropPhoto).toHaveBeenCalledWith(cameraRef, frame, screen);
    expect(TextRecognition.recognize).toHaveBeenCalledWith('file:///document/etiqueta-1.jpg');
    expect(result.photoUri).toBe('file:///document/etiqueta-1.jpg');
    expect(result.parsed).toMatchObject({
      name: 'Arroz Tipo 1',
      priceCents: 2290,
      confident: true,
    });
  });
});
