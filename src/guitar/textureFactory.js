import { getWood } from '../data/woods.js';
import { getBurst } from '../data/finishes.js';
import { renderWoodPixels } from '../textures/woodPixels.js';
import { composeFinish } from '../textures/finishPixels.js';
import { renderPlasticPixels } from '../textures/plasticPixels.js';
import { pixelsToTexture } from '../scene/textureCache.js';

const BODY_PX_PER_CM = 22;
const NECK_PX_PER_CM = 14;
const MASK_PX_PER_CM = 14;
const MAX_RAW_WOOD_ENTRIES = 6;
export const NECK_TEXTURE_SIZE = Object.freeze({ widthCm: 16, heightCm: 64 });

// Ruwe houtpixels worden kort bewaard: een burst en een transparante lak op
// hetzelfde hout delen dezelfde nerf.
const rawWoodCache = new Map();

function woodPixels(woodId, width, height, pxPerCm) {
  const key = `${woodId}:${width}x${height}:${pxPerCm}`;
  if (rawWoodCache.has(key)) return rawWoodCache.get(key);
  const pixels = renderWoodPixels(getWood(woodId), { width, height, pxPerCm });
  rawWoodCache.set(key, pixels);
  if (rawWoodCache.size > MAX_RAW_WOOD_ENTRIES) rawWoodCache.delete(rawWoodCache.keys().next().value);
  return pixels;
}

/**
 * Levert texturen voor één opbouw en onthoudt welke cachesleutels gebruikt
 * zijn, zodat de cache die kan beschermen zolang de gitaar in beeld is.
 */
export function createTextureFactory({ cache, model, bounds, bodyField }) {
  const usedKeys = new Set();
  const fromCache = (key, factory) => cache.get(key, factory, usedKeys);

  /** Hout met lak (naturel, transparant of burst) over de hele body. */
  function bodyFinish(woodId, { finishType, colorHex, burstId }) {
    const width = Math.ceil(bounds.width * BODY_PX_PER_CM);
    const height = Math.ceil(bounds.height * BODY_PX_PER_CM);
    const key = ['body', model.id, woodId, finishType, colorHex ?? '', burstId ?? ''].join(':');
    return fromCache(key, () => {
      const burstReach = bodyField.maxDistance * 0.92;
      const pixels = composeFinish(woodPixels(woodId, width, height, BODY_PX_PER_CM), {
        width,
        height,
        finishType,
        colorHex,
        woodLight: getWood(woodId).light,
        burstStops: burstId ? getBurst(burstId).stops : undefined,
        burstPosition: (px, py) =>
          bodyField.field.sample(bounds.minX + px / BODY_PX_PER_CM, bounds.minY + py / BODY_PX_PER_CM) / burstReach,
      });
      return pixelsToTexture(pixels, width, height);
    });
  }

  /** Herhalende houttextuur voor hals, toets, kop en binding. */
  function wood(woodId, finishType = 'natural') {
    const width = NECK_TEXTURE_SIZE.widthCm * NECK_PX_PER_CM;
    const height = NECK_TEXTURE_SIZE.heightCm * NECK_PX_PER_CM;
    return fromCache(`wood:${woodId}:${finishType}`, () => {
      const raw = woodPixels(woodId, width, height, NECK_PX_PER_CM);
      const pixels = composeFinish(raw, { width, height, finishType, woodLight: getWood(woodId).light });
      return pixelsToTexture(pixels, width, height, { repeat: true });
    });
  }

  function plastic(pattern) {
    return fromCache(`plastic:${pattern}`, () => {
      const size = 512;
      const pixels = renderPlasticPixels(pattern, { width: size, height: size, pxPerCm: 12 });
      return pixelsToTexture(pixels, size, size, { repeat: true });
    });
  }

  /** Masker voor het voorblad: alleen binnen de contour (min inset) zichtbaar. */
  function topMask(inset) {
    const width = Math.ceil(bounds.width * MASK_PX_PER_CM);
    const height = Math.ceil(bounds.height * MASK_PX_PER_CM);
    return fromCache(`mask:${model.id}:${inset}`, () => {
      const pixels = new Uint8ClampedArray(width * height * 4);
      for (let py = 0; py < height; py += 1) {
        for (let px = 0; px < width; px += 1) {
          const distance = bodyField.field.sample(bounds.minX + (px + 0.5) / MASK_PX_PER_CM, bounds.minY + (py + 0.5) / MASK_PX_PER_CM);
          const alpha = Math.min(1, Math.max(0, (distance - inset) * MASK_PX_PER_CM + 0.5)) * 255;
          const i = (py * width + px) * 4;
          pixels[i] = alpha;
          pixels[i + 1] = alpha;
          pixels[i + 2] = alpha;
          pixels[i + 3] = 255;
        }
      }
      return pixelsToTexture(pixels, width, height, { srgb: false });
    });
  }

  return Object.freeze({ bodyFinish, wood, plastic, topMask, usedKeys: () => [...usedKeys] });
}
