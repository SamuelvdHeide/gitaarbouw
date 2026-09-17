import * as THREE from 'three';
import { distanceToEdge, pointInPolygon, roundedRect } from '../../geometry/polygon.js';
import { extrudePolygon, group, latheAlongZ, mesh } from '../../scene/threeHelpers.js';

const Z_AXIS = new THREE.Vector3(0, 0, 1);

/** Halsplaat met vier schroeven op de rug (alleen bij een geschroefde hals). */
function neckPlate(model, layout, materials) {
  const [centerX, centerY] = model.neckPlate?.center ?? [0, layout.fretboardEndY + 3.6];
  const [width, length] = model.neckPlate?.size ?? [5.08, 6.4];
  const plate = mesh(extrudePolygon(roundedRect(width, length, 0.6), { depth: 0.12, bevel: 0.04 }), materials.hardware);
  plate.position.set(centerX, centerY, -0.12);
  const screws = [[-1.8, -2.3], [1.8, -2.3], [-1.8, 2.3], [1.8, 2.3]].map(([x, y]) => {
    const screw = mesh(latheAlongZ([[0, 0], [0.32, 0], [0.28, 0.08], [0, 0.12]], 16), materials.hardware, { castShadow: false });
    screw.rotation.x = Math.PI;
    screw.position.set(centerX + x, centerY + y, -0.12);
    return screw;
  });
  return [plate, ...screws];
}

function strapButton([x, y], { bounds, thickness, outline }, materials) {
  // Knoppen die ver binnen de contour liggen (SG: op de halshiel) zitten op de rug.
  if (distanceToEdge([x, y], outline) > 1.5 && pointInPolygon([x, y], outline)) {
    const button = mesh(latheAlongZ([[0, 0], [0.62, 0], [0.62, 0.12], [0.26, 0.16], [0.26, 0.5], [0.55, 0.55], [0.5, 0.8], [0, 0.82]], 20), materials.hardware);
    button.rotation.x = Math.PI;
    button.position.set(x, y, 0);
    return button;
  }
  const center = new THREE.Vector3(bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2, 0);
  const outward = new THREE.Vector3(x, y, 0).sub(center).normalize();
  const button = mesh(latheAlongZ([[0, 0], [0.62, 0], [0.62, 0.12], [0.26, 0.16], [0.26, 0.5], [0.55, 0.55], [0.5, 0.8], [0, 0.82]], 20), materials.hardware);
  button.quaternion.setFromUnitVectors(Z_AXIS, outward);
  button.position.set(x - outward.x * 0.1, y - outward.y * 0.1, thickness / 2);
  return button;
}

export function buildExtras({ model, layout, materials }) {
  const parts = model.strapButtons.map((position) =>
    strapButton(position, { bounds: layout.bounds, thickness: model.body.thickness, outline: layout.outline }, materials));
  if (model.neckJoint === 'bolt') parts.push(...neckPlate(model, layout, materials));
  return group('extra', parts);
}
