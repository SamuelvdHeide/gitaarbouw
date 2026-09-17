import { boundsOf, signedDistance } from './polygon.js';

/**
 * Rastert de afstand tot de rand van een polygoon (positief = binnen).
 * Gebruikt voor de gewelfde Les Paul-top en voor sunburst-verlopen die de
 * contour van de body volgen.
 */
export function createDistanceField(polygon, { cellSize = 0.35, margin = 1 } = {}) {
  if (!(cellSize > 0)) throw new Error('cellSize moet positief zijn');

  const raw = boundsOf(polygon);
  const minX = raw.minX - margin;
  const minY = raw.minY - margin;
  const cols = Math.ceil((raw.width + margin * 2) / cellSize) + 1;
  const rows = Math.ceil((raw.height + margin * 2) / cellSize) + 1;
  const data = new Float32Array(cols * rows);

  for (let row = 0; row < rows; row += 1) {
    const y = minY + row * cellSize;
    for (let col = 0; col < cols; col += 1) {
      data[row * cols + col] = signedDistance([minX + col * cellSize, y], polygon);
    }
  }

  function cell(col, row) {
    const c = Math.min(cols - 1, Math.max(0, col));
    const r = Math.min(rows - 1, Math.max(0, row));
    return data[r * cols + c];
  }

  function sample(x, y) {
    const fx = (x - minX) / cellSize;
    const fy = (y - minY) / cellSize;
    const c0 = Math.floor(fx);
    const r0 = Math.floor(fy);
    const tx = fx - c0;
    const ty = fy - r0;
    const top = cell(c0, r0) * (1 - tx) + cell(c0 + 1, r0) * tx;
    const bottom = cell(c0, r0 + 1) * (1 - tx) + cell(c0 + 1, r0 + 1) * tx;
    return top * (1 - ty) + bottom * ty;
  }

  return Object.freeze({ bounds: raw, cols, rows, cellSize, sample });
}
