import * as THREE from 'three';
import { getModel } from '../data/models/index.js';
import { disposeObject, group } from '../scene/threeHelpers.js';
import { computeLayout, stringSpread } from './layout.js';
import { getBodyField, getBodyHeights } from './bodyField.js';
import { createMaterialKit } from './materials.js';
import { createTextureFactory } from './textureFactory.js';
import { buildBody } from './parts/body.js';
import { buildNeck, FRETBOARD_THICKNESS } from './parts/neck.js';
import { buildHeadstock } from './parts/headstock.js';
import { buildBridge } from './parts/bridges.js';
import { buildPickups } from './parts/pickups.js';
import { buildControls } from './parts/controls.js';
import { buildPickguard } from './parts/pickguard.js';
import { buildStrings } from './parts/strings.js';
import { buildExtras } from './parts/extras.js';

const SADDLE_ABOVE_FRETBOARD = 0.32;
const STRING_ABOVE_NUT = 0.16;

function stringXAtFactory(model, layout, spread) {
  return (y) => spread.map(({ nutX, bridgeX }) => {
    const t = (y - model.bridgeY) / (layout.nutY - model.bridgeY);
    return bridgeX + (nutX - bridgeX) * t;
  });
}

/**
 * Bouwt de volledige gitaar voor een ontwerp. De gitaar ligt met de hals
 * naar rechts (+x), het voorblad naar de kijker (+z) en is gecentreerd.
 */
export function buildGuitar(design, textureCache) {
  const model = getModel(design.model);
  const layout = computeLayout(model);
  const bodyField = getBodyField(model);
  const heights = getBodyHeights(model, layout);
  const surfaceZ = heights.front;
  const textures = createTextureFactory({ cache: textureCache, model, bounds: layout.bounds, bodyField });
  const materials = createMaterialKit({ design, model, body: layout.body, textures });
  const spread = stringSpread(model);

  // Toetshoogte geldt bij de halsverbinding; een halshoek kantelt de hals daaromheen naar achteren.
  const neckAngle = THREE.MathUtils.degToRad(model.neckAngleDeg ?? 0);
  const pivotY = layout.fretboardEndY;
  const fretboardTopZ = layout.body.thickness + model.fretboardTopAboveRim;
  const saddleTopZ = fretboardTopZ + Math.tan(neckAngle) * (pivotY - model.bridgeY) + SADDLE_ABOVE_FRETBOARD;
  const heelBottomZ = heights.back(0, layout.bodyEdgeY - 1) + 0.7;
  const context = { model, layout, materials, surfaceZ, heights, design, fretboardTopZ, saddleTopZ, spread, heelBottomZ };

  const pickguard = buildPickguard(context);
  const headstock = buildHeadstock({ ...context, neckTopZ: fretboardTopZ - FRETBOARD_THICKNESS });
  const bridge = buildBridge(context);

  const neckInner = group('hals-lokaal', [buildNeck(context), headstock.object]);
  neckInner.position.set(0, -pivotY, -fretboardTopZ);
  const neckPivot = group('hals-en-kop', [neckInner]);
  neckPivot.position.set(0, pivotY, fretboardTopZ);
  neckPivot.rotation.x = -neckAngle;
  neckPivot.updateMatrixWorld(true);
  const toBodySpace = (point) => new THREE.Vector3(...point).applyMatrix4(neckInner.matrixWorld).toArray();

  const nutPoints = spread.map(({ nutX }) => toBodySpace([nutX, layout.nutY + 0.1, fretboardTopZ + STRING_ABOVE_NUT]));
  const postTops = headstock.postTops.map(toBodySpace);
  const nutZ = nutPoints[0][2];
  const stringZAt = (y) => saddleTopZ + ((nutZ - saddleTopZ) * (y - model.bridgeY)) / (layout.nutY - model.bridgeY);

  const guitar = group('gitaar-model', [
    buildBody(context),
    neckPivot,
    bridge.object,
    buildPickups({ ...context, pickguard, stringXAt: stringXAtFactory(model, layout, spread), stringZAt }),
    buildControls({ ...context, pickguard }),
    buildStrings({ tails: bridge.tails, saddles: bridge.saddles, nutPoints, postTops, material: materials.strings }),
    buildExtras(context),
    ...(pickguard ? [pickguard.object] : []),
  ]);
  guitar.rotation.z = -Math.PI / 2;

  const root = group('gitaar', [guitar]);
  root.updateMatrixWorld(true);
  const center = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
  guitar.position.sub(center);
  root.updateMatrixWorld(true);

  return Object.freeze({
    object: root,
    model,
    layout,
    textureKeys: textures.usedKeys(),
    dispose: () => disposeObject(root),
  });
}
