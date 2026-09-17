import { describe, expect, it } from 'vitest';
import { arcInside, controlsFrom, headstockFrom, modelFromReference, pickupAnglesFrom, pickupSlotsFrom } from './fromReference.js';
import { MODELS } from './index.js';
import { distanceToEdge, pointInPolygon } from '../../geometry/polygon.js';

const square = [[-10, 0], [10, 0], [10, 40], [-10, 40]];

const reference = {
  id: 'test',
  scaleLength: 64.77,
  fretCount: 21,
  nutWidth: 4.19,
  fretboardWidthAtLastFret: 5.55,
  fretboardRadius: 18.4,
  neck: { joint: 'bolt', fretboardEndY: 30, depthAt1stFret: 2.1, depthAt12thFret: 2.4 },
  bridge: { saddleLineY: 10, details: { pivotScrewLineY: 10.6 } },
  body: {
    outline: square,
    thickness: 4.45,
    edgeRadius: 0.6,
    contours: [
      { face: 'front', boundaryLine: [[-10, 5], [0, 0]], depth: 1 },
      { face: 'back', boundaryArc: { center: [-20, 20], radius: 14 }, depth: 1 },
      { face: 'back', region: 'alleen tekst' },
    ],
    bevels: [{ face: 'front', innerEdge: [[9, 0], [9, 40]], depth: 0.8 }],
  },
  pickups: [
    { slot: 'neck', type: 'single', center: [0, 26] },
    { slot: 'bridge', type: 'single', center: [0, 14], angleDeg: -10 },
  ],
  controls: {
    knobs: [[5, 5]],
    switch: { type: 'blade', position: [6, 8], angleDeg: 90 },
    controlPlate: { outline: [[4, 2], [8, 2], [8, 9], [4, 9]] },
    jack: { position: [9, 3], on: 'front' },
  },
  pickguard: { outline: square, cutouts: [{ outline: [[-1, 25], [1, 25], [1, 27], [-1, 27]] }], screwHoles: [[1, 1]] },
  strapButtons: [[0, 0]],
  headstock: { outline: [[-3, 0], [3, 0], [3, 18], [-3, 18]], posts: [[-2, 4], [-2, 6], [-2, 8], [-2, 10], [-2, 12], [-2, 14]], stringTree: [1, 7] },
};

describe('fromReference', () => {
  it('rekent elementposities om naar afstanden vanaf het zadel', () => {
    expect(pickupSlotsFrom(reference)).toEqual({ neck: 16, middle: 10, bridge: 4 });
    expect(() => pickupSlotsFrom({ ...reference, pickups: [] })).toThrow();
  });

  it('bewaart alleen schuine elementen met hun soort', () => {
    const angles = pickupAnglesFrom(reference);
    expect(Object.keys(angles)).toEqual(['bridge']);
    expect(angles.bridge.type).toBe('single');
    expect(angles.bridge.angle).toBeCloseTo((-10 * Math.PI) / 180);
    expect(pickupAnglesFrom({ ...reference, pickups: [{ slot: 'neck', type: 'Gibson humbucker', angleDeg: 5 }] }).neck.type).toBe('humbucker');
  });

  it('neemt de kop over met standaardwaarden per merk', () => {
    const headstock = headstockFrom(reference, 'gibson');
    expect(headstock.angleDeg).toBe(17);
    expect(headstock.keySide).toBe(-1);
    expect(headstock.stringTrees).toEqual([[1, 7]]);
  });

  it('zet een blade-sleufrichting om naar een draaiing', () => {
    const controls = controlsFrom(reference);
    expect(controls.switch.angle).toBeCloseTo(0);
    expect(controls.plates).toHaveLength(1);
    expect(controls.jack.on).toBe('front');
  });

  it('knipt een cirkelboog af op de contour', () => {
    const arc = arcInside({ center: [-20, 20], radius: 14 }, square);
    expect(arc.length).toBeGreaterThan(5);
    arc.forEach((point) => expect(pointInPolygon(point, square)).toBe(true));
    expect(arcInside({ center: [100, 100], radius: 1 }, square)).toEqual([]);
  });

  it('bouwt een volledig model met contouren, afschuiningen en slagplaat', () => {
    const model = modelFromReference(reference, { id: 'test', label: 'Test', brand: 'fender', headstockOverrides: { thickness: 1.2 }, pickguardRaised: true });
    expect(model.body.contours).toHaveLength(2);
    expect(model.body.bevels[0].profile).toBe('flat');
    expect(model.pickguard.raised).toBe(true);
    expect(model.pickguard.holes).toHaveLength(1);
    expect(model.headstock.thickness).toBe(1.2);
    expect(model.bridgeDetails.pivotScrewLineY).toBe(10.6);
    expect(model.stringSpacing.nut).toBeGreaterThan(3);
  });
});

describe('alle modellen', () => {
  it.each(MODELS.map((model) => [model.id, model]))('%s heeft stemassen binnen de kop', (_id, model) => {
    const { headstock } = model;
    expect(headstock.posts).toHaveLength(6);
    headstock.posts.forEach((post) => {
      expect(pointInPolygon(post, headstock.outline), `as ${post}`).toBe(true);
      expect(distanceToEdge(post, headstock.outline), `as ${post}`).toBeGreaterThan(0.3);
    });
  });
});
