import * as THREE from 'three';
import { createLoftGeometry } from '../../scene/loft.js';
import { group, mesh } from '../../scene/threeHelpers.js';
import { NECK_TEXTURE_SIZE } from '../materials.js';
import { neckWidthAt } from '../layout.js';
import { smoothstep } from '../bodyShape.js';
import { buildInlays } from './inlays.js';
import { FRET_WIRE } from '../../data/hardware.js';
import { fretDistanceFromNut } from '../../geometry/fretMath.js';

export const FRETBOARD_THICKNESS = 0.6;
const ARC_POINTS = 14;
const DEFAULT_RADIUS_CM = { fender: 24.1, gibson: 30.5, prs: 25.4 };
const HEEL_LENGTH = 5.5;

/** Hoogteverlies door de toetsradius op afstand x van het midden. */
export function radiusDrop(x, radius) {
  const clamped = Math.min(Math.abs(x), radius * 0.99);
  return radius - Math.sqrt(radius * radius - clamped * clamped);
}

export function fretboardRadiusOf(model) {
  return model.fretboardRadius ?? DEFAULT_RADIUS_CM[model.brand] ?? 25.4;
}

const uvOf = (startY) => ([x, y, z]) => [
  (x + z * 0.6) / NECK_TEXTURE_SIZE.widthCm + 0.5,
  (y - startY) / NECK_TEXTURE_SIZE.heightCm,
];

/** Houtdikte van de hals op y, lineair door de gemeten diktes bij fret 1 en 12. */
export function neckDepthAt(model, layout, y) {
  const { first = 2.05, twelfth = 2.4 } = model.neckDepth ?? {};
  const at1 = fretDistanceFromNut(model.scaleLength, 1);
  const at12 = fretDistanceFromNut(model.scaleLength, 12);
  const t = (layout.nutY - y - at1) / (at12 - at1);
  return first + (twelfth - first) * Math.min(1.5, Math.max(-0.1, t));
}

/** Halsdoorsnede als halve ellips; gelijmde halzen krijgen een hiel die in de body overloopt. */
function neckShaft({ model, layout, neckTopZ, heelBottomZ, material }) {
  const startY = Math.min(model.heelEndY ?? Infinity, layout.fretboardEndY - (model.neckJoint === 'bolt' ? 0.5 : 3));
  const endY = layout.nutY + (model.brand === 'fender' ? 1.0 : 0.6);
  const stations = 26;
  const heelStart = layout.bodyEdgeY + HEEL_LENGTH;

  const rings = Array.from({ length: stations + 1 }, (_, index) => {
    const y = startY + ((endY - startY) * index) / stations;
    const width = neckWidthAt(model, layout, Math.min(y, layout.nutY));
    const baseDepth = y > layout.nutY ? neckDepthAt(model, layout, layout.nutY) - 0.45 : neckDepthAt(model, layout, y) - FRETBOARD_THICKNESS;
    const heel = model.neckJoint === 'set' ? smoothstep(heelStart, layout.bodyEdgeY - 0.5, y) : 0;
    const depth = baseDepth + Math.max(0, neckTopZ - heelBottomZ - baseDepth) * heel;
    return Array.from({ length: ARC_POINTS + 1 }, (_, step) => {
      const angle = (step / ARC_POINTS) * Math.PI;
      return [Math.cos(angle) * (width / 2) * (1 + heel * 0.08), y, neckTopZ - Math.sin(angle) * depth];
    });
  });
  return mesh(createLoftGeometry(rings, uvOf(startY)), material);
}

/** Toets met gewelfd bovenvlak (radius) en vlakke onderkant. */
function fretboard({ model, layout, neckTopZ, fretboardTopZ, radius, material }) {
  const stations = 12;
  const rings = Array.from({ length: stations + 1 }, (_, index) => {
    const y = layout.fretboardEndY + ((layout.nutY - layout.fretboardEndY) * index) / stations;
    const half = neckWidthAt(model, layout, y) / 2;
    const top = (x) => fretboardTopZ - radiusDrop(x, radius);
    const arc = Array.from({ length: ARC_POINTS - 1 }, (_, step) => {
      const x = -half + ((step + 1) / ARC_POINTS) * half * 2;
      return [x, y, top(x)];
    });
    return [[half, y, top(half)], [half, y, neckTopZ], [-half, y, neckTopZ], [-half, y, top(-half)], ...arc];
  });
  return mesh(createLoftGeometry(rings, uvOf(layout.fretboardEndY)), material);
}

/** Crème binding langs beide zijkanten van de toets (Gibson). */
function fretboardBinding({ model, layout, neckTopZ, fretboardTopZ, radius, material }) {
  const width = 0.08;
  const ringAt = (y, side) => {
    const inner = (neckWidthAt(model, layout, y) / 2) * side;
    const outer = inner + width * side;
    const top = fretboardTopZ - radiusDrop(inner, radius) + 0.01;
    const [right, left] = side > 0 ? [outer, inner] : [inner, outer];
    return [[right, y, top], [right, y, neckTopZ], [left, y, neckTopZ], [left, y, top]];
  };
  return [1, -1].map((side) => mesh(
    createLoftGeometry([ringAt(layout.fretboardEndY, side), ringAt(layout.nutY, side)], uvOf(layout.fretboardEndY)),
    material,
    { castShadow: false },
  ));
}

function frets({ model, layout, fretboardTopZ, radius, material }) {
  const wire = FRET_WIRE[model.brand] ?? FRET_WIRE.fender;
  const crown = wire.width / 2;
  return layout.fretYs.map((y) => {
    const half = neckWidthAt(model, layout, y) / 2 - 0.04;
    const points = Array.from({ length: 13 }, (_, step) => {
      const x = -half + (step / 12) * half * 2;
      return new THREE.Vector3(x, y, fretboardTopZ - radiusDrop(x, radius) + wire.height - crown);
    });
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, crown, 6);
    return mesh(geometry, material, { castShadow: false });
  });
}

function nut({ model, layout, neckTopZ, fretboardTopZ, material }) {
  const height = fretboardTopZ + 0.18 - neckTopZ;
  const part = mesh(new THREE.BoxGeometry(model.nutWidth + 0.05, 0.5, height), material);
  part.position.set(0, layout.nutY + 0.25, neckTopZ + height / 2);
  return part;
}

/**
 * Hals met toets, frets, inlays en topkam, in body-coördinaten zonder halshoek
 * (de halshoek wordt in buildGuitar als rotatie toegepast).
 */
export function buildNeck({ model, layout, materials, fretboardTopZ, design, heelBottomZ }) {
  const neckTopZ = fretboardTopZ - FRETBOARD_THICKNESS;
  const radius = fretboardRadiusOf(model);
  const context = { model, layout, neckTopZ, fretboardTopZ, radius, heelBottomZ };
  return group('hals', [
    neckShaft({ ...context, material: materials.neck }),
    fretboard({ ...context, material: materials.fretboard }),
    ...frets({ ...context, material: materials.nickel }),
    buildInlays({ model, layout, materials, design, topAt: (x) => fretboardTopZ - radiusDrop(x, radius) }),
    nut({ ...context, material: materials.nut }),
    ...(model.fretboardBinding ? fretboardBinding({ ...context, material: materials.fretboardBinding }) : []),
  ]);
}
