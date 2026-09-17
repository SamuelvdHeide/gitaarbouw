import { createValueNoise } from './noise.js';
import { gradientAt } from './color.js';

const PATTERNS = Object.freeze({
  tortoise: {
    stops: [[0, '#140806'], [0.35, '#3B1206'], [0.55, '#7A2A0E'], [0.72, '#B0561C'], [1, '#D08A3A']],
    scale: 0.55,
    contrast: 2.1,
  },
  pearl: {
    stops: [[0, '#D9D4C7'], [0.4, '#EEEAE0'], [0.6, '#F7F4EC'], [0.8, '#E9E6EE'], [1, '#FFFFFF']],
    scale: 1.3,
    contrast: 1.4,
  },
});

/** Celluloid-patronen voor slagplaten (schildpad, parelmoer). */
export function renderPlasticPixels(pattern, { width, height, pxPerCm, seed = 3 }) {
  const definition = PATTERNS[pattern];
  if (!definition) throw new Error(`Onbekend slagplaatpatroon: ${pattern}`);
  const { fbm } = createValueNoise(seed);
  const pixels = new Uint8ClampedArray(width * height * 4);

  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      const u = (px / pxPerCm) * definition.scale;
      const v = (py / pxPerCm) * definition.scale;
      const warped = fbm(u + fbm(u * 0.5, v * 0.5, 2) * 2, v * 0.8, 4);
      const t = Math.min(1, Math.max(0, (warped - 0.5) * definition.contrast + 0.5));
      const [r, g, b] = gradientAt(definition.stops, t);
      const index = (py * width + px) * 4;
      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = 255;
    }
  }
  return pixels;
}
