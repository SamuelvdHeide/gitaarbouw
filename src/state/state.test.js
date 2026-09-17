import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_DESIGN,
  DESIGN_FIELDS,
  classicDesign,
  designsEqual,
  isValidValue,
  sanitizeDesign,
  switchModel,
  updateDesign,
} from './design.js';
import { createStore } from './store.js';
import {
  PREFERENCES_KEY,
  STORAGE_KEY,
  loadDesign,
  loadPreferences,
  saveDesign,
  savePreferences,
} from './persistence.js';
import { MODELS } from '../data/models/index.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

describe('design', () => {
  it('heeft een geldig standaardontwerp', () => {
    Object.entries(DEFAULT_DESIGN).forEach(([field, value]) => {
      expect(isValidValue(field, value), field).toBe(true);
    });
  });

  it('geeft elk model een volledig geldig klassiek ontwerp', () => {
    MODELS.forEach((model) => {
      const design = classicDesign(model.id);
      Object.keys(DESIGN_FIELDS).forEach((field) => {
        expect(isValidValue(field, design[field]), `${model.id}.${field}`).toBe(true);
      });
    });
  });

  it('valideert hexkleuren en onbekende velden', () => {
    expect(isValidValue('solidColor', '#AABBCC')).toBe(true);
    expect(isValidValue('solidColor', 'rood')).toBe(false);
    expect(isValidValue('nietBestaand', 'x')).toBe(false);
  });

  it('werkt onveranderlijk bij', () => {
    const next = updateDesign(DEFAULT_DESIGN, 'bodyWood', 'ash');
    expect(next.bodyWood).toBe('ash');
    expect(DEFAULT_DESIGN.bodyWood).not.toBe('ash');
    expect(Object.isFrozen(next)).toBe(true);
    expect(() => updateDesign(DEFAULT_DESIGN, 'bodyWood', 'plastic')).toThrow();
  });

  it('geeft hetzelfde object terug als er niets verandert', () => {
    expect(updateDesign(DEFAULT_DESIGN, 'bodyWood', DEFAULT_DESIGN.bodyWood)).toBe(DEFAULT_DESIGN);
    expect(switchModel(DEFAULT_DESIGN, DEFAULT_DESIGN.model, { withClassicSpecs: true })).toBe(DEFAULT_DESIGN);
    expect(designsEqual(DEFAULT_DESIGN, { ...DEFAULT_DESIGN })).toBe(true);
    expect(designsEqual(DEFAULT_DESIGN, { ...DEFAULT_DESIGN, hardware: 'gold' })).toBe(false);
  });

  it('herstelt ongeldige opgeslagen ontwerpen', () => {
    const design = sanitizeDesign({ model: 'lespaul', bodyWood: 'karton', pickupConfig: 'hss', extra: 1 });
    expect(design.model).toBe('lespaul');
    expect(design.bodyWood).toBe('mahogany');
    expect(design.pickupConfig).toBe('hss');
    expect(design).not.toHaveProperty('extra');
    expect(sanitizeDesign(null)).toEqual(DEFAULT_DESIGN);
    expect(sanitizeDesign({ model: 'banjo' }).model).toBe(DEFAULT_DESIGN.model);
  });

  it('wisselt van model met of zonder klassieke specs', () => {
    const custom = updateDesign(DEFAULT_DESIGN, 'pickupConfig', 'hh');
    const kept = switchModel(custom, 'tele', { withClassicSpecs: false });
    expect(kept.model).toBe('tele');
    expect(kept.pickupConfig).toBe('hh');

    const classic = switchModel(custom, 'lespaul', { withClassicSpecs: true });
    expect(classic.model).toBe('lespaul');
    expect(classic.knobStyle).toBe('tophat');
    expect(classic.solidColor).toBe(custom.solidColor);
    expect(() => switchModel(custom, 'ukelele', { withClassicSpecs: true })).toThrow();
  });
});

describe('store', () => {
  it('meldt alleen echte wijzigingen', () => {
    const store = createStore(1);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.apply((value) => value);
    expect(listener).not.toHaveBeenCalled();
    store.apply((value) => value + 1);
    expect(listener).toHaveBeenCalledWith(2, 1);
    unsubscribe();
    store.apply((value) => value + 1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.get()).toBe(3);
  });
});

describe('persistence', () => {
  it('slaat een ontwerp op en leest het terug', () => {
    const storage = memoryStorage();
    const design = updateDesign(DEFAULT_DESIGN, 'hardware', 'gold');
    expect(saveDesign(storage, design)).toBe(true);
    expect(loadDesign(storage)).toEqual(design);
  });

  it('valt terug op standaardwaarden bij kapotte of ontbrekende opslag', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(loadDesign(memoryStorage({ [STORAGE_KEY]: '{kapot' }))).toEqual(DEFAULT_DESIGN);
    expect(loadDesign(null)).toEqual(DEFAULT_DESIGN);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('meldt het als opslaan mislukt', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = { setItem: () => { throw new Error('vol'); } };
    expect(saveDesign(broken, DEFAULT_DESIGN)).toBe(false);
    warn.mockRestore();
  });

  it('bewaart voorkeuren', () => {
    const storage = memoryStorage();
    expect(loadPreferences(storage).classicSpecsOnModelChange).toBe(true);
    savePreferences(storage, { classicSpecsOnModelChange: false });
    expect(loadPreferences(storage).classicSpecsOnModelChange).toBe(false);
    const invalid = memoryStorage({ [PREFERENCES_KEY]: JSON.stringify({ classicSpecsOnModelChange: 'ja' }) });
    expect(loadPreferences(invalid).classicSpecsOnModelChange).toBe(true);
  });
});
