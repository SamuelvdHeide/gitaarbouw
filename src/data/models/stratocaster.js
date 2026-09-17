import reference from '../references/strat.json';
import { modelFromReference } from './fromReference.js';

// Fender Stratocaster 1962: body uit Fender-fabriekstekening 019574 (1:1), onderdelen
// uit een 1:1 tekening van een complete jaren-60 Strat. Zie reference.sources.
const [bolts] = [reference.neck.boltHoles];

export const stratocaster = modelFromReference(reference, {
  id: 'strat',
  label: 'Stratocaster',
  sourceNote: 'Gemeten uit Fenders 1:1 fabriekstekening van de 1962-body (019574), inclusief arm- en buikcontour.',
  brand: 'fender',
  tuner: 'kluson',
  inlays: 'dots',
  bridge: 'tremolo',
  fretboardTopAboveRim: 0.98,
  neckPlate: { center: [0, (bolts[0][1] + bolts[2][1]) / 2], size: [5.08, 6.4] },
  classic: {
    bodyWood: 'alder',
    neckWood: 'maple',
    fretboardWood: 'rosewood',
    finishType: 'burst',
    burst: 'three-tone',
    pickguard: 'white',
    pickupConfig: 'sss',
    pickupCover: 'white',
    knobStyle: 'strat',
    knobColor: 'white',
    hardware: 'chrome',
  },
});
