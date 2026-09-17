import { describe, expect, it } from 'vitest';
import { getModel } from '../data/models/index.js';
import { computeLayout } from '../guitar/layout.js';
import { brandLabel, describeSpecs } from './specs.js';

describe('describeSpecs', () => {
  it('beschrijft een Stratocaster in Nederlandse notatie', () => {
    const model = getModel('strat');
    const specs = Object.fromEntries(describeSpecs(model, computeLayout(model)));
    expect(specs.Schaallengte).toBe('648 mm (25,5″)');
    expect(specs.Frets).toBe('21');
    expect(specs.Hals).toBe('Geschroefd');
    expect(specs.Brug).toBe('Tremolo');
    expect(specs.Body).toMatch(/^\d+ × \d+ × 45 mm$/);
  });

  it('telt de gewelfde top mee in de dikte', () => {
    const model = getModel('lespaul');
    const specs = Object.fromEntries(describeSpecs(model, computeLayout(model)));
    expect(specs.Schaallengte).toBe('629 mm (24,75″)');
    expect(specs.Body).toMatch(/^438 × 331/);
    expect(specs.Hals).toBe('Gelijmd');
    expect(specs.Body).toMatch(/× 59 mm$/);
  });

  it('valt terug op de ruwe waarde bij onbekende onderdelen', () => {
    const model = { ...getModel('sg'), bridge: 'bigsby', neckJoint: 'neck-through' };
    const specs = Object.fromEntries(describeSpecs(model, computeLayout(model)));
    expect(specs.Brug).toBe('bigsby');
    expect(specs.Hals).toBe('neck-through');
  });

  it('geeft het merklabel', () => {
    expect(brandLabel(getModel('prs-custom24'))).toBe('PRS SE-stijl');
    expect(brandLabel({ brand: 'onbekend' })).toBe('');
  });
});
