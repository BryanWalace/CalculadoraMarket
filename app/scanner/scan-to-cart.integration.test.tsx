import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { createInMemoryDatabase } from '../../src/db/inMemoryTestDatabase';
import { useCartStore } from '../../src/features/cart/store';
import CartScreen from '../index';
import CameraScreen from './camera';
import ConfirmationScreen from './confirm';

/**
 * Teste de integração ponta a ponta (T-41): simula uma etiqueta fotografada
 * (scanLabel mockado, já que câmera e ML Kit são nativos e não rodam no
 * Jest), passa pela tela de confirmação de verdade com os dados
 * pré-preenchidos, confirma, e verifica o total na CartScreen de verdade —
 * as três telas ligadas pela mesma store e o mesmo banco fake.
 */
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRequestPermission = jest.fn();
const mockScanLabel = jest.fn();
let mockPermission: { granted: boolean; canAskAgain: boolean } | null = {
  granted: true,
  canAskAgain: true,
};
let mockSearchParams: Record<string, string> = {};
let mockDb: ReturnType<typeof createInMemoryDatabase>;

function parseQueryString(url: string): Record<string, string> {
  const [, query] = url.split('?');
  const params: Record<string, string> = {};
  for (const pair of (query ?? '').split('&')) {
    if (!pair) continue;
    const [key, value] = pair.split('=');
    params[key] = decodeURIComponent(value);
  }
  return params;
}

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
  router: { push: (...args: unknown[]) => mockPush(...args), back: () => mockBack() },
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('expo-sqlite', () => ({
  useSQLiteContext: () => mockDb,
}));

jest.mock('../../src/features/scanner/scanLabel', () => ({
  scanLabel: (...args: unknown[]) => mockScanLabel(...args),
  buildConfirmRouteQuery: jest.requireActual('../../src/features/scanner/scanLabel')
    .buildConfirmRouteQuery,
}));

beforeEach(() => {
  mockPush.mockClear();
  mockBack.mockClear();
  mockScanLabel.mockReset();
  mockSearchParams = {};
  mockDb = createInMemoryDatabase();
  useCartStore.setState({ activeList: null, items: [], isHydrated: false });
});

describe('fluxo completo: foto → confirmação pré-preenchida → total no carrinho', () => {
  it('etiqueta reconhecida com sucesso soma corretamente ao total (RF-23)', async () => {
    mockScanLabel.mockResolvedValue({
      photoUri: 'file:///document/etiqueta-1.jpg',
      parsed: { name: 'Alcatra Bovina', priceCents: 3990, unit: 'kg', confident: true },
    });
    await useCartStore.getState().hydrate(mockDb);

    const cameraScreen = await render(<CameraScreen />);
    await fireEvent(cameraScreen.getByLabelText('Moldura de enquadramento do preço'), 'layout', {
      nativeEvent: { layout: { x: 40, y: 300, width: 320, height: 120 } },
    });
    await fireEvent.press(cameraScreen.getByLabelText('Fotografar etiqueta'));

    expect(mockPush).toHaveBeenCalled();
    mockSearchParams = parseQueryString(mockPush.mock.calls[0][0] as string);

    const confirmScreen = await render(<ConfirmationScreen />);
    expect(confirmScreen.getByLabelText('Nome do produto').props.value).toBe('Alcatra Bovina');
    expect(confirmScreen.getByLabelText('Preço unitário').props.value).toBe('R$ 39,90');

    await fireEvent.changeText(confirmScreen.getByLabelText('Quantidade'), '0,750');
    await fireEvent.press(confirmScreen.getByLabelText('Adicionar'));

    expect(mockBack).toHaveBeenCalled();

    const cartScreen = await render(<CartScreen />);
    await waitFor(() => expect(cartScreen.getByText('Alcatra Bovina')).toBeTruthy());
    // 3990 * 0,750 = 2992,5 -> arredonda para 2993 (ADR-02)
    expect(cartScreen.getByLabelText('Total geral').props.children).toBe('R$ 29,93');
  });

  it('etiqueta ilegível abre a confirmação em branco com aviso, e o usuário ainda consegue adicionar (RF-25)', async () => {
    mockScanLabel.mockResolvedValue({
      photoUri: 'file:///document/etiqueta-2.jpg',
      parsed: { name: null, priceCents: null, unit: 'un', confident: false },
    });
    await useCartStore.getState().hydrate(mockDb);

    const cameraScreen = await render(<CameraScreen />);
    await fireEvent(cameraScreen.getByLabelText('Moldura de enquadramento do preço'), 'layout', {
      nativeEvent: { layout: { x: 40, y: 300, width: 320, height: 120 } },
    });
    await fireEvent.press(cameraScreen.getByLabelText('Fotografar etiqueta'));

    mockSearchParams = parseQueryString(mockPush.mock.calls[0][0] as string);

    const confirmScreen = await render(<ConfirmationScreen />);
    expect(
      confirmScreen.getByText('Não consegui ler a etiqueta, preencha manualmente'),
    ).toBeTruthy();

    await fireEvent.changeText(confirmScreen.getByLabelText('Nome do produto'), 'Item Avulso');
    await fireEvent.changeText(confirmScreen.getByLabelText('Preço unitário'), '1000');
    await fireEvent.press(confirmScreen.getByLabelText('Adicionar'));

    const cartScreen = await render(<CartScreen />);
    await waitFor(() => expect(cartScreen.getByText('Item Avulso')).toBeTruthy());
    expect(cartScreen.getByLabelText('Total geral').props.children).toBe('R$ 10,00');
  });
});
