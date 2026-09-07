import { render } from '@testing-library/react-native';

import CartScreen from './index';

describe('CartScreen', () => {
  it('renderiza sem falhar', async () => {
    const { getByText } = await render(<CartScreen />);

    expect(getByText('Carrinho')).toBeTruthy();
  });
});
