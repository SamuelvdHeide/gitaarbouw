import * as THREE from 'three';
import { TUNERS } from '../../data/hardware.js';
import { boundsOf, horizontalExtent } from '../../geometry/polygon.js';
import { applyPlanarUVs, cylinderBetween, extrudePolygon, group, latheAlongZ, mesh } from '../../scene/threeHelpers.js';
import { NECK_TEXTURE_SIZE } from '../materials.js';

const TUNER_BY_BRAND = Object.freeze({ fender: 'kluson', gibson: 'kluson3', prs: 'prs' });
const STRING_WRAP_HEIGHT = 0.55;

/** Stemmechaniek: bus en as op de voorkant, behuizing met knop op de achterkant. */
function tuner({ post: [px, py], direction, edgeDistance, thickness, dims, materials }) {
  const backZ = -thickness - dims.housingHeight / 2;
  const bushing = mesh(latheAlongZ([[0, 0], [dims.bushingDiameter / 2, 0], [dims.bushingDiameter / 2, 0.1], [dims.postDiameter / 2 + 0.05, 0.14], [0, 0.14]], 20), materials.hardware);
  bushing.position.set(px, py, 0);

  const post = mesh(latheAlongZ([[0, 0], [dims.postDiameter / 2, 0], [dims.postDiameter / 2, dims.postHeight - 0.05], [dims.postDiameter / 2 - 0.05, dims.postHeight], [0, dims.postHeight]], 16), materials.hardware);
  post.position.set(px, py, 0.1);

  const housing = mesh(new THREE.BoxGeometry(dims.housingLength, dims.housingWidth, dims.housingHeight), materials.hardware);
  housing.position.set(px + direction * (dims.housingLength / 2 - dims.postDiameter), py, backZ);

  const buttonOffset = Math.max(dims.housingLength / 2 + dims.buttonReach * 0.7, edgeDistance + dims.buttonWidth / 2 + 0.35);
  const buttonX = px + direction * buttonOffset;
  const shaft = cylinderBetween([px, py, backZ], [buttonX, py, backZ], 0.27, materials.hardware, 12);

  const buttonGeometry = new THREE.CylinderGeometry(0.5, 0.5, dims.buttonThickness, 24);
  buttonGeometry.scale(dims.buttonWidth, 1, dims.buttonHeight);
  const button = mesh(buttonGeometry, materials.hardware);
  button.position.set(buttonX, py, backZ);
  return [bushing, post, housing, shaft, button];
}

function stringTree([x, y], materials) {
  const spacer = mesh(latheAlongZ([[0, 0], [0.22, 0], [0.22, 0.45], [0, 0.45]], 12), materials.hardware);
  spacer.position.set(x, y, 0);
  const wing = mesh(new THREE.BoxGeometry(1.4, 0.45, 0.12), materials.hardware);
  wing.position.set(x, y, 0.5);
  return [spacer, wing];
}

/**
 * Bouwt de kop met stemmechanieken in hals-coördinaten. Geeft ook de posities
 * van de stemassen terug zodat de snaren er precies naartoe lopen.
 */
export function buildHeadstock({ model, layout, materials, fretboardTopZ, design }) {
  const { headstock } = model;
  if (!headstock?.outline || headstock.posts?.length !== 6) throw new Error(`Model ${model.id} mist een kop met zes stemassen`);
  const dims = TUNERS[model.tuner ?? TUNER_BY_BRAND[model.brand]] ?? TUNERS.kluson;
  const angle = THREE.MathUtils.degToRad(headstock.angleDeg);
  const faceZ = fretboardTopZ - headstock.faceOffset;

  const pivot = new THREE.Group();
  pivot.name = 'kop';
  pivot.position.set(0, layout.nutY, faceZ);
  pivot.rotation.x = -angle;

  const plateGeometry = extrudePolygon(headstock.outline, { depth: headstock.thickness, bevel: 0.1, bevelSegments: 2 });
  plateGeometry.translate(0, 0, -headstock.thickness);
  const bounds = boundsOf(headstock.outline);
  applyPlanarUVs(plateGeometry, { minX: -NECK_TEXTURE_SIZE.widthCm / 2, minY: bounds.minY, width: NECK_TEXTURE_SIZE.widthCm, height: NECK_TEXTURE_SIZE.heightCm / 3 });
  pivot.add(mesh(plateGeometry, materials.headstockFace));

  headstock.posts.forEach((post) => {
    const [minX, maxX] = horizontalExtent(headstock.outline, post[1]) ?? [post[0] - 2, post[0] + 2];
    const direction = headstock.keySide === -1 || post[0] < 0 ? -1 : 1;
    const edgeDistance = direction < 0 ? post[0] - minX : maxX - post[0];
    tuner({ post, direction, edgeDistance, thickness: headstock.thickness, dims, materials }).forEach((part) => pivot.add(part));
  });
  headstock.stringTrees.forEach((position) => stringTree(position, materials).forEach((part) => pivot.add(part)));

  // Bij puur hout geen zwart kopfineer: het hout van de hals blijft zichtbaar.
  if (model.headstockFace === 'black' && design.finishType !== 'raw') {
    const veneer = mesh(extrudePolygon(headstock.outline, { depth: 0.05 }), materials.headstockVeneer);
    veneer.position.z = 0.002;
    pivot.add(veneer);
  }
  if (headstock.trussRodCover) {
    const cover = mesh(extrudePolygon(headstock.trussRodCover, { depth: 0.1 }), materials.blackPlastic);
    cover.position.z = 0.06;
    pivot.add(cover);
  }

  pivot.updateMatrix();
  const postTops = headstock.posts.map(([px, py]) =>
    new THREE.Vector3(px, py, 0.1 + STRING_WRAP_HEIGHT).applyMatrix4(pivot.matrix).toArray());

  // Overgang van hals naar (schuine of verlaagde) kop zodat er geen kier ontstaat.
  const neckTopZ = fretboardTopZ - 0.6;
  const bridgeDepth = Math.max(0.6, neckTopZ - faceZ + headstock.thickness + 0.4);
  const transition = mesh(new THREE.BoxGeometry(model.nutWidth * 0.98, 1.6, bridgeDepth), materials.neck);
  transition.position.set(0, layout.nutY + 0.6, neckTopZ - bridgeDepth / 2);

  return { object: group('kop-groep', [pivot, transition]), postTops };
}
