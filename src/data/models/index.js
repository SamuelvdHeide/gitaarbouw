import { stratocaster } from './stratocaster.js';
import { telecaster } from './telecaster.js';
import { jazzmaster } from './jazzmaster.js';
import { lesPaul } from './lesPaul.js';
import { sg } from './sg.js';
import { flyingV } from './flyingV.js';
import { prsCustom24 } from './prsCustom24.js';
import { prsSinglecut } from './prsSinglecut.js';
import { prsSilverSky } from './prsSilverSky.js';

export const MODELS = Object.freeze([
  stratocaster,
  telecaster,
  jazzmaster,
  lesPaul,
  sg,
  flyingV,
  prsCustom24,
  prsSinglecut,
  prsSilverSky,
]);

export const BRANDS = Object.freeze([
  { id: 'fender', label: 'Fender-stijl' },
  { id: 'gibson', label: 'Gibson-stijl' },
  { id: 'prs', label: 'PRS SE-stijl' },
]);

const MODELS_BY_ID = new Map(MODELS.map((model) => [model.id, model]));

export function getModel(id) {
  const model = MODELS_BY_ID.get(id);
  if (!model) throw new Error(`Onbekend gitaarmodel: ${id}`);
  return model;
}
