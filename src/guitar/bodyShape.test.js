import { describe, expect, it } from 'vitest';
import { carveHeight, concaveConvex, createBodyHeights, cutDepth, interpolateTable, polylineSide, rangeWeight, sideWeight, smoothstep } from './bodyShape.js';

describe('bodyShape helpers', () => {
  it('smoothstep en rangeWeight lopen zacht van 0 naar 1', () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(2, 2, 3)).toBe(1);
    expect(rangeWeight(10, [5, 20], 2)).toBe(1);
    expect(rangeWeight(30, [5, 20], 2)).toBe(0);
    expect(rangeWeight(5, [5, 20], 2)).toBeCloseTo(0.5);
    expect(rangeWeight(4, [5, 20], 0)).toBe(0);
  });

  it('kiest de juiste kant', () => {
    expect(sideWeight(-10, 'bass')).toBe(1);
    expect(sideWeight(10, 'bass')).toBe(0);
    expect(sideWeight(10, 'treble')).toBe(1);
    expect(sideWeight(10, 'both')).toBe(1);
  });

  it('snijdt het diepst aan de rand', () => {
    ['flat', 'round', 'scoop'].forEach((profile) => {
      expect(cutDepth(0, { width: 4, depth: 1, profile })).toBe(1);
      expect(cutDepth(4, { width: 4, depth: 1, profile })).toBe(0);
    });
    expect(cutDepth(2, { width: 4, depth: 1, profile: 'flat' })).toBe(0.5);
  });

  it('laat de carve stijgen tot de maximale hoogte', () => {
    const carve = { height: 1.5, falloff: 6, inset: 0.3 };
    expect(carveHeight(0.2, carve)).toBe(0);
    expect(carveHeight(10, carve)).toBeCloseTo(1.5);
    expect(carveHeight(3, carve)).toBeGreaterThan(0.5);
    expect(carveHeight(1, { ...carve, recurve: 0.4 })).toBeLessThan(carveHeight(1, carve));
  });
});

describe('createBodyHeights', () => {
  const distanceAt = (x) => 16 - Math.abs(x);

  it('geeft een vlakke plank zonder kenmerken', () => {
    const heights = createBodyHeights({ thickness: 4.45 }, distanceAt);
    expect(heights.front(0, 10)).toBe(4.45);
    expect(heights.back(0, 10)).toBe(0);
  });

  it('past contouren alleen toe op de juiste kant en plek', () => {
    const body = {
      thickness: 4.45,
      contours: [
        { face: 'front', side: 'bass', yRange: [5, 30], fade: 2, width: 5, depth: 1.2 },
        { face: 'back', side: 'bass', yRange: [25, 40], fade: 2, width: 6, depth: 1.0 },
      ],
    };
    const heights = createBodyHeights(body, distanceAt);
    expect(heights.front(-16, 15)).toBeCloseTo(4.45 - 1.2);
    expect(heights.front(16, 15)).toBe(4.45);
    expect(heights.front(-16, 45)).toBe(4.45);
    expect(heights.back(-16, 32)).toBeCloseTo(1.0);
  });

  it('telt de carve op bij de dikte', () => {
    const heights = createBodyHeights({ thickness: 4, carve: { height: 1.3, falloff: 6 } }, distanceAt);
    expect(heights.front(0, 10)).toBeCloseTo(5.3);
  });
});

describe('grenslijn-contouren', () => {
  const distanceAt = (x) => 16 - Math.abs(x);

  it('bepaalt afstand en kant ten opzichte van een lijn', () => {
    expect(polylineSide([0, 5], [[0, 0], [10, 0]])).toEqual({ distance: 5, side: 1, beyond: 0 });
    expect(polylineSide([-3, 1], [[0, 0], [10, 0]]).beyond).toBeCloseTo(3);
    expect(polylineSide([14, 1], [[0, 0], [10, 0]]).beyond).toBeCloseTo(4);
    expect(polylineSide([0, -5], [[0, 0], [10, 0]]).side).toBe(-1);
  });

  it('snijdt alleen tussen de lijn en de dichtstbijzijnde rand', () => {
    const body = { thickness: 4, contours: [{ face: 'front', boundary: [[-10, 0], [-10, 40]], depth: 1 }] };
    const heights = createBodyHeights(body, distanceAt);
    expect(heights.front(-10, 20)).toBeCloseTo(4);
    expect(heights.front(-16, 20)).toBeCloseTo(3);
    expect(heights.front(-13, 20)).toBeLessThan(4);
    expect(heights.front(0, 20)).toBe(4);
    expect(heights.front(12, 20)).toBe(4);
  });
});

describe('gemeten carve', () => {
  it('interpoleert tabellen en klemt aan de randen', () => {
    const table = [[0, 0], [10, 1], [20, 0.5]];
    expect(interpolateTable(table, -5)).toBe(0);
    expect(interpolateTable(table, 5)).toBe(0.5);
    expect(interpolateTable(table, 15)).toBe(0.75);
    expect(interpolateTable(table, 99)).toBe(0.5);
  });

  it('loopt eerst hol en dan bol', () => {
    expect(concaveConvex(0, 0.25)).toBe(0);
    expect(concaveConvex(1, 0.25)).toBe(1);
    expect(concaveConvex(0.25, 0.25)).toBeCloseTo(0.25);
    expect(concaveConvex(0.1, 0.25)).toBeLessThan(0.1);
    expect(concaveConvex(0.6, 0.25)).toBeGreaterThan(0.6);
  });

  it('volgt het middenprofiel en de vlakke rand', () => {
    const distanceAt = (x) => 12 - Math.abs(x);
    const body = { thickness: 5, carve: { centerline: [[0, 0], [20, 1], [40, 0]], ledges: [[0, 3], [40, 3]], inflection: 2 } };
    const heights = createBodyHeights(body, distanceAt);
    expect(heights.front(0, 20)).toBeCloseTo(6);
    expect(heights.front(-10, 20)).toBe(5);
    expect(heights.front(-6, 20)).toBeGreaterThan(5);
    expect(heights.front(0, 40)).toBe(5);
  });
});
