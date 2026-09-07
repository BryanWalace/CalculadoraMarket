import { fireEvent, render } from '@testing-library/react-native';

import CameraScreen from './camera';

const mockRequestPermission = jest.fn();
let mockPermission: { granted: boolean; canAskAgain: boolean } | null = null;

jest.mock('expo-camera', () => ({
  useCameraPermissions: () => [mockPermission, mockRequestPermission],
}));

beforeEach(() => {
  mockRequestPermission.mockClear();
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

  it('mostra a câmera quando a permissão já foi concedida', async () => {
    mockPermission = { granted: true, canAskAgain: true };

    const { getByText, queryByText } = await render(<CameraScreen />);

    expect(getByText('Câmera')).toBeTruthy();
    expect(queryByText('Precisamos da câmera')).toBeNull();
  });
});
