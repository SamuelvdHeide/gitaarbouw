import { clamp } from '../geometry/fretMath.js';

// Hoogteprofiel van de body: voor- en achterkant als functie van (x, y).
// Vorm-kenmerken (carve, contouren, afschuiningen) worden opgeteld, zodat
// elk model met een paar getallen beschreven kan worden.

export function smoothstep(edge0, edge1, value) {
  if (edge0 === edge1) return value < edge0 ? 0 : 1;
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Weegfactor 0..1 voor de lengte-positie y binnen [start, end] met zachte randen. */
export function rangeWeight(y, [start, end], fade) {
  if (fade <= 0) return y >= start && y <= end ? 1 : 0;
  return smoothstep(start - fade, start + fade, y) * (1 - smoothstep(end - fade, end + fade, y));
}

/** Weegfactor voor de kant van de body: bass (x < 0), treble (x > 0) of both. */
export function sideWeight(x, side) {
  if (side === 'bass') return smoothstep(1, -1, x);
  if (side === 'treble') return smoothstep(-1, 1, x);
  return 1;
}

/** Diepte van een afschuining of contour op afstand `distance` van de rand. */
export function cutDepth(distance, { width, depth, profile = 'round' }) {
  const t = clamp(distance / width, 0, 1);
  if (profile === 'flat') return depth * (1 - t);
  if (profile === 'scoop') return depth * (1 - t) * (1 - t);
  return depth * (1 - smoothstep(0, 1, t));
}

/**
 * Afstand tot een open lijn, aan welke kant het punt ligt (+1 links, -1 rechts)
 * en hoe ver het voorbij een uiteinde van de lijn ligt (`beyond`, 0 als het ernaast ligt).
 */
export function polylineSide([px, py], polyline) {
  let best = { distance: Infinity, side: 1, beyond: 0 };
  const last = polyline.length - 2;
  for (let i = 0; i <= last; i += 1) {
    const [ax, ay] = polyline[i];
    const [bx, by] = polyline[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy || 1;
    const raw = ((px - ax) * dx + (py - ay) * dy) / lengthSquared;
    const t = clamp(raw, 0, 1);
    const distance = Math.hypot(ax + t * dx - px, ay + t * dy - py);
    if (distance < best.distance) {
      const cross = dx * (py - ay) - dy * (px - ax);
      const length = Math.sqrt(lengthSquared);
      const beyond = (i === 0 && raw < 0 ? -raw : 0) + (i === last && raw > 1 ? raw - 1 : 0);
      best = { distance, side: cross >= 0 ? 1 : -1, beyond: beyond * length };
    }
  }
  return best;
}

/**
 * Contour tussen een grenslijn en de rand van de body (zoals Fender-tekeningen
 * hem aangeven): 0 op de lijn, volle diepte op de rand.
 */
function prepareBoundary(feature, distanceAt) {
  const { boundary } = feature;
  const middle = Math.floor((boundary.length - 1) / 2);
  const [ax, ay] = boundary[middle];
  const [bx, by] = boundary[middle + 1];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  const [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
  const [nx, ny] = [-(by - ay) / length, (bx - ax) / length];
  const leftCloserToEdge = distanceAt(mx + nx, my + ny) < distanceAt(mx - nx, my - ny);
  return { ...feature, regionSide: leftCloserToEdge ? 1 : -1 };
}

const BOUNDARY_END_FADE = 1.5;

function boundaryDepth(feature, x, y, distance) {
  const { distance: fromLine, side, beyond } = polylineSide([x, y], feature.boundary);
  if (side !== feature.regionSide || beyond >= BOUNDARY_END_FADE) return 0;
  const t = fromLine / (fromLine + Math.max(distance, 0) + 1e-6);
  const fade = 1 - smoothstep(0, BOUNDARY_END_FADE, beyond);
  return feature.depth * fade * (feature.profile === 'flat' ? t : smoothstep(0, 1, t));
}

function featureDepth(feature, x, y, distance) {
  if (feature.boundary) return boundaryDepth(feature, x, y, distance);
  const along = feature.yRange ? rangeWeight(y, feature.yRange, feature.fade ?? 2) : 1;
  if (along === 0) return 0;
  const side = sideWeight(x, feature.side ?? 'both');
  if (side === 0) return 0;
  return cutDepth(distance, feature) * along * side;
}

/**
 * Gewelfde top: stijgt vanaf de rand (na `inset`) over `falloff` cm naar
 * `height`, met optionele recurve (lichte holling vlak bij de rand).
 */
export function carveHeight(distance, { height, falloff, inset = 0, recurve = 0 }) {
  const t = clamp((distance - inset) / falloff, 0, 1);
  const rise = 1 - (1 - t) * (1 - t);
  const dip = recurve * Math.sin(Math.PI * clamp(t * 2.2, 0, 1)) * (1 - t);
  return height * Math.max(0, rise - dip);
}

/** Lineaire interpolatie in een oplopende lijst [x, waarde]-paren (met klemmen aan de uiteinden). */
export function interpolateTable(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i += 1) {
    const [x1, v1] = table[i];
    if (x <= x1) {
      const [x0, v0] = table[i - 1];
      return v0 + ((v1 - v0) * (x - x0)) / (x1 - x0 || 1);
    }
  }
  return table.at(-1)[1];
}

/** S-curve: hol tot het buigpunt `inflection` (0..1), daarna bol naar 1. */
export function concaveConvex(u, inflection) {
  const t = clamp(u, 0, 1);
  const k = clamp(inflection, 0.05, 0.95);
  return t < k ? (t * t) / k : 1 - ((1 - t) * (1 - t)) / (1 - k);
}

/**
 * Gemeten carve (Les Paul, PRS): de kroonhoogte volgt het profiel over de
 * middenlijn; dwars loopt het vlak vanaf een vlakke bindingrand hol en dan bol
 * omhoog naar die kroon.
 */
function profiledCarve(carve, distanceAt) {
  return (x, y, distance) => {
    const crown = interpolateTable(carve.centerline, y);
    if (crown <= 0) return 0;
    const ledge = carve.ledges ? interpolateTable(carve.ledges, y) : carve.inset ?? 0;
    const span = Math.max(0.5, distanceAt(0, y) - ledge);
    const u = (distance - ledge) / span;
    if (u <= 0) return 0;
    return crown * concaveConvex(u, (carve.inflection ?? 2) / span);
  };
}

/**
 * Maakt de hoogtefuncties voor een model.
 * @param {object} body modeldefinitie `body`
 * @param {(x: number, y: number) => number} distanceAt afstand tot de rand (positief binnen)
 */
export function createBodyHeights(body, distanceAt) {
  const features = [...(body.contours ?? []), ...(body.bevels ?? [])]
    .map((feature) => (feature.boundary ? prepareBoundary(feature, distanceAt) : feature));
  const frontFeatures = features.filter((feature) => feature.face === 'front');
  const backFeatures = features.filter((feature) => feature.face === 'back');

  const carveAt = body.carve?.centerline
    ? profiledCarve(body.carve, distanceAt)
    : (x, y, distance) => (body.carve ? carveHeight(distance, body.carve) : 0);

  function front(x, y) {
    const distance = distanceAt(x, y);
    const carve = carveAt(x, y, distance);
    const cut = frontFeatures.reduce((sum, feature) => sum + featureDepth(feature, x, y, distance), 0);
    return body.thickness + carve - cut;
  }

  function back(x, y) {
    const distance = distanceAt(x, y);
    return backFeatures.reduce((sum, feature) => sum + featureDepth(feature, x, y, distance), 0);
  }

  return Object.freeze({ front, back });
}

/**
 * Bakt hoogtefuncties in een raster (per model één keer) zodat opbouwen snel
 * blijft, ook met honderden grenslijn-segmenten (SG-afschuiningen).
 */
export function bakeHeights(heights, bounds, cellSize = 0.2, margin = 1) {
  const minX = bounds.minX - margin;
  const minY = bounds.minY - margin;
  const cols = Math.ceil((bounds.width + margin * 2) / cellSize) + 1;
  const rows = Math.ceil((bounds.height + margin * 2) / cellSize) + 1;

  const bake = (fn) => {
    const data = new Float32Array(cols * rows);
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        data[row * cols + col] = fn(minX + col * cellSize, minY + row * cellSize);
      }
    }
    return (x, y) => {
      const fx = clamp((x - minX) / cellSize, 0, cols - 1.001);
      const fy = clamp((y - minY) / cellSize, 0, rows - 1.001);
      const c = Math.floor(fx);
      const r = Math.floor(fy);
      const tx = fx - c;
      const ty = fy - r;
      const top = data[r * cols + c] * (1 - tx) + data[r * cols + c + 1] * tx;
      const bottom = data[(r + 1) * cols + c] * (1 - tx) + data[(r + 1) * cols + c + 1] * tx;
      return top * (1 - ty) + bottom * ty;
    };
  };

  return Object.freeze({ front: bake(heights.front), back: bake(heights.back) });
}
