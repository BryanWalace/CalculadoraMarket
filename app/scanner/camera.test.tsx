import { fireEvent, render } from '@testing-library/react-native';

import CameraScreen from './camera';

const mockRequestPermission = jest.fn();
const mockPush = jest.fn();
const mockScanLabel = jest.fn();
let mockPermission: { granted: boolean; canAskAgain: boolean } | null = null;

jest.mock('expo-camera', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  function MockCameraView(props: object, ref: unknown) {
    return React.createElement(View, { ...props, ref });
  }
  MockCameraView.displayName = 'MockCameraView';
  return {
    useCameraPermissions: () => [mockPermission, mockRequestPermission],
    CameraView: React.forwardRef(MockCameraView),
  };
});

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

jest.mock('../../src/features/scanner/scanLabel', () => {
  const actual = jest.requireActual('../../src/features/scanner/scanLabel');
  return {
    ...actual,
    scanLabel: (...args: unknown[]) => mockScanLabel(...args),
  };
});

beforeEach(() => {
  mockRequestPermission.mockClear();
  mockPush.mockClear();
  mockScanLabel.mockReset();
  mockPermission = null;
});

describe('CameraScreen', () => {
  it('mostra a explicação e o botão de permitir quando ainda não foi concedida (RF-12)', async () => {
    mockPermission = { granted: false, canAskAgain: true };

    const { getByText, getByLabelText } = await render(<CameraScreen />);

    expect(getByText('Precisamos da câmera')).toBeTruthy();
    expect(getByLabelText('Permitir câmera')).toBeTruthy();
  });

  it('pede a permissão só quando o usuário toca no botão, nunca automaticamente', async () => {
    mockPermission = { granted: false, canAskAgain: true };

    await render(<CameraScreen />);

    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('chama requestPermission ao tocar em "Permitir câmera"', async () => {
    mockPermission = { granted: false, canAskAgain: true };

    const { getByLabelText } = await render(<CameraScreen />);
    await fireEvent.press(getByLabelText('Permitir câmera'));

    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('mostra a câmera com a moldura de enquadramento quando a permissão já foi concedida (RF-14)', async () => {
    mockPermission = { granted: true, canAskAgain: true };

    const { getByText, getByLabelText, queryByText } = await render(<CameraScreen />);

    expect(getByText('Posicione o preço dentro da moldura')).toBeTruthy();
    expect(getByLabelText('Moldura de enquadramento do preço')).toBeTruthy();
    expect(queryByText('Precisamos da câmera')).toBeNull();
  });

  it('permissão negada de vez oferece entrada manual sem travar o app (RF-13)', async () => {
    mockPermission = { granted: false, canAskAgain: false };

    const { getByText, getByLabelText, queryByLabelText } = await render(<CameraScreen />);

    expect(getByText('Câmera indisponível')).toBeTruthy();
    expect(queryByLabelText('Permitir câmera')).toBeNull();

    await fireEvent.press(getByLabelText('Adicionar manualmente'));

    expect(mockPush).toHaveBeenCalledWith('/scanner/confirm');
  });

  it('oferece entrada manual mesmo antes de decidir sobre a permissão', async () => {
    mockPermission = { granted: false, canAskAgain: true };

    const { getByLabelText } = await render(<CameraScreen />);
    await fireEvent.press(getByLabelText('Adicionar manualmente'));

    expect(mockPush).toHaveBeenCalledWith('/scanner/confirm');
  });

  it('o botão de fotografar fica desabilitado até a moldura ser medida', async () => {
    mockPermission = { granted: true, canAskAgain: true };

    const { getByLabelText } = await render(<CameraScreen />);

    expect(getByLabelText('Fotografar etiqueta').props.accessibilityState.disabled).toBe(true);
  });

  it('fotografar escaneia e navega para a confirmação com photoUri, nome, preço e unidade (RF-15, RF-23)', async () => {
    mockPermission = { granted: true, canAskAgain: true };
    mockScanLabel.mockResolvedValue({
      photoUri: 'file:///document/etiqueta-123.jpg',
      parsed: { name: 'Arroz Tipo 1', priceCents: 2290, unit: 'un', confident: true },
    });

    const { getByLabelText } = await render(<CameraScreen />);

    await fireEvent(getByLabelText('Moldura de enquadramento do preço'), 'layout', {
      nativeEvent: { layout: { x: 40, y: 300, width: 320, height: 120 } },
    });
    await fireEvent.press(getByLabelText('Fotografar etiqueta'));

    expect(mockScanLabel).toHaveBeenCalledWith(
      expect.anything(),
      { x: 40, y: 300, width: 320, height: 120 },
      expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) }),
    );
    const pushedUrl = mockPush.mock.calls[0][0] as string;
    expect(pushedUrl).toContain('photoUri=file%3A%2F%2F%2Fdocument%2Fetiqueta-123.jpg');
    expect(pushedUrl).toContain('name=Arroz%20Tipo%201');
    expect(pushedUrl).toContain('priceCents=2290');
    expect(pushedUrl).toContain('unit=un');
  });

  it('mostra um aviso amigável se a captura/OCR falhar, sem derrubar o app', async () => {
    mockPermission = { granted: true, canAskAgain: true };
    mockScanLabel.mockRejectedValue(new Error('falha nativa qualquer'));
    const { Alert } = jest.requireActual('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByLabelText } = await render(<CameraScreen />);
    await fireEvent(getByLabelText('Moldura de enquadramento do preço'), 'layout', {
      nativeEvent: { layout: { x: 40, y: 300, width: 320, height: 120 } },
    });
    await fireEvent.press(getByLabelText('Fotografar etiqueta'));

    expect(alertSpy).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
