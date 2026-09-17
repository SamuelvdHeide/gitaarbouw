import { createValueNoise } from './noise.js';

const TAU = Math.PI * 2;

function figureShade(figure, noise, fbm, u, v) {
  if (figure === 'flame') {
    const wave = v * 0.9 + fbm(u * 0.18, v * 0.05, 2) * 5 + u * 0.25;
    const band = 0.5 + 0.5 * Math.sin(wave * TAU);
    return (band * band - 0.33) * 0.42;
  }
  if (figure === 'quilt') {
    const blob = fbm(u * 0.55 + 3.1, v * 0.55, 3);
    return (Math.abs(Math.sin(blob * 22)) - 0.55) * 0.45;
  }
  return 0;
}

/**
 * Genereert RGBA-pixels met houtnerf. De nerf loopt langs de verticale as,
 * zodat v overeenkomt met de lengterichting van de gitaar.
 */
export function renderWoodPixels(wood, { width, height, pxPerCm, seed = 7 }) {
  if (!(width > 0 && height > 0 && pxPerCm > 0)) {
    throw new Error('Textuurmaten moeten positief zijn');
  }
  const { noise, fbm } = createValueNoise(seed);
  const pixels = new Uint8ClampedArray(width * height * 4);
  const [lr, lg, lb] = wood.light;
  const [dr, dg, db] = wood.dark;

  for (let py = 0; py < height; py += 1) {
    const v = py / pxPerCm;
    for (let px = 0; px < width; px += 1) {
      const u = px / pxPerCm;
      const warp = (fbm(u * 0.11, v * 0.028, 3) - 0.5) * wood.warp * 2;
      const ring = 0.5 + 0.5 * Math.sin((u + warp) * wood.lineFreq * TAU);
      const fiber = noise(u * 6.5, v * 0.3) - 0.5;
      const pore = wood.pores > 0 && noise(u * 16 + 91, v * 1.1) > 1 - wood.pores * 0.3 ? wood.pores : 0;

      const shade = Math.pow(ring, wood.lineSharpness) * wood.lineContrast
        + fiber * wood.fiberContrast
        + pore * 0.4
        + figureShade(wood.figure, noise, fbm, u, v);
      const t = Math.min(1, Math.max(0, shade));

      const index = (py * width + px) * 4;
      pixels[index] = lr + (dr - lr) * t;
      pixels[index + 1] = lg + (dg - lg) * t;
      pixels[index + 2] = lb + (db - lb) * t;
      pixels[index + 3] = 255;
    }
  }
  return pixels;
}
