import reference from '../references/flyingv.json';
import { modelFromReference } from './fromReference.js';

// Gibson Flying V, 1967-uitvoering: body uit de 1:1 Electric Herald '83-vectormal, slagplaat,
// knoppen en brug uit gekalibreerde Gibson-productfoto's; kop uit de '58 1:1-mal.
// Let op: y = 0 ligt in de V-inkeping, de vleugelpunten hebben een negatieve y.
const details = reference.bridge.details;

export const flyingV = modelFromReference(reference, {
  id: 'flyingv',
  label: 'Flying V',
  sourceNote: 'Body uit een 1:1 Flying V-vectormal, slagplaat en onderdelen uit gekalibreerde Gibson-foto’s van de ’67-uitvoering.',
  brand: 'gibson',
  tuner: 'kluson3',
  headstockFace: 'black',
  inlays: 'dots',
  bridge: 'tuneomatic',
  fretboardTopAboveRim: 1.2,
  bridgeDetails: { ...details, bridgePosts: details.tomPosts },
  classic: {
    bodyWood: 'korina',
    neckWood: 'mahogany',
    fretboardWood: 'rosewood',
    finishType: 'natural',
    pickguard: 'white',
    pickupConfig: 'hh',
    pickupCover: 'metal',
    knobStyle: 'witch',
    knobColor: 'black',
    hardware: 'gold',
  },
});
