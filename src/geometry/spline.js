// Centripetale Catmull-Rom spline: gaat exact door de controlepunten zonder
// lusjes of overshoot, ideaal om gitaarcontouren met de hand te tekenen.

const CENTRIPETAL_ALPHA = 0.5;
const MIN_KNOT_STEP = 1e-4;

function nextKnot(t, from, to) {
  const distance = Math.hypot(to[0] - from[0], to[1] - from[1]);
  return t + Math.max(Math.pow(distance, CENTRIPETAL_ALPHA), MIN_KNOT_STEP);
}

function mix(a, b, ta, tb, t) {
  const span = tb - ta;
  const wa = (tb - t) / span;
  const wb = (t - ta) / span;
  return [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb];
}

function segmentPoint(p0, p1, p2, p3, t) {
  const t0 = 0;
  const t1 = nextKnot(t0, p0, p1);
  const t2 = nextKnot(t1, p1, p2);
  const t3 = nextKnot(t2, p2, p3);
  const tt = t1 + (t2 - t1) * t;

  const a1 = mix(p0, p1, t0, t1, tt);
  const a2 = mix(p1, p2, t1, t2, tt);
  const a3 = mix(p2, p3, t2, t3, tt);
  const b1 = mix(a1, a2, t0, t2, tt);
  const b2 = mix(a2, a3, t1, t3, tt);
  return mix(b1, b2, t1, t2, tt);
}

/**
 * Bemonstert een gesloten curve door alle controlepunten.
 * @param {Array<[number, number]>} controlPoints minimaal 3 punten
 * @param {number} samplesPerSegment aantal punten per segment
 * @returns {Array<[number, number]>} gesloten polygoon (zonder dubbel eindpunt)
 */
export function sampleClosedCurve(controlPoints, samplesPerSegment = 10) {
  if (!Array.isArray(controlPoints) || controlPoints.length < 3) {
    throw new Error('Een gesloten curve heeft minimaal 3 controlepunten nodig');
  }
  if (!Number.isInteger(samplesPerSegment) || samplesPerSegment < 1) {
    throw new Error('samplesPerSegment moet een positief geheel getal zijn');
  }

  const count = controlPoints.length;
  const result = [];
  for (let i = 0; i < count; i += 1) {
    const p0 = controlPoints[(i - 1 + count) % count];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % count];
    const p3 = controlPoints[(i + 2) % count];
    for (let s = 0; s < samplesPerSegment; s += 1) {
      result.push(segmentPoint(p0, p1, p2, p3, s / samplesPerSegment));
    }
  }
  return result;
}

/**
 * Bemonstert een open curve (bijv. een tremolo-arm) door alle controlepunten.
 * @param {Array<[number, number]>} controlPoints minimaal 2 punten
 */
export function sampleOpenCurve(controlPoints, samplesPerSegment = 10) {
  if (!Array.isArray(controlPoints) || controlPoints.length < 2) {
    throw new Error('Een open curve heeft minimaal 2 controlepunten nodig');
  }
  const first = controlPoints[0];
  const last = controlPoints[controlPoints.length - 1];
  const padded = [first, ...controlPoints, last];
  const result = [];
  for (let i = 1; i < padded.length - 2; i += 1) {
    for (let s = 0; s < samplesPerSegment; s += 1) {
      result.push(segmentPoint(padded[i - 1], padded[i], padded[i + 1], padded[i + 2], s / samplesPerSegment));
    }
  }
  result.push([last[0], last[1]]);
  return result;
}
