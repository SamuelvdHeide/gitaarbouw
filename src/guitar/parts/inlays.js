import * as THREE from 'three';
import { group, mesh, shapeFromPolygon } from '../../scene/threeHelpers.js';
import { isDarkWood } from '../../data/woods.js';
import { neckWidthAt } from '../layout.js';
import { INLAYS } from '../../data/hardware.js';

const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
const DOUBLE_DOT_FRETS = new Set([12, 24]);
const INLAY_LIFT = 0.006;

const BIRD = [
  [-1.0, 0.1], [-0.55, 0.32], [-0.18, 0.16], [0, 0.5], [0.14, 0.14], [0.55, 0.26],
  [1.0, -0.02], [0.32, -0.1], [0.08, -0.5], [-0.22, -0.08],
];

function inlayCenter(layout, fret) {
  const previous = fret === 1 ? layout.nutY : layout.fretYs[fret - 2];
  const current = layout.fretYs[fret - 1];
  return { y: (previous + current) / 2, spacing: previous - current };
}

/** Vlak vormpje dat de welving van de toets volgt. */
function conformedShape(polygon, topAt, material) {
  const geometry = new THREE.ShapeGeometry(shapeFromPolygon(polygon));
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    position.setZ(i, topAt(position.getX(i)) + INLAY_LIFT);
  }
  geometry.computeVertexNormals();
  return mesh(geometry, material, { castShadow: false });
}

/** Trapezium als raster, zodat het over de hele breedte op de gewelfde toets ligt. */
function conformedQuad([bl, br, tr, tl], topAt, material, columns = 10) {
  const positions = [];
  const indices = [];
  for (let row = 0; row <= 1; row += 1) {
    const [left, right] = row === 0 ? [bl, br] : [tl, tr];
    for (let col = 0; col <= columns; col += 1) {
      const t = col / columns;
      const x = left[0] + (right[0] - left[0]) * t;
      positions.push(x, left[1] + (right[1] - left[1]) * t, topAt(x) + INLAY_LIFT);
    }
  }
  for (let col = 0; col < columns; col += 1) {
    const a = col;
    const b = col + 1;
    const c = columns + 1 + col;
    const d = columns + 2 + col;
    indices.push(a, b, c, b, d, c);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(geometry, material, { castShadow: false });
}

function inlayMeshes(model, layout, fret, topAt, material) {
  const { y, spacing } = inlayCenter(layout, fret);
  const width = neckWidthAt(model, layout, y);

  if (model.inlays === 'trapezoid') {
    // Gemeten Gibson-maten; de brede kant wijst naar de topkam (hogere y).
    const size = INLAYS.trapezoids.find(({ frets }) => frets.includes(fret)) ?? INLAYS.trapezoids.at(-1);
    const scale = Math.min(1, (width - 0.5) / size.wide, (spacing * 0.8) / size.length);
    const [wide, narrow, height] = [size.wide * scale, size.narrow * scale, size.length * scale];
    const quad = [[-narrow / 2, y - height / 2], [narrow / 2, y - height / 2], [wide / 2, y + height / 2], [-wide / 2, y + height / 2]];
    return [conformedQuad(quad, topAt, material)];
  }
  if (model.inlays === 'birds') {
    const scale = Math.min(spacing * 0.42, 1.25);
    const tilt = (fret % 2 === 0 ? 1 : -1) * 0.25;
    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);
    const bird = BIRD.map(([bx, by]) => [(bx * cos - by * sin) * scale, y + (bx * sin + by * cos) * scale]);
    return [conformedShape(bird, topAt, material)];
  }
  const circle = (cx) => Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    return [cx + Math.cos(angle) * (INLAYS.dotDiameter / 2), y + Math.sin(angle) * (INLAYS.dotDiameter / 2)];
  });
  const offset = (INLAYS.doubleDotSpacing[model.brand] ?? INLAYS.doubleDotSpacing.fender) / 2;
  const centers = DOUBLE_DOT_FRETS.has(fret) ? [-offset, offset] : [0];
  return centers.map((cx) => conformedShape(circle(cx), topAt, material));
}

/** Inlays op de toets: stippen, trapezia of PRS-vogels. */
export function buildInlays({ model, layout, materials, design, topAt }) {
  const material = isDarkWood(design.fretboardWood) || model.inlays !== 'dots' ? materials.inlay : materials.inlayDark;
  return group('inlays', INLAY_FRETS
    .filter((fret) => fret <= model.fretCount)
    .flatMap((fret) => inlayMeshes(model, layout, fret, topAt, material)));
}
