import { s } from './dom.js';
import { computeLayout, neckWidthAt } from '../guitar/layout.js';
import { KNOB_PROFILES } from '../data/knobProfiles.js';
import { getWood } from '../data/woods.js';
import { renderWoodPixels } from '../textures/woodPixels.js';
import { renderPlasticPixels } from '../textures/plasticPixels.js';

const imageCache = new Map();

function pixelsToDataUrl(key, size, render) {
  if (!imageCache.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return '';
    context.putImageData(new ImageData(render(), size, size), 0, 0);
    imageCache.set(key, canvas.toDataURL());
  }
  return imageCache.get(key);
}

export function woodSwatchUrl(woodId) {
  return pixelsToDataUrl(`wood:${woodId}`, 96, () =>
    renderWoodPixels(getWood(woodId), { width: 96, height: 96, pxPerCm: 12, seed: 7 }));
}

export function plasticSwatchUrl(pattern) {
  return pixelsToDataUrl(`plastic:${pattern}`, 96, () =>
    renderPlasticPixels(pattern, { width: 96, height: 96, pxPerCm: 8 }));
}

/** CSS-verloop voor een sunburst-bolletje: kern in het midden, rand buiten. */
export function burstGradient(stops) {
  const parts = [...stops].reverse().map(([t, hex]) => `${hex} ${Math.round((1 - t) * 100)}%`);
  return `radial-gradient(circle at 50% 50%, ${parts.join(', ')})`;
}

export function metalGradient(hex) {
  return `linear-gradient(135deg, #ffffff 0%, ${hex} 38%, #6f6f6f 62%, ${hex} 82%, #ffffff 100%)`;
}

const toPath = (points) => `M${points.map(([x, y]) => `${x.toFixed(2)} ${(-y).toFixed(2)}`).join('L')}Z`;

const silhouetteCache = new Map();

/** Silhouet van body plus halsaanzet, direct uit de modelcontour (per model gecachet). */
export function modelSilhouette(model) {
  if (!silhouetteCache.has(model.id)) silhouetteCache.set(model.id, createSilhouette(model));
  return silhouetteCache.get(model.id).cloneNode(true);
}

function createSilhouette(model) {
  const layout = computeLayout(model);
  const neckTop = layout.bounds.maxY + 9;
  const bottomWidth = neckWidthAt(model, layout, layout.fretboardEndY) / 2;
  const neck = [
    [-bottomWidth, layout.fretboardEndY],
    [bottomWidth, layout.fretboardEndY],
    [bottomWidth * 0.94, neckTop],
    [-bottomWidth * 0.94, neckTop],
  ];
  const { minX, width } = layout.bounds;
  const padding = 1.5;
  const viewBox = [minX - padding, -neckTop - padding, width + padding * 2, neckTop - layout.bounds.minY + padding * 2];
  return s('svg', { class: 'silhouette', viewBox: viewBox.join(' '), 'aria-hidden': 'true', focusable: 'false' },
    s('path', { d: toPath(neck), class: 'silhouette__neck' }),
    s('path', { d: toPath(layout.outline), class: 'silhouette__body' }));
}

/** Zijaanzicht van een knop, uit hetzelfde lathe-profiel als het 3D-model. */
export function knobIcon(styleId) {
  const { profile } = KNOB_PROFILES[styleId];
  const right = profile.map(([r, height]) => [r, height]);
  const left = [...profile].reverse().map(([r, height]) => [-r, height]);
  return s('svg', { class: 'knob-icon', viewBox: '-1.6 -2.1 3.2 2.3', 'aria-hidden': 'true', focusable: 'false' },
    s('path', { d: toPath([...right, ...left]) }));
}

const PICKUP_SHAPES = Object.freeze({ single: { w: 20, h: 4.5, r: 2.25 }, p90: { w: 21, h: 8, r: 2.5 }, humbucker: { w: 18, h: 9, r: 1 } });
const SLOT_Y = Object.freeze({ neck: 7, middle: 18, bridge: 29 });

/** Mini-schema van de elementconfiguratie (hals boven, brug onder). */
export function pickupConfigIcon(config) {
  return s('svg', { class: 'pickup-icon', viewBox: '0 0 32 36', 'aria-hidden': 'true', focusable: 'false' },
    config.pickups.map(({ slot, type, angle = 0 }) => {
      const shape = PICKUP_SHAPES[type];
      const cy = SLOT_Y[slot];
      const rect = s('rect', {
        x: 16 - shape.w / 2, y: cy - shape.h / 2, width: shape.w, height: shape.h, rx: shape.r,
        transform: angle ? `rotate(${(-angle * 180) / Math.PI} 16 ${cy})` : undefined,
      });
      if (type !== 'humbucker') return rect;
      return [rect, s('line', { x1: 16 - shape.w / 2 + 1, x2: 16 + shape.w / 2 - 1, y1: cy, y2: cy, class: 'pickup-icon__split' })];
    }));
}
