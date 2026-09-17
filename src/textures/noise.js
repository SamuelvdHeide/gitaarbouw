// Deterministische ruis zodat textuur en swatches altijd identiek zijn.

export function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createValueNoise(seed = 1) {
  const random = mulberry32(seed);
  const values = Float32Array.from({ length: 256 }, () => random());
  const order = Array.from({ length: 256 }, (_, index) => index);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const perm = Uint8Array.from([...order, ...order]);

  const lattice = (ix, iy) => values[perm[(perm[ix & 255] + iy) & 255]];

  function noise(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const top = lattice(ix, iy) + (lattice(ix + 1, iy) - lattice(ix, iy)) * u;
    const bottom = lattice(ix, iy + 1) + (lattice(ix + 1, iy + 1) - lattice(ix, iy + 1)) * u;
    return top + (bottom - top) * v;
  }

  function fbm(x, y, octaves = 4) {
    let sum = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let norm = 0;
    for (let octave = 0; octave < octaves; octave += 1) {
      sum += noise(x * frequency + octave * 17.3, y * frequency - octave * 9.1) * amplitude;
      norm += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return sum / norm;
  }

  return Object.freeze({ noise, fbm });
}
