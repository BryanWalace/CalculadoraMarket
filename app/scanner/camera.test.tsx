import { fireEvent, render } from '@testing-library/react-native';

import CameraScreen from './camera';

const mockRequestPermission = jest.fn();
const mockPush = jest.fn();
let mockPermission: { granted: boolean; canAskAgain: boolean } | null = null;

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [mockPermission, mockRequestPermission],
  CameraView: jest.requireActual('react-native').View,
}));

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

beforeEach(() => {
  mockRequestPermission.mockClear();
  mockPush.mockClear();
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
});
