import { describe, expect, it } from 'vitest';
import { createValueNoise, mulberry32 } from './noise.js';
import { createGradientLut, gradientAt, hexToRgb, luminance, mixRgb } from './color.js';
import { renderWoodPixels } from './woodPixels.js';
import { composeFinish } from './finishPixels.js';
import { renderPlasticPixels } from './plasticPixels.js';
import { WOODS } from '../data/woods.js';
import { BURSTS } from '../data/finishes.js';

const SIZE = { width: 16, height: 16, pxPerCm: 4 };

function average(pixels) {
  let r = 0;
  let g = 0;
  let b = 0;
  const count = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    r += pixels[i];
    g += pixels[i + 1];
    b += pixels[i + 2];
  }
  return [r / count, g / count, b / count];
}

describe('noise', () => {
  it('is deterministisch per seed', () => {
    expect(mulberry32(5)()).toBe(mulberry32(5)());
    const a = createValueNoise(9);
    const b = createValueNoise(9);
    expect(a.noise(1.3, 2.7)).toBe(b.noise(1.3, 2.7));
  });

  it('blijft binnen 0..1', () => {
    const { noise, fbm } = createValueNoise(2);
    for (let i = 0; i < 200; i += 1) {
      const value = noise(i * 0.37 - 20, i * 0.11);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
      expect(fbm(i * 0.2, -i * 0.3)).toBeLessThanOrEqual(1);
    }
  });
});

describe('color', () => {
  it('zet hex om en weigert onzin', () => {
    expect(hexToRgb('#FF8000')).toEqual([255, 128, 0]);
    expect(() => hexToRgb('oranje')).toThrow();
  });

  it('berekent luminantie en mengsels', () => {
    expect(luminance([255, 255, 255])).toBeCloseTo(1);
    expect(mixRgb([0, 0, 0], [100, 200, 50], 0.5)).toEqual([50, 100, 25]);
  });

  it('interpoleert verlopen', () => {
    const stops = [[0, '#000000'], [1, '#FFFFFF']];
    expect(gradientAt(stops, -1)).toEqual([0, 0, 0]);
    expect(gradientAt(stops, 0.5)).toEqual([127.5, 127.5, 127.5]);
    expect(gradientAt(stops, 2)).toEqual([255, 255, 255]);
    expect(createGradientLut(stops, 3)[3]).toBeCloseTo(127.5);
  });
});

describe('renderWoodPixels', () => {
  it('maakt ondoorzichtige pixels in de houtkleur', () => {
    const pixels = renderWoodPixels(WOODS.alder, SIZE);
    expect(pixels).toHaveLength(16 * 16 * 4);
    expect(pixels[3]).toBe(255);
    const [r, , b] = average(pixels);
    expect(r).toBeGreaterThan(b);
  });

  it('ondersteunt gevlamd en gewolkt figuur', () => {
    expect(renderWoodPixels(WOODS['flamed-maple'], SIZE)).toHaveLength(1024);
    expect(renderWoodPixels(WOODS['quilted-maple'], SIZE)).toHaveLength(1024);
  });

  it('weigert ongeldige maten', () => {
    expect(() => renderWoodPixels(WOODS.alder, { width: 0, height: 4, pxPerCm: 1 })).toThrow();
  });
});

describe('composeFinish', () => {
  const wood = renderWoodPixels(WOODS.ash, SIZE);
  const base = { width: 16, height: 16, woodLight: WOODS.ash.light };

  it('laat het hout ongemoeid', () => {
    const copy = Uint8ClampedArray.from(wood);
    composeFinish(wood, { ...base, finishType: 'natural' });
    expect(wood).toEqual(copy);
  });

  it('laat puur hout exact gelijk aan de nerf', () => {
    const raw = composeFinish(wood, { ...base, finishType: 'raw' });
    expect(raw).toEqual(wood);
    expect(raw).not.toBe(wood);
  });

  it('maakt dekkende kleur egaal', () => {
    const solid = composeFinish(wood, { ...base, finishType: 'solid', colorHex: '#102030' });
    expect(Array.from(solid.slice(0, 4))).toEqual([16, 32, 48, 255]);
    expect(average(solid)).toEqual([16, 32, 48]);
  });

  it('tint transparant maar houdt de nerf zichtbaar', () => {
    const tinted = composeFinish(wood, { ...base, finishType: 'transparent', colorHex: '#2F5FA8' });
    const [r, , b] = average(tinted);
    expect(b).toBeGreaterThan(r);
    const reds = new Set();
    for (let i = 0; i < tinted.length; i += 4) reds.add(tinted[i]);
    expect(reds.size).toBeGreaterThan(3);
  });

  it('maakt een sunburst van donkere rand naar lichte kern', () => {
    const burst = BURSTS.find((item) => item.id === 'three-tone');
    const result = composeFinish(wood, {
      ...base,
      finishType: 'burst',
      burstStops: burst.stops,
      burstPosition: (px) => px / 15,
    });
    const edge = result[0] + result[1] + result[2];
    const center = result[15 * 4] + result[15 * 4 + 1] + result[15 * 4 + 2];
    expect(center).toBeGreaterThan(edge);
  });

  it('meldt ontbrekende invoer', () => {
    expect(() => composeFinish(wood, { ...base, finishType: 'solid' })).toThrow();
    expect(() => composeFinish(wood, { ...base, finishType: 'burst', burstStops: BURSTS[0].stops })).toThrow();
    expect(() => composeFinish(wood, { ...base, finishType: 'glitter' })).toThrow();
  });
});

describe('renderPlasticPixels', () => {
  it('maakt schildpad donkerder dan parelmoer', () => {
    const tortoise = average(renderPlasticPixels('tortoise', SIZE));
    const pearl = average(renderPlasticPixels('pearl', SIZE));
    expect(tortoise[0] + tortoise[1]).toBeLessThan(pearl[0] + pearl[1]);
    expect(() => renderPlasticPixels('marmer', SIZE)).toThrow();
  });
});
