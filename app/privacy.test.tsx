import { render } from '@testing-library/react-native';

import PrivacyScreen from './privacy';

describe('PrivacyScreen', () => {
  it('explica, em linguagem simples, que nenhum dado sai do aparelho (RF-53)', async () => {
    const { getByText } = await render(<PrivacyScreen />);

    expect(getByText('Privacidade')).toBeTruthy();
    expect(getByText('Nenhum dado sai do aparelho')).toBeTruthy();
    expect(getByText(/O Carrinho funciona 100% offline/)).toBeTruthy();
  });

  it('explica as permissões e o destino das fotos', async () => {
    const { getByText } = await render(<PrivacyScreen />);

    expect(getByText('Só a permissão de câmera')).toBeTruthy();
    expect(getByText('Fotos ficam guardadas só no app')).toBeTruthy();
  });
});
