import * as THREE from 'three';

const DEFAULT_BUDGET_BYTES = 96 * 1024 * 1024;
// Canvas (RGBA) plus GPU-kopie met mipmaps (~4/3).
const BYTES_PER_PIXEL = 4 + 4 * (4 / 3);

/** Maakt een three.js-textuur van ruwe RGBA-pixels via een canvas. */
export function pixelsToTexture(pixels, width, height, { srgb = true, repeat = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is niet beschikbaar (mogelijk is het geheugen van de browser vol)');
  context.putImageData(new ImageData(pixels, width, height), 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = 8;
  // Canvas-rij 0 is de bovenkant; UV v = 0 hoort bij de onderkant (kleinste y).
  texture.flipY = false;
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }
  texture.needsUpdate = true;
  return texture;
}

export function estimateTextureBytes(texture) {
  const { width = 0, height = 0 } = texture?.image ?? {};
  return Math.round(width * height * BYTES_PER_PIXEL);
}

/**
 * LRU-cache voor dure texturen met een geheugenbudget.
 *
 * `get` ruimt nooit op, zodat er tijdens een opbouw niets verdwijnt. Na een
 * geslaagde wissel geeft de viewer met `retain` door welke sleutels de
 * zichtbare gitaar gebruikt; `trim` ruimt daarna de oudste ongebruikte op.
 */
export function createTextureCache({ budgetBytes = DEFAULT_BUDGET_BYTES, measure = estimateTextureBytes } = {}) {
  const entries = new Map();
  let inUse = new Set();

  function totalBytes() {
    let sum = 0;
    entries.forEach(({ bytes }) => { sum += bytes; });
    return sum;
  }

  function get(key, factory, usedKeys) {
    usedKeys?.add(key);
    if (entries.has(key)) {
      const entry = entries.get(key);
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    }
    const value = factory();
    entries.set(key, { value, bytes: measure(value) });
    return value;
  }

  function retain(keys) {
    inUse = new Set(keys);
  }

  function trim() {
    let bytes = totalBytes();
    for (const [key, entry] of entries) {
      if (bytes <= budgetBytes) break;
      if (inUse.has(key)) continue;
      entries.delete(key);
      entry.value?.dispose?.();
      bytes -= entry.bytes;
    }
  }

  function clear() {
    entries.forEach(({ value }) => value?.dispose?.());
    entries.clear();
    inUse = new Set();
  }

  return Object.freeze({ get, retain, trim, clear, size: () => entries.size, bytes: totalBytes });
}
