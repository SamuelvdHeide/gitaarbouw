// Fretposities volgens de twaalfde-machtswortel-van-twee-regel.

export function fretDistanceFromNut(scaleLength, fret) {
  if (!(scaleLength > 0)) throw new Error('Schaallengte moet positief zijn');
  if (!Number.isInteger(fret) || fret < 0) throw new Error('Fretnummer moet een geheel getal >= 0 zijn');
  return scaleLength * (1 - Math.pow(2, -fret / 12));
}

export function fretPositions(scaleLength, fretCount) {
  return Array.from({ length: fretCount }, (_, index) => fretDistanceFromNut(scaleLength, index + 1));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
