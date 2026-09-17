import reference from '../references/prs-594sc.json';
import { modelFromReference } from './fromReference.js';

// PRS SE McCarty 594 Singlecut: getraceerd uit PRS' productfoto (geschaald op de frets).
const { carve } = reference.body;
const details = reference.bridge.details;
const bodyEdgeY = reference.neck.bodyEdgeYOnCenterline;
const ledge = carve.ledgeWidths['all around (estimated)'];

export const prsSinglecut = modelFromReference(reference, {
  id: 'prs-594sc',
  label: 'McCarty 594 Singlecut',
  sourceNote: 'Getraceerd uit PRS’ eigen productfoto (geschaald op de frets); carve-hoogtes en rugdetails geschat.',
  brand: 'prs',
  tuner: 'prs',
  inlays: 'birds',
  bridge: 'tuneomatic',
  bridgeHardware: 'prsTwoPiece',
  fretboardTopAboveRim: 1.35,
  bridgeDetails: { ...details, bridgePosts: details.tomPostCenters, stopbarStuds: details.stopbarStudCenters },
  body: {
    carve: { centerline: carve.centerlineProfile, ledges: [[0, ledge], [bodyEdgeY - 4, ledge], [bodyEdgeY, 0.3]], inflection: 1.0 },
    binding: { width: ledge, height: 0.3, material: 'natural' },
  },
  classic: {
    bodyWood: 'mahogany',
    topWood: 'flamed-maple',
    neckWood: 'mahogany',
    fretboardWood: 'rosewood',
    finishType: 'burst',
    burst: 'honey',
    pickguard: 'none',
    pickupConfig: 'hh',
    pickupCover: 'metal',
    knobStyle: 'lampshade',
    knobColor: 'gold',
    hardware: 'nickel',
  },
});
