import { renderHook } from '@testing-library/react-native';

import { useAppColors } from './theme';

const useColorScheme = jest.requireMock('react-native/Libraries/Utilities/useColorScheme')
  .default as jest.Mock;

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(),
}));

describe('useAppColors', () => {
  it('usa a paleta clara quando o esquema é light', async () => {
    useColorScheme.mockReturnValue('light');

    const { result } = await renderHook(() => useAppColors());

    expect(result.current.background).toBe('#ffffff');
    expect(result.current.text).toBe('#111827');
  });

  it('usa a paleta escura quando o esquema é dark', async () => {
    useColorScheme.mockReturnValue('dark');

    const { result } = await renderHook(() => useAppColors());

    expect(result.current.background).toBe('#0b1120');
    expect(result.current.text).toBe('#f3f4f6');
  });

  it('usa a paleta clara quando o esquema é nulo (indisponível)', async () => {
    useColorScheme.mockReturnValue(null);

    const { result } = await renderHook(() => useAppColors());

    expect(result.current.background).toBe('#ffffff');
  });
});
