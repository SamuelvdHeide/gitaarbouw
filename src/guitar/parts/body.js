import * as THREE from 'three';
import { signedArea } from '../../geometry/polygon.js';
import { applyPlanarUVs, group, mesh } from '../../scene/threeHelpers.js';

const GRID_CELL = 0.35;
const SURFACE_LIFT = 0.004;
const CORNER_STEPS = 4;
const BINDING_HEIGHT = 0.28;

/** Rand-inzet waarop de voor/achterkant (via hun masker) over de afgeronde rand valt. */
export function faceMaskInset(body) {
  const radius = body.edgeRadius;
  const edge = Math.max(radius * 0.7, radius - 0.12);
  return body.binding ? Math.max(body.binding.width ?? 0.3, edge) : edge;
}

function inwardNormals(outline) {
  const count = outline.length;
  return outline.map((_, index) => {
    const [ax, ay] = outline[(index - 1 + count) % count];
    const [bx, by] = outline[(index + 1) % count];
    const length = Math.hypot(bx - ax, by - ay) || 1;
    // De contour is tegen de klok in: binnen ligt links van de looprichting.
    return [-(by - ay) / length, (bx - ax) / length];
  });
}

/**
 * Profiel over de rand van onder (binnen) naar boven (binnen) als [inset, z]-paren,
 * met afgeronde hoeken. `split` geeft het punt waar de binding begint.
 */
export function edgeProfile(zBottom, zTop, radius, binding, { frontInset = 0, backInset = 0 } = {}) {
  const r = Math.max(0.02, Math.min(radius, (zTop - zBottom) / 2.5));
  const points = [];
  // Waar de rand dunner is (contouren) wordt de afronding kleiner; de wand loopt dan
  // vlak door tot waar het gemaskeerde voor- en achtervlak begint, zodat er geen kier ontstaat.
  if (backInset > r) points.push([backInset, zBottom]);
  for (let step = 0; step <= CORNER_STEPS; step += 1) {
    const angle = (step / CORNER_STEPS) * (Math.PI / 2);
    points.push([r - r * Math.sin(angle), zBottom + r - r * Math.cos(angle)]);
  }
  const split = binding ? points.length : -1;
  if (binding) points.push([0, zTop - Math.min(binding.height ?? BINDING_HEIGHT, (zTop - zBottom) / 2)]);
  for (let step = 0; step <= CORNER_STEPS; step += 1) {
    const angle = (step / CORNER_STEPS) * (Math.PI / 2);
    points.push([r - r * Math.cos(angle), zTop - r + r * Math.sin(angle)]);
  }
  const topInset = Math.max(binding?.width ?? 0, frontInset);
  if (topInset > r) points.push([topInset, zTop]);
  return { points, split };
}

function stripGeometry(rings, bounds) {
  const ringCount = rings.length;
  const profileCount = rings[0].length;
  const positions = new Float32Array(ringCount * profileCount * 3);
  rings.forEach((ring, i) => ring.forEach((point, k) => positions.set(point, (i * profileCount + k) * 3)));

  const indices = [];
  for (let i = 0; i < ringCount; i += 1) {
    const next = (i + 1) % ringCount;
    for (let k = 0; k < profileCount - 1; k += 1) {
      const a = i * profileCount + k;
      const b = next * profileCount + k;
      const c = i * profileCount + k + 1;
      const d = next * profileCount + k + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  applyPlanarUVs(geometry, bounds);
  geometry.computeVertexNormals();
  return geometry;
}

/** Zijwand rond de contour, met de hoogte van voor- en achterkant vlak binnen de rand. */
function createWalls(outline, bounds, heights, body) {
  const ccw = signedArea(outline) >= 0 ? outline : [...outline].reverse();
  const normals = inwardNormals(ccw);
  const probe = body.edgeRadius + 0.05;

  const insets = { frontInset: faceMaskInset(body) + 0.08, backInset: faceMaskInset({ ...body, binding: null }) + 0.08 };
  const profiles = ccw.map(([x, y], index) => {
    const [nx, ny] = normals[index];
    const zTop = heights.front(x + nx * probe, y + ny * probe);
    const zBottom = heights.back(x + nx * probe, y + ny * probe);
    return edgeProfile(zBottom, zTop, body.edgeRadius, body.binding, insets);
  });

  const toRing = (index, slice) => {
    const [x, y] = ccw[index];
    const [nx, ny] = normals[index];
    return slice.map(([inset, z]) => [x + nx * inset, y + ny * inset, z]);
  };

  const { split } = profiles[0];
  if (split < 0) return [stripGeometry(profiles.map((profile, i) => toRing(i, profile.points)), bounds)];
  return [
    stripGeometry(profiles.map((profile, i) => toRing(i, profile.points.slice(0, split + 1))), bounds),
    stripGeometry(profiles.map((profile, i) => toRing(i, profile.points.slice(split))), bounds),
  ];
}

/** Voor- of achterkant als fijn raster dat de hoogtefunctie volgt; het masker maakt de contour. */
function createFace(bounds, heightAt, facing) {
  const margin = 0.5;
  const width = bounds.width + margin * 2;
  const height = bounds.height + margin * 2;
  const geometry = new THREE.PlaneGeometry(width, height, Math.ceil(width / GRID_CELL), Math.ceil(height / GRID_CELL));
  geometry.translate(bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2, 0);

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    position.setZ(i, heightAt(position.getX(i), position.getY(i)) + SURFACE_LIFT * facing);
  }
  if (facing < 0) {
    const index = geometry.index.array;
    for (let i = 0; i < index.length; i += 3) {
      [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
    }
  }
  geometry.computeVertexNormals();
  return applyPlanarUVs(geometry, bounds);
}

export function buildBody({ layout, materials, heights }) {
  const { outline, bounds, body } = layout;
  const [core, binding] = createWalls(outline, bounds, heights, body);
  const parts = [
    mesh(core, materials.bodySides),
    mesh(createFace(bounds, heights.front, 1), materials.bodyFront),
    mesh(createFace(bounds, heights.back, -1), materials.bodyBackFace),
  ];
  if (binding) parts.push(mesh(binding, materials.binding));
  parts[1].name = 'voorblad';
  return group('body', parts);
}
