import * as THREE from 'three';
import { pointInPolygon, roundedRect } from '../../geometry/polygon.js';
import { SWITCHES } from '../../data/hardware.js';
import { extrudePolygon, group, latheAlongZ, mesh } from '../../scene/threeHelpers.js';
import { KNOB_PROFILES } from '../../data/knobProfiles.js';

function applyFlutes(geometry, { count, depth, from, to }) {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const radius = Math.hypot(x, z);
    if (y < from || y > to || radius < 0.2) continue;
    const groove = Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(z, x) * count), 6);
    const scale = 1 - (depth * groove) / radius;
    position.setXYZ(i, x * scale, y, z * scale);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function knobGeometry(styleId) {
  const style = KNOB_PROFILES[styleId];
  if (!style) throw new Error(`Onbekende knopstijl: ${styleId}`);
  const segments = style.flutes ? Math.max(64, style.flutes.count * 4) : 64;
  const geometry = new THREE.LatheGeometry(style.profile.map(([r, h]) => new THREE.Vector2(r, h)), segments);
  if (style.flutes) applyFlutes(geometry, style.flutes);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

function knob(styleId, materials) {
  const parts = [mesh(knobGeometry(styleId), materials.knob)];
  const insert = KNOB_PROFILES[styleId].insert;
  if (insert) {
    const cap = mesh(latheAlongZ([[0, 0], [insert.radius, 0], [insert.radius, 0.05], [0, 0.06]], 32), materials.knobInsert);
    cap.position.z = insert.z;
    parts.push(cap);
  }
  return group(`knop-${styleId}`, parts);
}

function bladeSwitch(materials) {
  const dims = SWITCHES.blade;
  const slot = mesh(new THREE.BoxGeometry(dims.slotWidth, dims.slotLength, 0.04), materials.blackPlastic, { castShadow: false });
  slot.position.z = 0.02;
  const lever = mesh(new THREE.BoxGeometry(0.125, 0.48, dims.leverAbove), materials.hardware);
  lever.position.z = dims.leverAbove / 2;
  lever.rotation.x = 0.17;
  const tipGeometry = new THREE.CapsuleGeometry(dims.tipThickness / 2, dims.tipWidth - dims.tipThickness, 4, 12);
  tipGeometry.scale(1, 1, dims.tipHeight / dims.tipWidth);
  const tip = mesh(tipGeometry, materials.knob);
  tip.position.set(0, 0.12, dims.leverAbove + 0.25);
  return [slot, lever, tip];
}

function toggleSwitch(materials) {
  const dims = SWITCHES.toggle;
  const washer = mesh(latheAlongZ([[0, 0], [dims.washerDiameter / 2, 0], [dims.washerDiameter / 2, dims.washerThickness], [0, dims.washerThickness]], 40), materials.creamPlastic);
  const nut = mesh(latheAlongZ([[0, 0], [dims.nutDiameter / 2, 0], [dims.nutDiameter / 2, dims.nutHeight], [0.45, dims.nutHeight + 0.05], [0, dims.nutHeight + 0.05]], 24), materials.hardware);
  const leverTop = new THREE.Vector3(0, 0.45, dims.nutHeight + dims.leverLength);
  const leverGeometry = new THREE.CylinderGeometry(dims.leverDiameter / 2 - 0.04, dims.leverDiameter / 2, dims.leverLength, 10);
  leverGeometry.rotateX(Math.PI / 2);
  const lever = mesh(leverGeometry, materials.hardware);
  lever.position.set(0, leverTop.y / 2, dims.nutHeight + dims.leverLength / 2);
  lever.rotation.x = -0.35;
  const tip = mesh(latheAlongZ([[0, 0], [0.32, 0], [dims.tipDiameter / 2, dims.tipLength * 0.55], [0.4, dims.tipLength * 0.9], [0.2, dims.tipLength], [0, dims.tipLength]], 18), materials.knob);
  tip.position.copy(leverTop);
  tip.rotation.x = -0.35;
  return [washer, nut, lever, tip];
}

function sliderSwitch(materials, [width, depth] = [1.2, 0.57]) {
  const slot = mesh(new THREE.BoxGeometry(width, depth, 0.03), materials.blackPlastic, { castShadow: false });
  const tab = mesh(new THREE.BoxGeometry(0.42, depth * 0.8, 0.45), materials.knob);
  tab.position.set(width * 0.2, 0, 0.22);
  return [slot, tab];
}

/** Metalen plaat met de vorm uit de mal (Tele-bedieningsplaat, Jazzmaster-rhythmplaat). */
function outlinePlate(outline, baseZ, materials) {
  const plate = mesh(extrudePolygon(outline, { depth: 0.15, bevel: 0.04 }), materials.hardware);
  plate.position.z = baseZ;
  return plate;
}

function roller({ position: [x, y], diameter, thickness }, baseZ, materials) {
  const geometry = new THREE.CylinderGeometry(diameter / 2, diameter / 2, thickness, 32);
  geometry.rotateZ(Math.PI / 2);
  const wheel = mesh(geometry, materials.knob);
  wheel.position.set(x, y, baseZ + 0.35 - diameter / 2);
  return wheel;
}

const Z_AXIS = new THREE.Vector3(0, 0, 1);

/** Langwerpige 'boat'-jackplaat uit gemeten lengte, breedte en richting. */
function boatOutline({ position: [x, y], plateSize: [length, width], plateAngleDeg = 0 }) {
  const angle = THREE.MathUtils.degToRad(plateAngleDeg);
  return Array.from({ length: 40 }, (_, index) => {
    const t = (index / 40) * Math.PI * 2;
    const along = Math.cos(t) * (length / 2);
    const across = Math.sin(t) * (width / 2) * (0.55 + 0.45 * Math.abs(Math.sin(t)));
    return [x + along * Math.cos(angle) - across * Math.sin(angle), y + along * Math.sin(angle) + across * Math.cos(angle)];
  });
}

/**
 * Jack: op de voorkant met de gemeten plaat (Strat) of een moer, of in de zijkant
 * als cilinder met plaatje, naar buiten gericht.
 */
function jack(spec, { materials, heights, layout }, baseZ) {
  const [x, y] = spec.position;
  if (spec.on !== 'edge') {
    const parts = [];
    const outline = spec.plateOutline ?? (spec.plateSize ? boatOutline(spec) : null);
    if (outline) parts.push(outlinePlate(outline, baseZ, materials));
    const socket = mesh(latheAlongZ([[0, 0], [0.65, 0], [0.65, 0.18], [0.42, 0.24], [0.3, 0.24], [0.3, 0.1], [0, 0.1]], 20), materials.hardware);
    socket.position.set(x, y, baseZ + (outline ? 0.12 : 0));
    parts.push(socket);
    return parts;
  }
  const { minX, minY, width, height } = layout.bounds;
  const angle = spec.axisAngleDeg !== undefined
    ? THREE.MathUtils.degToRad(spec.axisAngleDeg)
    : Math.atan2(y - (minY + height / 2), x - (minX + width / 2));
  const outward = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
  const zCenter = (heights.front(x - outward.x, y - outward.y) + heights.back(x - outward.x, y - outward.y)) / 2;
  const plateMesh = mesh(extrudePolygon(roundedRect(2.6, 1.6, 0.3), { depth: 0.12, bevel: 0.03 }), materials.hardware);
  plateMesh.quaternion.setFromUnitVectors(Z_AXIS, outward);
  plateMesh.position.set(x, y, zCenter);
  const barrel = mesh(latheAlongZ([[0, 0], [0.55, 0], [0.55, 0.35], [0.35, 0.4], [0, 0.4]], 18), materials.hardware);
  barrel.quaternion.setFromUnitVectors(Z_AXIS, outward);
  barrel.position.set(x + outward.x * 0.1, y + outward.y * 0.1, zCenter);
  return [plateMesh, barrel];
}

/** Knoppen, schakelaars, platen en jack op de posities uit de mal. */
export function buildControls({ model, design, materials, surfaceZ, pickguard, heights, layout }) {
  const { knobs, switch: switchSpec, plates = [], rollers = [], sliders = [], jack: jackSpec } = model.controls;
  const onPickguard = ([x, y]) => Boolean(pickguard && pointInPolygon([x, y], pickguard.outline)
    && !pickguard.holes.some((hole) => pointInPolygon([x, y], hole)));
  const plateContaining = ([x, y]) => plates.find(({ outline }) => pointInPolygon([x, y], outline));

  // Platen liggen in een uitsparing van de slagplaat, maar op dezelfde hoogte als de plaat.
  const plateBase = (outline) => {
    const [cx, cy] = outline.reduce(([sx, sy], [x, y]) => [sx + x / outline.length, sy + y / outline.length], [0, 0]);
    return onPickguard([cx, cy]) ? pickguard.topZ - 0.1 : surfaceZ(cx, cy) + 0.005;
  };

  const baseZFor = (point) => {
    const containing = plateContaining(point);
    if (containing) return plateBase(containing.outline) + 0.15;
    if (onPickguard(point)) return pickguard.topZ;
    return surfaceZ(...point);
  };

  const parts = [
    ...plates.map(({ outline }) => outlinePlate(outline, plateBase(outline), materials)),
    ...rollers.map((spec) => roller(spec, baseZFor(spec.position), materials)),
    ...sliders.map(({ position, size }) => {
      const slider = group('schuifschakelaar', sliderSwitch(materials, size));
      slider.position.set(position[0], position[1], baseZFor(position));
      return slider;
    }),
    ...(jackSpec ? jack(jackSpec, { materials, heights, layout }, baseZFor(jackSpec.position)) : []),
  ];

  knobs.forEach((position) => {
    const knobGroup = knob(design.knobStyle, materials);
    knobGroup.position.set(position[0], position[1], baseZFor(position));
    parts.push(knobGroup);
  });

  const builders = { toggle: toggleSwitch, slider: (m) => sliderSwitch(m), blade: bladeSwitch };
  const switchGroup = group('schakelaar', (builders[switchSpec.type] ?? bladeSwitch)(materials));
  switchGroup.position.set(switchSpec.position[0], switchSpec.position[1], baseZFor(switchSpec.position));
  switchGroup.rotation.z = switchSpec.angle ?? 0;
  parts.push(switchGroup);

  return group('bediening', parts);
}
