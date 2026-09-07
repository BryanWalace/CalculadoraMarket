import type { CameraView } from 'expo-camera';
import { File } from 'expo-file-system';
import { ImageManipulator } from 'expo-image-manipulator';

import { captureAndCropPhoto } from './capturePhoto';

const mockTakePictureAsync = jest.fn();
const mockRenderAsync = jest.fn();
const mockCrop = jest.fn();
const mockMove = jest.fn();

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
  Paths: { document: 'file:///document/' },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCrop.mockReturnValue({ renderAsync: mockRenderAsync });
  (ImageManipulator.manipulate as jest.Mock).mockReturnValue({ crop: mockCrop });
  mockRenderAsync.mockResolvedValue({
    saveAsync: jest.fn().mockResolvedValue({ uri: 'file:///cache/temp.jpg' }),
  });
  (File as unknown as jest.Mock).mockImplementation((...segments: string[]) => ({
    uri: segments.join(''),
    move: mockMove,
  }));
});

function makeCameraRef(picture: { uri: string; width: number; height: number } | undefined) {
  mockTakePictureAsync.mockResolvedValue(picture);
  return {
    current: { takePictureAsync: mockTakePictureAsync },
  } as unknown as React.RefObject<CameraView | null>;
}

describe('captureAndCropPhoto', () => {
  it('captura, calcula o recorte pela resolução real da foto e move para o diretório privado (RF-15, RF-55)', async () => {
    const cameraRef = makeCameraRef({ uri: 'file:///tmp/original.jpg', width: 800, height: 1600 });
    const frame = { x: 40, y: 300, width: 320, height: 120 };
    const screen = { width: 400, height: 800 };

    const finalUri = await captureAndCropPhoto(cameraRef, frame, screen);

    expect(mockTakePictureAsync).toHaveBeenCalled();
    expect(ImageManipulator.manipulate).toHaveBeenCalledWith('file:///tmp/original.jpg');
    // 800/400 = escala 2x: a região da moldura dobra de tamanho na foto.
    expect(mockCrop).toHaveBeenCalledWith({
      originX: 80,
      originY: 600,
      width: 640,
      height: 240,
    });
    expect(mockMove).toHaveBeenCalled();
    expect(finalUri).toMatch(/^file:\/\/\/document\/etiqueta-\d+\.jpg$/);
  });

  it('lança erro claro se a câmera não retornar uma foto', async () => {
    const cameraRef = makeCameraRef(undefined);

    await expect(
      captureAndCropPhoto(
        cameraRef,
        { x: 0, y: 0, width: 10, height: 10 },
        {
          width: 100,
          height: 100,
        },
      ),
    ).rejects.toThrow('Não foi possível capturar a foto');
  });
});
