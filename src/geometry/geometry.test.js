import { describe, expect, it } from 'vitest';
import { sampleClosedCurve, sampleOpenCurve } from './spline.js';
import {
  boundsOf,
  distanceToEdge,
  horizontalExtent,
  pointInPolygon,
  pointsAlongPerimeter,
  roundedRect,
  signedArea,
  signedDistance,
  verticalExtent,
} from './polygon.js';
import { clamp, fretDistanceFromNut, fretPositions, lerp } from './fretMath.js';
import { createDistanceField } from './distanceField.js';

const square = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];

describe('sampleClosedCurve', () => {
  it('gaat door elk controlepunt', () => {
    const samples = sampleClosedCurve(square, 8);
    expect(samples).toHaveLength(32);
    square.forEach((point, index) => {
      expect(samples[index * 8][0]).toBeCloseTo(point[0], 6);
      expect(samples[index * 8][1]).toBeCloseTo(point[1], 6);
    });
  });

  it('weigert ongeldige invoer', () => {
    expect(() => sampleClosedCurve([[0, 0]])).toThrow();
    expect(() => sampleClosedCurve(square, 0)).toThrow();
  });

  it('kan omgaan met dubbele controlepunten', () => {
    const samples = sampleClosedCurve([[0, 0], [0, 0], [5, 5], [0, 5]], 4);
    expect(samples.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
  });
});

describe('sampleOpenCurve', () => {
  it('begint en eindigt op de uiterste punten', () => {
    const samples = sampleOpenCurve([[0, 0], [5, 2], [10, 0]], 6);
    expect(samples[0]).toEqual([0, 0]);
    expect(samples.at(-1)).toEqual([10, 0]);
    expect(samples).toHaveLength(13);
  });

  it('weigert te weinig punten', () => {
    expect(() => sampleOpenCurve([[0, 0]])).toThrow();
  });
});

describe('polygon', () => {
  it('berekent grenzen en oppervlakte', () => {
    expect(boundsOf(square)).toEqual({ minX: 0, minY: 0, maxX: 10, maxY: 10, width: 10, height: 10 });
    expect(signedArea(square)).toBe(100);
    expect(signedArea([...square].reverse())).toBe(-100);
  });

  it('herkent punten binnen en buiten', () => {
    expect(pointInPolygon([5, 5], square)).toBe(true);
    expect(pointInPolygon([15, 5], square)).toBe(false);
  });

  it('meet afstand tot de rand met teken', () => {
    expect(distanceToEdge([5, 2], square)).toBeCloseTo(2);
    expect(signedDistance([5, 2], square)).toBeCloseTo(2);
    expect(signedDistance([5, -3], square)).toBeCloseTo(-3);
  });

  it('geeft de verticale doorsnede', () => {
    expect(verticalExtent(square, 5)).toEqual([0, 10]);
    expect(verticalExtent(square, 50)).toBeNull();
  });

  it('geeft de horizontale doorsnede', () => {
    expect(horizontalExtent(square, 5)).toEqual([0, 10]);
    expect(horizontalExtent(square, 20)).toBeNull();
    expect(horizontalExtent(square, 0)).toEqual([0, 10]);
  });

  it('maakt een afgeronde rechthoek binnen de maten', () => {
    const rect = roundedRect(8, 4, 1);
    const b = boundsOf(rect);
    expect(b.width).toBeCloseTo(8);
    expect(b.height).toBeCloseTo(4);
  });

  it('plaatst punten naar binnen langs de omtrek', () => {
    const points = pointsAlongPerimeter(square, 8, 1);
    expect(points).toHaveLength(8);
    points.forEach((point) => {
      expect(pointInPolygon(point, square)).toBe(true);
      expect(distanceToEdge(point, square)).toBeCloseTo(1);
    });
    const clockwise = pointsAlongPerimeter([...square].reverse(), 4, 1);
    clockwise.forEach((point) => expect(pointInPolygon(point, square)).toBe(true));
  });
});

describe('fretMath', () => {
  it('plaatst de 12e fret op de helft van de schaal', () => {
    expect(fretDistanceFromNut(64.77, 12)).toBeCloseTo(32.385);
    expect(fretDistanceFromNut(62.87, 0)).toBe(0);
  });

  it('geeft oplopende posities', () => {
    const positions = fretPositions(64.77, 22);
    expect(positions).toHaveLength(22);
    positions.slice(1).forEach((value, index) => expect(value).toBeGreaterThan(positions[index]));
  });

  it('valideert invoer', () => {
    expect(() => fretDistanceFromNut(0, 1)).toThrow();
    expect(() => fretDistanceFromNut(64, -1)).toThrow();
  });

  it('heeft werkende lerp en clamp', () => {
    expect(lerp(2, 4, 0.5)).toBe(3);
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
  });
});

describe('createDistanceField', () => {
  it('benadert de echte afstand', () => {
    const field = createDistanceField(square, { cellSize: 0.25 });
    expect(field.sample(5, 5)).toBeCloseTo(5, 1);
    expect(field.sample(5, 1)).toBeCloseTo(1, 1);
    expect(field.sample(-0.5, 5)).toBeLessThan(0);
  });

  it('klemt monsters buiten het raster', () => {
    const field = createDistanceField(square);
    expect(Number.isFinite(field.sample(-100, -100))).toBe(true);
  });

  it('weigert een ongeldige celgrootte', () => {
    expect(() => createDistanceField(square, { cellSize: 0 })).toThrow();
  });
});
