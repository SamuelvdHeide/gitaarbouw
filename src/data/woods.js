// Houtsoorten met parameters voor de procedurele nerftextuur.
// Kleuren zijn [r, g, b] 0-255: `light` is vroeghout, `dark` laathout/nerf.

const wood = (definition) => Object.freeze(definition);

export const WOODS = Object.freeze({
  alder: wood({
    id: 'alder', label: 'Els', hint: 'alder', note: 'Licht van gewicht met een gebalanceerde, open klank.',
    light: [205, 160, 116], dark: [168, 118, 78], lineFreq: 0.9, lineContrast: 0.35, lineSharpness: 3,
    warp: 1.6, fiberContrast: 0.12, pores: 0, figure: 'none',
  }),
  ash: wood({
    id: 'ash', label: 'Essen', hint: 'swamp ash', note: 'Uitgesproken nerf, strakke lage tonen en sprankelende hoge tonen.',
    light: [222, 196, 150], dark: [138, 102, 64], lineFreq: 0.55, lineContrast: 0.55, lineSharpness: 5,
    warp: 3.2, fiberContrast: 0.1, pores: 0.25, figure: 'none',
  }),
  mahogany: wood({
    id: 'mahogany', label: 'Mahonie', hint: 'mahogany', note: 'Warm en vol, met een sterk middengebied.',
    light: [140, 72, 40], dark: [92, 42, 22], lineFreq: 1.8, lineContrast: 0.32, lineSharpness: 2,
    warp: 0.8, fiberContrast: 0.2, pores: 0.35, figure: 'none',
  }),
  basswood: wood({
    id: 'basswood', label: 'Linde', hint: 'basswood', note: 'Zeer egaal en licht, neutraal van klank.',
    light: [228, 206, 168], dark: [205, 178, 136], lineFreq: 0.7, lineContrast: 0.18, lineSharpness: 2,
    warp: 1.2, fiberContrast: 0.06, pores: 0, figure: 'none',
  }),
  walnut: wood({
    id: 'walnut', label: 'Walnoot', hint: 'walnut', note: 'Donker en dicht, warm met veel sustain.',
    light: [118, 80, 54], dark: [62, 40, 26], lineFreq: 0.8, lineContrast: 0.5, lineSharpness: 2.5,
    warp: 4.5, fiberContrast: 0.15, pores: 0.2, figure: 'none',
  }),
  korina: wood({
    id: 'korina', label: 'Korina', hint: 'white limba', note: 'Goudblond met fijne nerf, warm maar helder.',
    light: [226, 190, 128], dark: [184, 140, 80], lineFreq: 1.4, lineContrast: 0.3, lineSharpness: 2,
    warp: 1.0, fiberContrast: 0.14, pores: 0.18, figure: 'none',
  }),
  maple: wood({
    id: 'maple', label: 'Esdoorn', hint: 'maple', note: 'Hard en helder, met veel attack.',
    light: [236, 214, 172], dark: [212, 182, 134], lineFreq: 1.1, lineContrast: 0.22, lineSharpness: 2,
    warp: 1.0, fiberContrast: 0.06, pores: 0, figure: 'none',
  }),
  'roasted-maple': wood({
    id: 'roasted-maple', label: 'Geroosterd esdoorn', hint: 'roasted maple', note: 'Karamelkleurig en stabiel door verhitting.',
    light: [196, 128, 66], dark: [150, 88, 40], lineFreq: 1.1, lineContrast: 0.3, lineSharpness: 2,
    warp: 1.0, fiberContrast: 0.1, pores: 0, figure: 'none',
  }),
  rosewood: wood({
    id: 'rosewood', label: 'Palissander', hint: 'rosewood', note: 'Warm en rond, de klassieke donkere toets.',
    light: [96, 56, 36], dark: [48, 26, 18], lineFreq: 1.2, lineContrast: 0.55, lineSharpness: 1.6,
    warp: 2.0, fiberContrast: 0.2, pores: 0.25, figure: 'none',
  }),
  ebony: wood({
    id: 'ebony', label: 'Ebben', hint: 'ebony', note: 'Diepzwart en glad, strak en helder.',
    light: [40, 34, 30], dark: [18, 15, 13], lineFreq: 1.5, lineContrast: 0.4, lineSharpness: 1.5,
    warp: 1.4, fiberContrast: 0.1, pores: 0.05, figure: 'none',
  }),
  'pau-ferro': wood({
    id: 'pau-ferro', label: 'Pau ferro', hint: 'pau ferro', note: 'Iets lichter dan palissander, met een snappy aanslag.',
    light: [128, 80, 50], dark: [78, 44, 26], lineFreq: 1.4, lineContrast: 0.5, lineSharpness: 1.8,
    warp: 1.6, fiberContrast: 0.18, pores: 0.15, figure: 'none',
  }),
  'flamed-maple': wood({
    id: 'flamed-maple', label: 'Gevlamd esdoorn', hint: 'flamed maple', note: 'Diepe dwarsvlammen die oplichten onder transparante lak.',
    light: [240, 218, 172], dark: [150, 112, 66], lineFreq: 0.9, lineContrast: 0.1, lineSharpness: 2,
    warp: 1.2, fiberContrast: 0.05, pores: 0, figure: 'flame',
  }),
  'quilted-maple': wood({
    id: 'quilted-maple', label: 'Gewolkt esdoorn', hint: 'quilted maple', note: 'Bobbelig wolkenpatroon met veel diepte.',
    light: [240, 218, 172], dark: [150, 112, 66], lineFreq: 0.9, lineContrast: 0.08, lineSharpness: 2,
    warp: 1.2, fiberContrast: 0.05, pores: 0, figure: 'quilt',
  }),
});

export const BODY_WOOD_IDS = Object.freeze(['alder', 'ash', 'mahogany', 'basswood', 'walnut', 'korina', 'maple']);
export const TOP_WOOD_IDS = Object.freeze(['none', 'flamed-maple', 'quilted-maple']);
export const NECK_WOOD_IDS = Object.freeze(['maple', 'roasted-maple', 'mahogany']);
export const FRETBOARD_WOOD_IDS = Object.freeze(['maple', 'rosewood', 'ebony', 'pau-ferro', 'roasted-maple']);

export function getWood(id) {
  const found = WOODS[id];
  if (!found) throw new Error(`Onbekende houtsoort: ${id}`);
  return found;
}

/** Donkere toetsen krijgen lichte inlays, lichte toetsen donkere. */
export function isDarkWood(id) {
  const { light } = getWood(id);
  return (light[0] + light[1] + light[2]) / 3 < 150;
}
