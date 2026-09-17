import reference from '../references/sg.json';
import { modelFromReference } from './fromReference.js';

// Gibson SG Standard 1961: 1:1 vectormal (Electric Herald SG Custom) met gemeten
// afschuiningen voor en achter, halshoek 3° en kophoek 17°.
const details = reference.bridge.details;

export const sg = modelFromReference(reference, {
  id: 'sg',
  label: 'SG',
  sourceNote: 'Gemeten uit een 1:1 SG-vectormal, inclusief de afschuiningen voor en achter, halshoek 3° en kophoek 17°.',
  brand: 'gibson',
  tuner: 'kluson3',
  headstockFace: 'black',
  inlays: 'trapezoid',
  bridge: 'tuneomatic',
  fretboardTopAboveRim: 1.1,
  fretboardBinding: true,
  bridgeDetails: { ...details, bridgePosts: details.tomPosts },
  classic: {
    bodyWood: 'mahogany',
    neckWood: 'mahogany',
    fretboardWood: 'rosewood',
    finishType: 'transparent',
    transColor: '#8A1A14',
    pickguard: 'black',
    pickupConfig: 'hh',
    pickupCover: 'metal',
    knobStyle: 'tophat',
    knobColor: 'black',
    hardware: 'chrome',
  },
});
