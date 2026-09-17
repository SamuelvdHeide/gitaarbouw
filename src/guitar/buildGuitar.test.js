import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { MODELS } from '../data/models/index.js';
import { DESIGN_FIELDS, classicDesign, updateDesign } from '../state/design.js';
import { buildGuitar } from './buildGuitar.js';

// Rooktest zonder WebGL of canvas: texturen komen uit een stub-cache.
const stubCache = { get: (key, _factory, usedKeys) => { usedKeys?.add(key); return new THREE.Texture(); } };

const OPTION_FIELDS = Object.entries(DESIGN_FIELDS).filter(([field, values]) => field !== 'model' && Array.isArray(values));

function meshCount(object) {
  let count = 0;
  object.traverse((node) => { if (node.isMesh) count += 1; });
  return count;
}

/** Namen van onderdelen met ongeldige (NaN/oneindige) coördinaten. */
function invalidParts(object) {
  const invalid = [];
  object.traverse((node) => {
    const positionOk = [node.position.x, node.position.y, node.position.z].every(Number.isFinite);
    const geometryOk = !node.isMesh || node.geometry.attributes.position.array.every(Number.isFinite);
    if (!positionOk || !geometryOk) invalid.push(node.parent?.name ?? node.name);
  });
  return invalid;
}

describe('buildGuitar', () => {
  it.each(MODELS.map((model) => [model.id]))('bouwt %s met elke losse optie', (modelId) => {
    const base = classicDesign(modelId);
    OPTION_FIELDS.forEach(([field, values]) => {
      values.forEach((value) => {
        const built = buildGuitar(updateDesign(base, field, value), stubCache);
        expect(meshCount(built.object), `${field}=${value}`).toBeGreaterThan(60);
        expect(invalidParts(built.object), `${field}=${value}`).toEqual([]);
        built.dispose();
      });
    });
  }, 120000);

  it('bouwt elke afwerking met een eigen kleur', () => {
    ['natural', 'transparent', 'solid', 'burst'].forEach((finishType) => {
      const design = updateDesign(updateDesign(classicDesign('lespaul'), 'finishType', finishType), 'solidColor', '#123456');
      expect(() => buildGuitar(design, stubCache).dispose()).not.toThrow();
    });
  });

  it('centreert de gitaar en meldt gebruikte texturen', () => {
    const built = buildGuitar(classicDesign('strat'), stubCache);
    const center = new THREE.Box3().setFromObject(built.object).getCenter(new THREE.Vector3());
    expect(center.length()).toBeLessThan(0.01);
    expect(built.textureKeys.length).toBeGreaterThan(2);
    expect(built.object.getObjectByName('kop-groep')).toBeDefined();
    built.dispose();
  });
});

describe('halsconstructie', () => {
  it('kantelt een gelijmde Gibson-hals naar achteren', () => {
    const model = { ...classicDesign('lespaul') };
    const built = buildGuitar(model, stubCache);
    const pivot = built.object.getObjectByName('hals-en-kop');
    expect(pivot.rotation.x).toBeLessThanOrEqual(0);
    built.dispose();
  });
});
