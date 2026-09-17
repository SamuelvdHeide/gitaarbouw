import reference from '../references/prs-silversky.json';
import { modelFromReference } from './fromReference.js';

// PRS SE Silver Sky: getraceerd uit PRS' productfoto (geschaald op 22 frets); de kop
// komt overeen met PRS-designoctrooi USD823376 (omgekeerde PRS-kop, 3+3).
const details = reference.bridge.details;
const [forearm] = reference.body.contours;
const bolts = reference.neck.boltHoles;
const pivotY = (details.pivotStuds[0][1] + details.pivotStuds[1][1]) / 2;

export const prsSilverSky = modelFromReference(reference, {
  id: 'prs-silversky',
  label: 'Silver Sky',
  sourceNote: 'Getraceerd uit PRS’ eigen productfoto (geschaald op 22 frets); kop volgens PRS-designoctrooi USD823376.',
  brand: 'prs',
  stringSpacing: { nut: 3.53, bridge: 5.44 },
  tuner: 'prs',
  inlays: 'birds',
  bridge: 'tremolo',
  fretboardTopAboveRim: 0.98,
  bridgeDetails: { ...details, pivotScrewLineY: pivotY },
  neckPlate: bolts ? { center: [0, bolts.reduce((sum, [, y]) => sum + y, 0) / bolts.length], size: [5.08, 6.4] } : undefined,
  body: {
    contours: [
      { face: 'front', boundary: forearm.boundaryLine, depth: forearm.depth, profile: 'round' },
      // Buikcontour is alleen beschreven (rug, baskant, y 9-41): als randcontour benaderd.
      { face: 'back', side: 'bass', yRange: [9, 41], fade: 4, width: 6.0, depth: 2.2, profile: 'round' },
    ],
  },
  classic: {
    bodyWood: 'alder',
    topWood: 'none',
    neckWood: 'maple',
    fretboardWood: 'rosewood',
    finishType: 'solid',
    solidColor: '#86A7BD',
    pickguard: 'white',
    pickupConfig: 'sss',
    pickupCover: 'white',
    knobStyle: 'lampshade',
    knobColor: 'white',
    hardware: 'chrome',
  },
});
