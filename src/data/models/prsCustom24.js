import reference from '../references/prs-custom24.json';
import { modelFromReference } from './fromReference.js';

// PRS SE Custom 24: contour getraceerd uit PRS' eigen recht-van-voren productfoto (geschaald
// op alle frets) en gecontroleerd met een 1:1 USA Custom 24-tekening; carve-profiel geschat.
const { carve } = reference.body;
const ledge = carve.ledgeWidths;
const bodyEdgeY = reference.neck.bodyEdgeYOnCenterline;

export const prsCustom24 = modelFromReference(reference, {
  id: 'prs-custom24',
  label: 'Custom 24',
  sourceNote: 'Getraceerd uit PRS’ eigen productfoto (geschaald op 24 frets) en gecontroleerd met een 1:1 USA-tekening; carve-hoogtes geschat.',
  brand: 'prs',
  tuner: 'prs',
  inlays: 'birds',
  bridge: 'tremolo',
  bridgeHardware: 'prsTremolo',
  fretboardTopAboveRim: 1.6,
  bridgeDetails: { ...reference.bridge.details, pivotScrewLineY: reference.bridge.details.pivotScrews.y },
  body: {
    carve: {
      centerline: carve.centerlineProfile,
      ledges: [[0, ledge['tail (centerline)']], [14, ledge['lower bout']], [25, ledge.waist], [bodyEdgeY - 4, ledge['bass horn']], [bodyEdgeY, 0.3]],
      inflection: 1.0,
    },
    // De vlakke esdoornrand van de carve is de 'natural binding' van PRS.
    binding: { width: ledge['lower bout'], height: 0.3, material: 'natural' },
  },
  classic: {
    bodyWood: 'mahogany',
    topWood: 'flamed-maple',
    neckWood: 'maple',
    fretboardWood: 'rosewood',
    finishType: 'transparent',
    transColor: '#1F8A8C',
    pickguard: 'none',
    pickupConfig: 'hh',
    pickupCover: 'black',
    knobStyle: 'lampshade',
    knobColor: 'black',
    hardware: 'nickel',
  },
});
