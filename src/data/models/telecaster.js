import reference from '../references/tele.json';
import { modelFromReference } from './fromReference.js';

// Fender Telecaster 1952: body uit de Terry Downs 1:1 CAD-tekening, onderdelen uit
// Fenders AVII '51 Blackguard-tekening en Electric Herald-mallen.
export const telecaster = modelFromReference(reference, {
  id: 'tele',
  label: 'Telecaster',
  sourceNote: 'Gemeten uit de 1:1 Telecaster-CAD-tekening van Terry Downs en Fenders ’51 Blackguard-tekening.',
  brand: 'fender',
  stringSpacing: 'tele',
  tuner: 'kluson',
  inlays: 'dots',
  bridge: 'ashtray',
  fretboardTopAboveRim: 0.98,
  pickupStyle: { 'neck:single': 'teleNeck', 'bridge:single': 'teleBridge' },
  neckPlate: { center: [0, 36.76], size: [5.08, 6.4] },
  // Ronde snaargeleider voor B en hoge e (uit de referentienotities).
  headstockOverrides: { stringTrees: [[1.39, 10.01]] },
  classic: {
    bodyWood: 'ash',
    neckWood: 'maple',
    fretboardWood: 'maple',
    finishType: 'transparent',
    transColor: '#E3AE52',
    pickguard: 'black',
    pickupConfig: 'ss',
    pickupCover: 'black',
    knobStyle: 'dome',
    knobColor: 'chrome',
    hardware: 'chrome',
  },
});
