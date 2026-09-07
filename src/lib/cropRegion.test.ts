import { calculateCropRegion } from './cropRegion';

describe('calculateCropRegion', () => {
  it('converte a moldura da tela para pixels da foto quando a proporção é a mesma', () => {
    const region = calculateCropRegion(
      { x: 40, y: 300, width: 320, height: 120 },
      { width: 400, height: 800 },
      { width: 800, height: 1600 },
    );

    expect(region).toEqual({ originX: 80, originY: 600, width: 640, height: 240 });
  });

  it('escala proporcionalmente quando a foto tem resolução diferente da tela', () => {
    const region = calculateCropRegion(
      { x: 0, y: 0, width: 100, height: 100 },
      { width: 100, height: 100 },
      { width: 300, height: 300 },
    );

    expect(region).toEqual({ originX: 0, originY: 0, width: 300, height: 300 });
  });

  it('arredonda o resultado para inteiros (a API de crop não aceita fração de pixel)', () => {
    const region = calculateCropRegion(
      { x: 10, y: 10, width: 33, height: 33 },
      { width: 100, height: 100 },
      { width: 97, height: 97 },
    );

    expect(Number.isInteger(region.originX)).toBe(true);
    expect(Number.isInteger(region.originY)).toBe(true);
    expect(Number.isInteger(region.width)).toBe(true);
    expect(Number.isInteger(region.height)).toBe(true);
  });
});
