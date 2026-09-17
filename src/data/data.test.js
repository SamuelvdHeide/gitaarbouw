import { describe, expect, it } from 'vitest';
import { KNOB_PROFILES } from './knobProfiles.js';
import { MODELS, getModel } from './models/index.js';
import { BURSTS, SOLID_COLORS, findColor, getBurst } from './finishes.js';
import { KNOB_STYLES, PICKGUARDS, findById } from './parts.js';
import { BODY_WOOD_IDS, FRETBOARD_WOOD_IDS, NECK_WOOD_IDS, TOP_WOOD_IDS, WOODS, getWood, isDarkWood } from './woods.js';

describe('catalogi', () => {
  it('verwijst alleen naar bestaande houtsoorten', () => {
    [...BODY_WOOD_IDS, ...NECK_WOOD_IDS, ...FRETBOARD_WOOD_IDS, ...TOP_WOOD_IDS.filter((id) => id !== 'none')]
      .forEach((id) => expect(WOODS[id], id).toBeDefined());
    expect(() => getWood('karton')).toThrow();
  });

  it('herkent donkere toetsen', () => {
    expect(isDarkWood('ebony')).toBe(true);
    expect(isDarkWood('maple')).toBe(false);
  });

  it('vindt kleuren hoofdletterongevoelig', () => {
    expect(findColor(SOLID_COLORS, '#d9473e')?.id).toBe('fiesta-red');
    expect(findColor(SOLID_COLORS, '#123456')).toBeNull();
  });

  it('heeft sunbursts die van rand (0) naar midden (1) lopen', () => {
    BURSTS.forEach((burst) => {
      expect(burst.stops[0][0]).toBe(0);
      expect(burst.stops.at(-1)[0]).toBe(1);
    });
    expect(() => getBurst('regenboog')).toThrow();
  });

  it('heeft een profiel voor elke knopstijl', () => {
    KNOB_STYLES.forEach((style) => expect(KNOB_PROFILES[style.id], style.id).toBeDefined());
  });

  it('meldt onbekende onderdelen', () => {
    expect(findById(PICKGUARDS, 'none').label).toBe('Geen');
    expect(() => findById(PICKGUARDS, 'goud')).toThrow();
    expect(() => getModel('ukelele')).toThrow();
  });
});
