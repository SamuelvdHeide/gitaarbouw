import * as THREE from 'three';
import { roundedRect } from '../../geometry/polygon.js';
import { sampleOpenCurve } from '../../geometry/spline.js';
import { extrudePolygon, group, latheAlongZ, mesh } from '../../scene/threeHelpers.js';
import { BRIDGES } from '../../data/hardware.js';
import { tailpieceStuds } from '../layout.js';

// Intonatie: zadels staan per snaar iets verschoven (lage E het verst naar achteren).
const TREMOLO_STAGGER = [-0.32, -0.18, -0.08, -0.12, -0.2, 0.0];
const BARREL_STAGGER = [-0.25, 0.0, -0.12];

function box(width, depth, height, material, [x, y, z]) {
  const part = mesh(new THREE.BoxGeometry(width, depth, height), material);
  part.position.set(x, y, z + height / 2);
  return part;
}

function plate(outline, thickness, material, [x, y, z]) {
  const part = mesh(extrudePolygon(outline, { depth: thickness, bevel: Math.min(0.05, thickness / 3), bevelSegments: 2 }), material);
  part.position.set(x, y, z);
  return part;
}

function post(diameter, height, material, [x, y, z]) {
  const part = mesh(latheAlongZ([[0, 0], [diameter / 2, 0], [diameter / 2, height], [0, height]], 16), material);
  part.position.set(x, y, z);
  return part;
}

function screwHead([x, y], z, material, radius = 0.33) {
  const head = mesh(latheAlongZ([[0, 0], [radius, 0], [radius * 0.85, 0.08], [0, 0.12]], 14), material, { castShadow: false });
  head.position.set(x, y, z);
  return head;
}

/** Tremolo-arm: korte poot omhoog, bocht, lange poot schuin naar de knoppen. */
function tremoloArm([x, y, z], dims, materials) {
  const reach = dims.armLength - 2.5;
  const points = sampleOpenCurve([[0, 0], [0.01, 1.2], [1.2, 1.9], [reach * 0.55, 2.4], [reach, 2.2]], 8)
    .map(([along, lift]) => new THREE.Vector3(x + along * 0.55, y - along * 0.83, z + lift));
  const arm = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, dims.armDiameter / 2, 10), materials.hardware);
  const tipGeometry = new THREE.CapsuleGeometry(dims.tipDiameter / 2, dims.tipLength - dims.tipDiameter, 4, 12);
  const tip = mesh(tipGeometry, materials.creamPlastic);
  tip.position.copy(points.at(-1));
  tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.55, -0.83, 0.05).normalize());
  return [arm, tip];
}

function buildTremolo({ model, surfaceZ, saddleTopZ, spread, materials }) {
  const isPrs = model.bridgeHardware === 'prsTremolo';
  const dims = isPrs ? BRIDGES.prsTremolo : BRIDGES.stratTremolo;
  const baseZ = surfaceZ(0, model.bridgeY) + 0.1;
  const plateTop = baseZ + dims.plateThickness;
  const frontY = model.bridgeDetails?.pivotScrewLineY ?? model.bridgeY + 1.35;
  const plateCenterY = frontY + 0.35 - dims.plateDepth / 2;
  const rearY = plateCenterY - dims.plateDepth / 2;

  const parts = [
    plate(roundedRect(dims.plateWidth, dims.plateDepth, isPrs ? 0.5 : 0.12), dims.plateThickness, materials.hardware, [0, plateCenterY, baseZ]),
    box(dims.plateWidth - 0.2, 0.18, isPrs ? dims.wallHeight : 0.8, materials.hardware, [0, rearY + 0.09, plateTop]),
  ];
  if (isPrs) {
    [-1, 1].forEach((side) => parts.push(box(0.18, dims.plateDepth - 0.4, dims.wallHeight, materials.hardware, [side * (dims.plateWidth / 2 - 0.3), plateCenterY, plateTop])));
  }
  const pivotSpacing = dims.pivotScrewSpacing / 5;
  for (let i = 0; i < 6; i += 1) parts.push(screwHead([(i - 2.5) * pivotSpacing, frontY], plateTop, materials.hardware, 0.35));

  const saddles = spread.map(({ bridgeX }, index) => [bridgeX, model.bridgeY + TREMOLO_STAGGER[index], saddleTopZ]);
  saddles.forEach(([x, y]) => {
    const saddle = box(dims.saddleWidth - 0.08, dims.saddleLength, saddleTopZ - plateTop, materials.hardware, [x, y - dims.saddleLength / 2 + 0.35, plateTop]);
    parts.push(saddle);
  });
  parts.push(...tremoloArm([dims.plateWidth / 2 - 0.9, rearY + 0.6, plateTop], dims, materials));

  const tails = spread.map(({ bridgeX }) => [bridgeX, rearY + 0.7, plateTop]);
  return { object: group('brug-tremolo', parts), saddles, tails };
}

