// Pure 2D-polygoonhulpmiddelen. Punten zijn [x, y]-tuples in centimeters.

export function boundsOf(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    area += x1 * y2 - x2 * y1;
  }
  return area / 2;
}

export function pointInPolygon([px, py], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const crosses = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function distanceToSegmentSquared(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const cx = ax + t * dx - px;
  const cy = ay + t * dy - py;
  return cx * cx + cy * cy;
}

export function distanceToEdge([px, py], polygon) {
  let best = Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    const [ax, ay] = polygon[i];
    const [bx, by] = polygon[(i + 1) % polygon.length];
    best = Math.min(best, distanceToSegmentSquared(px, py, ax, ay, bx, by));
  }
  return Math.sqrt(best);
}

/** Positief binnen de polygoon, negatief erbuiten. */
export function signedDistance(point, polygon) {
  const distance = distanceToEdge(point, polygon);
  return pointInPolygon(point, polygon) ? distance : -distance;
}

/**
 * Horizontale doorsnede op hoogte y: [minX, maxX] van alle snijpunten,
 * of null als de lijn de polygoon niet raakt.
 */
export function horizontalExtent(polygon, y) {
  let minX = Infinity;
  let maxX = -Infinity;
  for (let i = 0; i < polygon.length; i += 1) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    const spansY = (y1 <= y && y2 >= y) || (y2 <= y && y1 >= y);
    if (!spansY) continue;
    const hits = y1 === y2 ? [x1, x2] : [x1 + ((y - y1) / (y2 - y1)) * (x2 - x1)];
    minX = Math.min(minX, ...hits);
    maxX = Math.max(maxX, ...hits);
  }
  return Number.isFinite(minX) ? [minX, maxX] : null;
}

/** Verticale doorsnede op x: [minY, maxY], of null als de lijn de polygoon mist. */
export function verticalExtent(polygon, x) {
  return horizontalExtent(polygon.map(([px, py]) => [py, px]), x);
}

/** Afgeronde rechthoek rond (0,0) als polygoon. */
export function roundedRect(width, height, radius, segmentsPerCorner = 6) {
  const r = Math.min(radius, width / 2, height / 2);
  const hw = width / 2 - r;
  const hh = height / 2 - r;
  const corners = [
    [hw, hh, 0],
    [-hw, hh, Math.PI / 2],
    [-hw, -hh, Math.PI],
    [hw, -hh, (3 * Math.PI) / 2],
  ];
  const points = [];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= segmentsPerCorner; i += 1) {
      const a = start + (i / segmentsPerCorner) * (Math.PI / 2);
      points.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  }
  return points;
}

/**
 * Plaatst `count` punten gelijkmatig langs de omtrek, `inset` cm naar binnen.
 * Handig voor schroefjes op een slagplaat.
 */
export function pointsAlongPerimeter(polygon, count, inset) {
  const lengths = [];
  let total = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const [ax, ay] = polygon[i];
    const [bx, by] = polygon[(i + 1) % polygon.length];
    const length = Math.hypot(bx - ax, by - ay);
    lengths.push(length);
    total += length;
  }

  const orientation = signedArea(polygon) >= 0 ? 1 : -1;
  const result = [];
  let segment = 0;
  let travelled = 0;
  for (let k = 0; k < count; k += 1) {
    const target = ((k + 0.5) / count) * total;
    while (travelled + lengths[segment] < target && segment < polygon.length - 1) {
      travelled += lengths[segment];
      segment += 1;
    }
    const [ax, ay] = polygon[segment];
    const [bx, by] = polygon[(segment + 1) % polygon.length];
    const length = lengths[segment] || 1;
    const t = (target - travelled) / length;
    const nx = (-(by - ay) / length) * orientation;
    const ny = ((bx - ax) / length) * orientation;
    result.push([ax + (bx - ax) * t + nx * inset, ay + (by - ay) * t + ny * inset]);
  }
  return result;
}
