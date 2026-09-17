import * as THREE from 'three';
import { pointInPolygon, roundedRect } from '../../geometry/polygon.js';
import { extrudePolygon, group, latheAlongZ, mesh } from '../../scene/threeHelpers.js';
import { PICKUPS } from '../../data/hardware.js';
import { pickupPlacements } from '../layout.js';

const STRING_GAP = { neck: 0.65, middle: 0.55, bridge: 0.45 };
// Vintage Strat-magneetstaffeling (hoogte boven de kap), lage E naar hoge e.
const STRAT_STAGGER = [0.084, 0.084, 0.183, 0.183, 0.0, 0.03];

function poles(xs, y, topZ, diameter, material, protrusions = []) {
  return xs.map((x, index) => {
    const height = 0.25 + (protrusions[index] ?? 0.04);
    const pole = mesh(latheAlongZ([[0, 0], [diameter / 2, 0], [diameter / 2, height - 0.03], [diameter / 2 - 0.04, height], [0, height]], 14), material, { castShadow: false });
    pole.position.set(x, y, topZ - 0.25);
    return pole;
  });
}

function block(width, depth, radius, height, material, bevel = 0.1) {
  return mesh(extrudePolygon(roundedRect(width, depth, radius), { depth: height, bevel, bevelSegments: 3 }), material);
}

function stratSingle(height, poleXs, materials) {
  const dims = PICKUPS.single;
  const lip = block(dims.width, dims.depth, dims.depth / 2, 0.12, materials.pickupCover, 0.03);
  const cover = block(dims.topWidth + 0.35, dims.depth - 0.02, (dims.depth - 0.02) / 2, height, materials.pickupCover, 0.16);
  return [lip, cover, ...poles(poleXs, 0, height, dims.poleDiameter, materials.nickel, STRAT_STAGGER)];
}

function teleNeck(height, poleXs, materials) {
  const cover = block(6.57, 1.45, 0.72, height, materials.pickupCover, 0.12);
  const plate = block(7.95, 1.2, 0.3, 0.1, materials.hardware, 0.02);
  return [plate, cover];
}

function teleBridge(height, poleXs, materials) {
  const dims = PICKUPS.teleBridge;
  const tabDepth = 1.1;
  const half = dims.plateWidth / 2;
  const plateOutline = [
    [-half, -dims.plateDepth / 2], [half, -dims.plateDepth / 2], [half, dims.plateDepth / 2 - tabDepth],
    [0.9, dims.plateDepth / 2], [-0.9, dims.plateDepth / 2], [-half, dims.plateDepth / 2 - tabDepth],
  ];
  const plate = mesh(extrudePolygon(plateOutline, { depth: 0.1 }), materials.nickel);
  const bobbin = block(dims.bobbinWidth, dims.bobbinDepth, dims.bobbinDepth / 2, height, materials.pickupCover, 0.08);
  bobbin.position.y = -0.55;
  return [plate, bobbin, ...poles(poleXs, -0.55, height, 0.495, materials.nickel)];
}

function soapbar(dims) {
  return (height, poleXs, materials) => [
    block(dims.width, dims.depth, dims.radius, height, materials.pickupCover, 0.12),
    ...poles(poleXs, 0, height, 0.5, materials.nickel),
  ];
}

function humbucker(height, poleXs, materials) {
  const dims = PICKUPS.humbucker;
  const rows = [-dims.rowSpacing / 2, dims.rowSpacing / 2];
  if (materials.pickupIsMetal) {
    return [
      block(dims.width, dims.depth, dims.radius, height, materials.pickupCover, 0.12),
      ...poles(poleXs, rows[0], height, 0.55, materials.hardware),
      ...poles(poleXs, rows[1], height, 0.5, materials.hardware, poleXs.map(() => -0.2)),
    ];
  }
  const bobbin = (y, material) => {
    const part = block(dims.width - 0.1, 1.75, 0.35, height, material, 0.08);
    part.position.y = y;
    return part;
  };
  return [
    block(dims.width + 0.3, dims.depth - 0.1, 0.2, 0.15, materials.nickel, 0.03),
    bobbin(rows[0], materials.pickupCover),
    bobbin(rows[1], materials.pickupSecondary),
    ...poles(poleXs, rows[0], height, 0.55, materials.nickel),
    ...poles(poleXs, rows[1], height, 0.5, materials.nickel),
  ];
}

function mountingRing(materials, height) {
  const ring = PICKUPS.humbuckerRing;
  const geometry = extrudePolygon(roundedRect(ring.width, ring.depth, 0.62), {
    depth: height,
    bevel: 0.1,
    bevelSegments: 2,
    holes: [roundedRect(ring.openingWidth, ring.openingDepth, 0.15).reverse()],
  });
  return mesh(geometry, materials.ringPlastic);
}

const BUILDERS = Object.freeze({
  single: stratSingle,
  teleNeck,
  teleBridge,
  humbucker,
  p90: soapbar(PICKUPS.p90),
  jazzmaster: soapbar(PICKUPS.jazzmaster),
});

/**
 * Plaatst alle elementen. Op een slagplaat hangen ze eronder; op de body krijgen
 * humbuckers een montagering. De kap komt steeds tot vlak onder de snaren.
 */
export function buildPickups({ model, design, materials, surfaceZ, pickguard, stringXAt, stringZAt }) {
  const placements = pickupPlacements(model, design.pickupConfig);
  const children = placements.map((placement) => {
    const onPickguard = Boolean(pickguard && pointInPolygon([placement.x, placement.y], pickguard.outline)
      && !pickguard.holes.some((hole) => pointInPolygon([placement.x, placement.y], hole)));
    const baseZ = onPickguard ? pickguard.topZ : surfaceZ(placement.x, placement.y);
    const needsRing = placement.type === 'humbucker' && !onPickguard;
    const ringHeight = model.body.carve ? PICKUPS.humbuckerRing.height : 0.5;
    const coverBase = needsRing ? ringHeight * 0.35 : 0;
    const topZ = stringZAt(placement.y) - (STRING_GAP[placement.slot] ?? 0.55);
    const height = Math.max(0.35, topZ - baseZ - coverBase);

    const poleXs = stringXAt(placement.y).map((x) => x / Math.cos(placement.angle));
    const build = BUILDERS[placement.style] ?? BUILDERS[placement.type];
    const coverGroup = group(`element-${placement.slot}`, build(height, poleXs, materials));
    coverGroup.position.z = coverBase;

    const parts = needsRing ? [mountingRing(materials, ringHeight), coverGroup] : [coverGroup];
    const pickup = group(`element-${placement.slot}-montage`, parts);
    pickup.position.set(placement.x, placement.y, baseZ);
    pickup.rotation.z = placement.angle;
    return pickup;
  });
  return group('elementen', children);
}
