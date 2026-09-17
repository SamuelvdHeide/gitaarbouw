import { BRANDS } from '../data/models/index.js';

const BRIDGE_LABELS = Object.freeze({
  tremolo: 'Tremolo',
  ashtray: 'Vaste brug met 3 zadels',
  tuneomatic: 'Tune-o-matic met stopbar',
  'offset-vibrato': 'Zwevende brug met vibrato',
});

const JOINT_LABELS = Object.freeze({ bolt: 'Geschroefd', set: 'Gelijmd' });

const formatNumber = (value, digits = 0) =>
  value.toLocaleString('nl-NL', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

export function brandLabel(model) {
  return BRANDS.find((brand) => brand.id === model.brand)?.label ?? '';
}

/** Bouwmaten die handig zijn bij het zelf bouwen, als [label, waarde]-paren. */
export function describeSpecs(model, layout) {
  const scaleMm = model.scaleLength * 10;
  const inches = model.scaleLength / 2.54;
  const carve = model.body.carve;
  const carveHeight = carve?.centerline ? Math.max(...carve.centerline.map(([, height]) => height)) : carve?.height ?? 0;
  const depthCm = model.body.thickness + carveHeight;
  const bodySize = [layout.bounds.height, layout.bounds.width, depthCm]
    .map((cm) => formatNumber(Math.round(cm * 10)))
    .join(' × ');

  return [
    ['Schaallengte', `${formatNumber(Math.round(scaleMm))} mm (${formatNumber(inches, 2)}″)`],
    ['Frets', String(model.fretCount)],
    ['Hals', JOINT_LABELS[model.neckJoint] ?? model.neckJoint],
    ['Brug', BRIDGE_LABELS[model.bridge] ?? model.bridge],
    ['Body', `${bodySize} mm`],
  ];
}
