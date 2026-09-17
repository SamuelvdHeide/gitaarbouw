import { MODELS, getModel } from '../data/models/index.js';
import { BODY_WOOD_IDS, FRETBOARD_WOOD_IDS, NECK_WOOD_IDS, TOP_WOOD_IDS } from '../data/woods.js';
import { BURSTS, FINISH_TYPES } from '../data/finishes.js';
import {
  HARDWARE_FINISHES,
  KNOB_COLORS,
  KNOB_STYLES,
  PICKGUARDS,
  PICKUP_CONFIGS,
  PICKUP_COVERS,
} from '../data/parts.js';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const ids = (list) => list.map((item) => item.id);

// Elk ontwerp-veld met de toegestane waarden. Kleurvelden accepteren elke hexkleur.
export const DESIGN_FIELDS = Object.freeze({
  model: ids(MODELS),
  bodyWood: BODY_WOOD_IDS,
  topWood: TOP_WOOD_IDS,
  neckWood: NECK_WOOD_IDS,
  fretboardWood: FRETBOARD_WOOD_IDS,
  finishType: ids(FINISH_TYPES),
  solidColor: 'hex',
  transColor: 'hex',
  burst: ids(BURSTS),
  pickguard: ids(PICKGUARDS),
  pickupConfig: ids(PICKUP_CONFIGS),
  pickupCover: ids(PICKUP_COVERS),
  knobStyle: ids(KNOB_STYLES),
  knobColor: ids(KNOB_COLORS),
  hardware: ids(HARDWARE_FINISHES),
});

const BASE_DESIGN = Object.freeze({
  model: 'strat',
  bodyWood: 'alder',
  topWood: 'none',
  neckWood: 'maple',
  fretboardWood: 'rosewood',
  finishType: 'burst',
  solidColor: '#D9473E',
  transColor: '#8A1A14',
  burst: 'three-tone',
  pickguard: 'white',
  pickupConfig: 'sss',
  pickupCover: 'white',
  knobStyle: 'strat',
  knobColor: 'white',
  hardware: 'chrome',
});

export function isValidValue(field, value) {
  const allowed = DESIGN_FIELDS[field];
  if (!allowed) return false;
  if (allowed === 'hex') return typeof value === 'string' && HEX_COLOR.test(value);
  return allowed.includes(value);
}

/** Het klassieke ontwerp van een model, inclusief houtsoort, afwerking en onderdelen. */
export function classicDesign(modelId) {
  const model = getModel(modelId);
  return Object.freeze({ ...BASE_DESIGN, topWood: 'none', ...model.classic, model: model.id });
}

export const DEFAULT_DESIGN = classicDesign(BASE_DESIGN.model);

/**
 * Maakt van willekeurige invoer (bijv. localStorage) een geldig ontwerp.
 * Onbekende velden worden genegeerd, ongeldige waarden vallen terug op de standaard.
 */
export function sanitizeDesign(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const modelId = isValidValue('model', source.model) ? source.model : DEFAULT_DESIGN.model;
  const fallback = classicDesign(modelId);
  const entries = Object.keys(DESIGN_FIELDS).map((field) => [
    field,
    isValidValue(field, source[field]) ? source[field] : fallback[field],
  ]);
  return Object.freeze(Object.fromEntries(entries));
}

/**
 * Past één veld aan en geeft een nieuw ontwerp terug; het origineel blijft
 * ongewijzigd. Verandert er niets, dan komt hetzelfde object terug.
 */
export function updateDesign(design, field, value) {
  if (!isValidValue(field, value)) {
    throw new Error(`Ongeldige waarde voor ${field}: ${String(value)}`);
  }
  if (design[field] === value) return design;
  return Object.freeze({ ...design, [field]: value });
}

export function designsEqual(a, b) {
  return Object.keys(DESIGN_FIELDS).every((field) => a[field] === b[field]);
}

/** Wisselt van model; met `withClassicSpecs` worden de klassieke keuzes geladen. */
export function switchModel(design, modelId, { withClassicSpecs }) {
  if (!isValidValue('model', modelId)) throw new Error(`Onbekend gitaarmodel: ${modelId}`);
  if (design.model === modelId) return design;
  if (!withClassicSpecs) return updateDesign(design, 'model', modelId);
  const classic = classicDesign(modelId);
  // Eigen kleuren blijven bewaard als het model geen voorkeur heeft.
  const { classic: modelClassic } = getModel(modelId);
  return Object.freeze({
    ...classic,
    solidColor: modelClassic.solidColor ?? design.solidColor,
    transColor: modelClassic.transColor ?? design.transColor,
    burst: modelClassic.burst ?? design.burst,
  });
}
