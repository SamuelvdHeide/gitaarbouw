import { createDistanceField } from '../geometry/distanceField.js';
import { sampleOutline } from './layout.js';
import { bakeHeights, createBodyHeights } from './bodyShape.js';

const fieldCache = new Map();

/** Afstandsveld van de body-contour, per model gecachet (duur om te berekenen). */
export function getBodyField(model) {
  if (!fieldCache.has(model.id)) {
    const coarseOutline = sampleOutline(model.body.outline, 5);
    const field = createDistanceField(coarseOutline, { cellSize: 0.3, margin: 0.6 });
    fieldCache.set(model.id, Object.freeze({ field, maxDistance: maxInnerDistance(field) }));
  }
  return fieldCache.get(model.id);
}

export function maxInnerDistance(field, steps = 60) {
  const { minX, minY, width, height } = field.bounds;
  let best = 0;
  for (let row = 0; row <= steps; row += 1) {
    for (let col = 0; col <= steps; col += 1) {
      best = Math.max(best, field.sample(minX + (col / steps) * width, minY + (row / steps) * height));
    }
  }
  return best;
}

const heightCache = new Map();

/** Gebakken hoogteprofiel van voor- en achterkant, per model gecachet. */
export function getBodyHeights(model, layout) {
  if (!heightCache.has(model.id)) {
    const { field } = getBodyField(model);
    heightCache.set(model.id, bakeHeights(createBodyHeights(layout.body, field.sample), layout.bounds));
  }
  return heightCache.get(model.id);
}
