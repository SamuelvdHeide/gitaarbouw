export function hexToRgb(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex));
  if (!match) throw new Error(`Ongeldige hexkleur: ${hex}`);
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function luminance([r, g, b]) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function mixRgb(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Kleur op positie t (0..1) in een lijst van [t, hex]-stops. */
export function gradientAt(stops, t) {
  const rgbStops = stops.map(([position, hex]) => [position, hexToRgb(hex)]);
  if (t <= rgbStops[0][0]) return rgbStops[0][1];
  for (let i = 1; i < rgbStops.length; i += 1) {
    const [position, color] = rgbStops[i];
    if (t <= position) {
      const [previousPosition, previousColor] = rgbStops[i - 1];
      return mixRgb(previousColor, color, (t - previousPosition) / (position - previousPosition));
    }
  }
  return rgbStops.at(-1)[1];
}

/** Voorberekende lookup-tabel voor snelle verlopen per pixel. */
export function createGradientLut(stops, size = 256) {
  const lut = new Float32Array(size * 3);
  for (let i = 0; i < size; i += 1) {
    const [r, g, b] = gradientAt(stops, i / (size - 1));
    lut[i * 3] = r;
    lut[i * 3 + 1] = g;
    lut[i * 3 + 2] = b;
  }
  return lut;
}
