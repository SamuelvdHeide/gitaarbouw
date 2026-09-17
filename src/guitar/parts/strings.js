import { cylinderBetween, group } from '../../scene/threeHelpers.js';

const STRING_RADII = [0.055, 0.046, 0.037, 0.03, 0.021, 0.016];

/** Snaren van staartstuk via zadel en topkam naar de stemas. */
export function buildStrings({ tails, saddles, nutPoints, postTops, material }) {
  const segments = saddles.flatMap((saddle, index) => {
    const radius = STRING_RADII[index];
    const route = [tails[index], saddle, nutPoints[index], postTops[index]];
    return route.slice(1).map((point, step) => {
      const segment = cylinderBetween(route[step], point, radius, material, 6);
      segment.castShadow = false;
      return segment;
    });
  });
  return group('snaren', segments);
}
