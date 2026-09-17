import { createGradientLut, hexToRgb, luminance } from './color.js';

// Heldere lak verdiept de kleur heel licht, zonder gele zweem.
const NATURAL_LACQUER = [0.97, 0.955, 0.93];

function pixelLuminance(pixels, index) {
  return (0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]) / 255;
}

function tintedChannel(tint, relative, base, gain) {
  return tint * (base + gain * relative);
}

/**
 * Legt een lak over houtpixels en geeft nieuwe pixels terug.
 * @param {Uint8ClampedArray} woodPixels bron (wordt niet gewijzigd)
 * @param {object} options
 * @param {'raw'|'natural'|'transparent'|'solid'|'burst'} options.finishType
 * @param {string} [options.colorHex] voor transparant en dekkend
 * @param {Array} [options.burstStops] voor sunburst
 * @param {(px: number, py: number) => number} [options.burstPosition] 0 = rand, 1 = midden
 * @param {number[]} options.woodLight lichtste houtkleur, voor relatieve helderheid
 */
export function composeFinish(woodPixels, { width, height, finishType, colorHex, burstStops, burstPosition, woodLight }) {
  const out = new Uint8ClampedArray(woodPixels.length);
  const referenceLuminance = Math.max(0.05, luminance(woodLight));
  const color = colorHex ? hexToRgb(colorHex) : null;
  const lut = finishType === 'burst' ? createGradientLut(burstStops) : null;

  if ((finishType === 'transparent' || finishType === 'solid') && !color) {
    throw new Error(`Afwerking ${finishType} vraagt om een kleur`);
  }
  if (finishType === 'burst' && typeof burstPosition !== 'function') {
    throw new Error('Sunburst vraagt om een burstPosition-functie');
  }

  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      const i = (py * width + px) * 4;
      const relative = Math.min(1.25, pixelLuminance(woodPixels, i) / referenceLuminance);
      out[i + 3] = 255;

      if (finishType === 'raw') {
        out[i] = woodPixels[i];
        out[i + 1] = woodPixels[i + 1];
        out[i + 2] = woodPixels[i + 2];
      } else if (finishType === 'natural') {
        out[i] = woodPixels[i] * NATURAL_LACQUER[0];
        out[i + 1] = woodPixels[i + 1] * NATURAL_LACQUER[1];
        out[i + 2] = woodPixels[i + 2] * NATURAL_LACQUER[2];
      } else if (finishType === 'solid') {
        out[i] = color[0];
        out[i + 1] = color[1];
        out[i + 2] = color[2];
      } else if (finishType === 'transparent') {
        out[i] = tintedChannel(color[0], relative, 0.28, 0.82);
        out[i + 1] = tintedChannel(color[1], relative, 0.28, 0.82);
        out[i + 2] = tintedChannel(color[2], relative, 0.28, 0.82);
      } else if (finishType === 'burst') {
        const t = Math.min(1, Math.max(0, burstPosition(px, py)));
        const slot = Math.round(t * 255) * 3;
        out[i] = tintedChannel(lut[slot], relative, 0.38, 0.7);
        out[i + 1] = tintedChannel(lut[slot + 1], relative, 0.38, 0.7);
        out[i + 2] = tintedChannel(lut[slot + 2], relative, 0.38, 0.7);
      } else {
        throw new Error(`Onbekende afwerking: ${finishType}`);
      }
    }
  }
  return out;
}
