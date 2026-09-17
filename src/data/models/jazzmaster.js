import reference from '../references/jazzmaster.json';
import { modelFromReference } from './fromReference.js';

// Fender Jazzmaster 1962, gemeten uit de 1:1 Electric Herald-mallen en Fender-servicetekeningen.
export const jazzmaster = modelFromReference(reference, {
  id: 'jazzmaster',
  label: 'Jazzmaster',
  sourceNote: 'Gemeten uit 1:1 Electric Herald-mallen en Fender-servicetekeningen van de 1962 Jazzmaster.',
  brand: 'fender',
  stringSpacing: 'jazzmaster',
  tuner: 'kluson',
  inlays: 'dots',
  bridge: 'offset-vibrato',
  fretboardTopAboveRim: 1.35,
  pickupStyle: { p90: 'jazzmaster' },
  neckPlate: { center: [0, 41.18], size: [5.08, 6.4] },
  classic: {
    bodyWood: 'alder',
    neckWood: 'maple',
    fretboardWood: 'rosewood',
    finishType: 'solid',
    solidColor: '#EDE8D6',
    pickguard: 'tortoise',
    pickupConfig: 'p90',
    pickupCover: 'white',
    knobStyle: 'dome',
    knobColor: 'black',
    hardware: 'chrome',
  },
});
