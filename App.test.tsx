import { render } from '@testing-library/react-native';

import App from './App';

describe('App', () => {
  it('renderiza sem falhar', async () => {
    const { getByText } = await render(<App />);

    expect(getByText('Carrinho')).toBeTruthy();
  });
});