function buildAshtray({ model, surfaceZ, saddleTopZ, spread, materials }) {
  const dims = BRIDGES.teleAshtray;
  const details = model.bridgeDetails ?? {};
  const baseZ = surfaceZ(0, model.bridgeY);
  const plateTop = baseZ + dims.sheet;
  const rearY = details.plateRearEdgeY ?? model.bridgeY - 2.0;
  const frontY = details.plateFrontEdgeY ?? rearY + dims.plateLength;
  const width = details.plateWidth ?? dims.plateWidth;
  const wallHeight = details.wallHeight ?? dims.wallHeight;
  const length = frontY - rearY;
  const centerY = (rearY + frontY) / 2;

  const parts = [
    details.plateOutline
      ? plate(details.plateOutline, dims.sheet, materials.hardware, [0, 0, baseZ])
      : plate(roundedRect(width, length, 0.6), dims.sheet, materials.hardware, [0, centerY, baseZ]),
    box(0.152, length - 0.6, wallHeight, materials.hardware, [-width / 2 + 0.076, centerY - 0.3, plateTop]),
    box(0.152, length - 0.6, wallHeight, materials.hardware, [width / 2 - 0.076, centerY - 0.3, plateTop]),
    box(width - 0.5, 0.152, wallHeight, materials.hardware, [0, rearY + 0.076, plateTop]),
    ...(details.mountingScrews ?? []).map((position) => screwHead(position, plateTop, materials.hardware, 0.28)),
  ];

  const barrels = details.saddles ?? [-1, 0, 1].map((pair, index) => ({
    center: [pair * 2.16, model.bridgeY + BARREL_STAGGER[index]], length: dims.saddleLength, diameter: dims.saddleDiameter,
  }));
  barrels.forEach(({ center, length: barrelLength, diameter }) => {
    const geometry = new THREE.CylinderGeometry(diameter / 2, diameter / 2, barrelLength, 18);
    geometry.rotateZ(Math.PI / 2);
    const barrel = mesh(geometry, materials.hardware);
    barrel.position.set(center[0], center[1], saddleTopZ - diameter / 2);
    parts.push(barrel);
  });

  const saddles = spread.map(({ bridgeX }, index) => [bridgeX, barrels[Math.min(barrels.length - 1, Math.floor(index / 2))].center[1] + 0.35, saddleTopZ]);
  const holes = details.stringThroughHoles;
  const tails = spread.map(({ bridgeX }, index) => (holes?.[index] ? [holes[index][0], holes[index][1], plateTop] : [bridgeX, rearY + 0.9, plateTop]));
  return { object: group('brug-telecaster', parts), saddles, tails };
}

/** Hoek en midden van een lijn door twee punten (brugposts of studs). */
function lineThrough([[x1, y1], [x2, y2]]) {
  return { center: [(x1 + x2) / 2, (y1 + y2) / 2], angle: Math.atan2(y2 - y1, x2 - x1) };
}

/** ABR-1 (of PRS-tweedelige brug): balk met afgeronde uiteinden op twee posts met stelwielen. */
function tuneOMaticBar({ model, surfaceZ, saddleTopZ, spread, materials }, dims) {
  const details = model.bridgeDetails ?? {};
  const posts = details.bridgePosts ?? details.abr1PostCenters ?? [[-dims.postSpacing / 2, model.bridgeY], [dims.postSpacing / 2, model.bridgeY]];
  const { center, angle } = lineThrough(posts);
  const baseZ = surfaceZ(...center);
  const barTop = saddleTopZ - 0.2;
  const barBottom = barTop - dims.height + 0.2;

  const bar = group('brugbalk', [
    plate(roundedRect(dims.length, dims.width, dims.width / 2 - 0.01), barTop - barBottom, materials.hardware, [0, 0, barBottom]),
    ...spread.map(({ bridgeX }) => box(dims.saddleWidth ?? 0.75, dims.saddleLength ?? 0.65, 0.2, materials.hardware, [bridgeX / Math.cos(angle), -0.05, barTop])),
  ]);
  bar.position.set(center[0], center[1], 0);
  bar.rotation.z = angle;

  const parts = [bar];
  posts.forEach(([x, y]) => {
    parts.push(post(0.351, Math.max(0.1, barBottom - baseZ), materials.hardware, [x, y, baseZ]));
    if (dims.thumbwheelDiameter) {
      const wheel = mesh(latheAlongZ([[0, 0], [dims.thumbwheelDiameter / 2, 0], [dims.thumbwheelDiameter / 2, dims.thumbwheelThickness], [0, dims.thumbwheelThickness]], 24), materials.hardware);
      wheel.position.set(x, y, barBottom - dims.thumbwheelThickness - 0.05);
      parts.push(wheel);
    }
  });
  const saddles = spread.map(({ bridgeX }) => [bridgeX, center[1] + Math.tan(angle) * bridgeX, saddleTopZ]);
  return { parts, saddles };
}

