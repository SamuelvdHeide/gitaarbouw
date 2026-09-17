import reference from '../references/lespaul.json';
import { modelFromReference } from './fromReference.js';

// Gibson Les Paul Standard 1959: John Catto 1:1 vectormallen (Electric Herald), inclusief
// carve-doorsneden, halshoek 4° en kophoek 17°.
const { carve, binding } = reference.body;
const details = reference.bridge.details;

// Breedte van de vlakke bindingrand per hoogte, uit de gemeten doorsneden plus staart en hals.
const ledges = [
  [0, 2.3],
  ...carve.crossSections
    .map(({ y, bodyEdgeX, flatLedgeEndsAtX }) => [y, (Math.abs(bodyEdgeX[0] - flatLedgeEndsAtX[0]) + Math.abs(bodyEdgeX[1] - flatLedgeEndsAtX[1])) / 2])
    .sort((a, b) => a[0] - b[0]),
  [reference.neck.bodyEdgeYOnCenterline, 0.2],
];

export const lesPaul = modelFromReference(reference, {
  id: 'lespaul',
  label: 'Les Paul',
  sourceNote: 'Gemeten uit de 1:1 John Catto-mallen (1958-60), inclusief carve-doorsneden, halshoek 4° en kophoek 17°.',
  brand: 'gibson',
  tuner: 'kluson3',
  headstockFace: 'black',
  inlays: 'trapezoid',
  bridge: 'tuneomatic',
  fretboardTopAboveRim: reference.neck.fretboardTopAboveRimAtFretboardEnd,
  fretboardBinding: true,
  // Bij een sunburst zit de burst alleen op de top; rug en zijkant zijn donker cherry-mahonie.
  burstBack: { finishType: 'transparent', colorHex: '#4A140E' },
  pickguardRaised: true,
  bridgeDetails: { ...details, bridgePosts: details.abr1PostCenters, stopbarStuds: details.stopbarStudCenters },
  body: {
    carve: { centerline: carve.centerlineProfile, ledges, inflection: 2.1 },
    binding: { width: binding.width, height: binding.height, material: 'cream' },
  },
  classic: {
    bodyWood: 'mahogany',
    neckWood: 'mahogany',
    fretboardWood: 'rosewood',
    finishType: 'burst',
    burst: 'cherry',
    pickguard: 'cream',
    pickupConfig: 'hh',
    pickupCover: 'metal',
    knobStyle: 'tophat',
    knobColor: 'amber',
    hardware: 'nickel',
  },
});
