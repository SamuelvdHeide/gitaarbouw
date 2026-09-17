import { describe, expect, it } from 'vitest';
import { MODELS, getModel } from '../data/models/index.js';
import { PICKUP_CONFIGS } from '../data/parts.js';
import { distanceToEdge, pointInPolygon } from '../geometry/polygon.js';
import {
  tailpieceStuds,
  computeLayout,
  footprintCorners,
  neckWidthAt,
  pickupFootprint,
  pickupPlacements,
  stringSpread,
} from './layout.js';

const KNOB_RADIUS = 1.3;

describe.each(MODELS.map((model) => [model.id, model]))('model %s', (_id, model) => {
  const layout = computeLayout(model);
  const inside = (point) => pointInPolygon(point, layout.outline);

  it('laat de halshiel minstens 3 cm in de body vallen', () => {
    const heelEnd = model.heelEndY ?? layout.fretboardEndY;
    expect(inside([0, heelEnd])).toBe(true);
    expect(layout.bodyEdgeY - heelEnd).toBeGreaterThanOrEqual(3);
    expect(layout.fretboardEndY).toBeLessThan(layout.bodyEdgeY + 16);
  });

  it('plaatst brug en staartstuk op de body', () => {
    expect(inside([0, model.bridgeY])).toBe(true);
    if (model.bridge === 'tuneomatic') {
      tailpieceStuds(model).forEach((stud) => expect(inside(stud), `stud ${stud}`).toBe(true));
    }
  });

  it('houdt knoppen en schakelaar binnen de rand', () => {
    model.controls.knobs.forEach((knob) => {
      expect(inside(knob), `knop ${knob}`).toBe(true);
      expect(distanceToEdge(knob, layout.outline), `knop ${knob}`).toBeGreaterThan(KNOB_RADIUS);
    });
    expect(inside(model.controls.switch.position)).toBe(true);
  });

  it.each(PICKUP_CONFIGS.map((config) => [config.id]))('past elementconfiguratie %s', (configId) => {
    pickupPlacements(model, configId).forEach((placement) => {
      const footprint = pickupFootprint(placement.style);
      footprintCorners(placement, footprint).forEach((corner) => {
        expect(inside(corner), `${placement.slot} hoek ${corner}`).toBe(true);
      });
      expect(placement.y + footprint.depth / 2, `${placement.slot} raakt de toets`).toBeLessThan(layout.fretboardEndY + 0.05);
    });
  });

  it('houdt de slagplaat binnen de body', () => {
    if (!layout.pickguardOutline) return;
    const outside = layout.pickguardOutline.filter((point) => !inside(point));
    expect(outside).toEqual([]);
  });

  it('zet de strapknoppen op de rand', () => {
    // Op de rand, of (zoals op een SG-halshiel) binnen de contour op de rug.
    model.strapButtons.forEach((button) => {
      expect(distanceToEdge(button, layout.outline) < 1.2 || inside(button), `strapknop ${button}`).toBe(true);
    });
  });
});

describe('layout helpers', () => {
  const model = getModel('strat');
  const layout = computeLayout(model);

  it('loopt de halsbreedte op van topkam naar hiel', () => {
    expect(neckWidthAt(model, layout, layout.nutY)).toBeCloseTo(model.nutWidth);
    expect(neckWidthAt(model, layout, layout.fretboardEndY)).toBeCloseTo(model.heelWidth);
  });

  it('weigert onbekende elementtypes en slots', () => {
    expect(() => pickupFootprint('piezo')).toThrow();
    const broken = { ...model, pickupSlots: {} };
    expect(() => pickupPlacements(broken, 'sss')).toThrow();
  });

  it('spreidt zes snaren symmetrisch', () => {
    const spread = stringSpread(model);
    expect(spread).toHaveLength(6);
    expect(spread[0].bridgeX).toBeCloseTo(-spread[5].bridgeX);
    expect(Math.abs(spread[0].nutX)).toBeLessThan(model.nutWidth / 2);
  });
});