/** Stopbar: D-vormige gegoten staaf op twee studs. */
function stopbar({ model, surfaceZ, spread, materials }, dims) {
  const studs = tailpieceStuds(model);
  const { center, angle } = lineThrough(studs);
  const stopY = center[1];
  const baseZ = Math.max(surfaceZ(...studs[0]), surfaceZ(...studs[1]));
  const barBottom = baseZ + 0.45;

  const profile = new THREE.Shape();
  profile.moveTo(-dims.depth / 2, 0);
  profile.lineTo(dims.depth / 2, 0);
  profile.lineTo(dims.depth / 2, dims.height * 0.45);
  profile.absarc(0, dims.height * 0.45, dims.depth / 2, 0, Math.PI, false);
  profile.lineTo(-dims.depth / 2, 0);
  const geometry = new THREE.ExtrudeGeometry(profile, { depth: dims.length, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.08, bevelSegments: 3, curveSegments: 12 });
  geometry.translate(0, 0, -dims.length / 2);
  // Profiel (x = langs de snaren, y = omhoog) extruderen over de lengte en naar body-assen draaien.
  geometry.rotateY(Math.PI / 2);
  geometry.rotateX(Math.PI / 2);
  const bar = mesh(geometry, materials.hardware);
  bar.position.set(center[0], stopY, barBottom);
  bar.rotation.z = angle;

  const parts = [bar, ...studs.map(([x, y]) => post(dims.studDiameter ?? 1.13, barBottom - baseZ + 0.2, materials.hardware, [x, y, baseZ]))];
  const tails = spread.map(({ bridgeX }) => [bridgeX * 0.95, stopY + Math.tan(angle) * bridgeX + dims.depth / 2, barBottom + dims.height * 0.75]);
  return { parts, tails };
}

function buildTuneOMatic(context) {
  const isPrs = context.model.bridgeHardware === 'prsTwoPiece';
  const bridgeDims = isPrs ? { ...BRIDGES.prsTwoPiece, thumbwheelDiameter: 1.5, thumbwheelThickness: 0.3 } : BRIDGES.abr1;
  const tailDims = isPrs
    ? { length: BRIDGES.prsTwoPiece.tailLength, depth: BRIDGES.prsTwoPiece.tailDepth, height: BRIDGES.prsTwoPiece.tailHeight, studDiameter: 1.1 }
    : BRIDGES.stopbar;
  const bridge = tuneOMaticBar(context, bridgeDims);
  const tail = stopbar(context, tailDims);
  return { object: group('brug-tune-o-matic', [...bridge.parts, ...tail.parts]), saddles: bridge.saddles, tails: tail.tails };
}

function buildOffsetVibrato(context) {
  const { model, surfaceZ, spread, materials } = context;
  const details = model.bridgeDetails ?? {};
  const dims = BRIDGES.jazzmaster;
  const body = details.bridgeBody ?? { size: [dims.baseLength, dims.baseWidth] };
  const bridge = tuneOMaticBar(context, { length: body.size[0], width: body.size[1] * 0.6, height: dims.height, postSpacing: dims.postSpacing, saddleWidth: 0.64, saddleLength: 0.95 });

  const vibrato = details.vibratoPlate;
  const plateCenter = vibrato?.center ?? [0, model.bridgeY - 9.1];
  const baseZ = surfaceZ(...plateCenter);
  const parts = [...bridge.parts];
  if (vibrato?.outline) {
    parts.push(plate(vibrato.outline, 0.18, materials.hardware, [0, 0, baseZ]));
  } else {
    parts.push(plate(roundedRect(dims.plateWidth, dims.plateLength, 1.6), 0.18, materials.hardware, [plateCenter[0], plateCenter[1], baseZ]));
  }
  if (details.vibratoInnerPlate?.outline) parts.push(plate(details.vibratoInnerPlate.outline, 0.35, materials.hardware, [0, 0, baseZ + 0.18]));
  if (details.vibratoLockButton) {
    const button = mesh(latheAlongZ([[0, 0], [details.vibratoLockButton.diameter / 2, 0], [details.vibratoLockButton.diameter / 2, 0.3], [0, 0.35]], 20), materials.hardware);
    button.position.set(...details.vibratoLockButton.position, baseZ + 0.53);
    parts.push(button);
  }
  (details.vibratoMountingScrews ?? []).forEach((position) => parts.push(screwHead(position, baseZ + 0.18, materials.hardware, 0.28)));
  const socket = details.vibratoArmSocket?.position ?? [plateCenter[0] + 2.2, plateCenter[1] + 1.7];
  parts.push(...tremoloArm([socket[0], socket[1], baseZ + 0.53], { ...BRIDGES.stratTremolo, armLength: 15 }, materials));

  const anchor = details.stringAnchorSlot?.center ?? [plateCenter[0], plateCenter[1] - 3.4];
  const tails = spread.map(({ bridgeX }) => [bridgeX * 0.9, anchor[1] + 0.3, baseZ + 0.55]);
  return { object: group('brug-offset-vibrato', parts), saddles: bridge.saddles, tails };
}

const BUILDERS = Object.freeze({
  tremolo: buildTremolo,
  ashtray: buildAshtray,
  tuneomatic: buildTuneOMatic,
  'offset-vibrato': buildOffsetVibrato,
});

/** Bouwt de brug en geeft zadel- en eindpunten van de snaren terug. */
export function buildBridge(context) {
  const builder = BUILDERS[context.model.bridge];
  if (!builder) throw new Error(`Onbekend brugtype: ${context.model.bridge}`);
  return builder(context);
}
