// Afwerkingen: hoe de body gelakt wordt.

export const FINISH_TYPES = Object.freeze([
  { id: 'raw', label: 'Puur hout', note: 'Onbehandeld hout: geen lak, geen kleur en geen glans. Ook hals en kop blijven kaal.' },
  { id: 'natural', label: 'Naturel', note: 'Heldere glanslak; het hout houdt zijn eigen kleur.' },
  { id: 'transparent', label: 'Transparant', note: 'Gekleurde lak waar de nerf doorheen schijnt.' },
  { id: 'solid', label: 'Dekkend', note: 'Egale kleur die het hout volledig bedekt.' },
  { id: 'burst', label: 'Sunburst', note: 'Verloop van een lichte kern naar een donkere rand.' },
]);

export const SOLID_COLORS = Object.freeze([
  { id: 'olympic-white', label: 'Olympic white', hex: '#EDE8D6' },
  { id: 'black', label: 'Zwart', hex: '#161616' },
  { id: 'fiesta-red', label: 'Fiesta red', hex: '#D9473E' },
  { id: 'candy-apple-red', label: 'Candy apple red', hex: '#A3161B', metallic: true },
  { id: 'lake-placid-blue', label: 'Lake placid blue', hex: '#274C8E', metallic: true },
  { id: 'sonic-blue', label: 'Sonic blue', hex: '#9CC3D5' },
  { id: 'stone-blue', label: 'Stone blue', hex: '#86A7BD' },
  { id: 'surf-green', label: 'Surf green', hex: '#93C9B1' },
  { id: 'moss-green', label: 'Moss green', hex: '#6F7F55' },
  { id: 'shell-pink', label: 'Shell pink', hex: '#EEC3B5' },
  { id: 'tv-yellow', label: 'TV yellow', hex: '#E6C95A' },
  { id: 'pelham-blue', label: 'Pelham blue', hex: '#5C8FB6', metallic: true },
  { id: 'goldtop', label: 'Goldtop', hex: '#C2A049', metallic: true },
  { id: 'inca-silver', label: 'Inca silver', hex: '#B8B9B6', metallic: true },
]);

export const TRANSPARENT_COLORS = Object.freeze([
  { id: 'butterscotch', label: 'Butterscotch blonde', hex: '#E3AE52' },
  { id: 'mary-kaye', label: 'Mary Kaye blonde', hex: '#EFE0B9' },
  { id: 'cherry', label: 'Cherry', hex: '#8A1A14' },
  { id: 'walnut-stain', label: 'Walnootbeits', hex: '#5C3A1E' },
  { id: 'turquoise', label: 'Turquoise', hex: '#1F8A8C' },
  { id: 'whale-blue', label: 'Whale blue', hex: '#2A5C8A' },
  { id: 'trans-green', label: 'Transparant groen', hex: '#3F7F4A' },
  { id: 'trans-black', label: 'Transparant zwart', hex: '#262626' },
]);

// Stops lopen van de rand (t = 0) naar het midden (t = 1).
export const BURSTS = Object.freeze([
  { id: 'three-tone', label: 'Three-tone sunburst', stops: [[0, '#140B07'], [0.22, '#2E1409'], [0.42, '#9A2A12'], [0.62, '#D48A2A'], [1, '#E8B44A']] },
  { id: 'two-tone', label: 'Two-tone sunburst', stops: [[0, '#0E0906'], [0.3, '#2A170C'], [0.55, '#7A4A1C'], [0.75, '#C98D3A'], [1, '#E2B35C']] },
  { id: 'cherry', label: 'Cherry sunburst', stops: [[0, '#2A0605'], [0.25, '#5C0F0C'], [0.48, '#8E1C16'], [0.7, '#C7702E'], [1, '#DCA24F']] },
  { id: 'tobacco', label: 'Tobacco burst', stops: [[0, '#120B07'], [0.25, '#2E1A0E'], [0.5, '#6A3A16'], [0.75, '#B8762C'], [1, '#CAA05A']] },
  { id: 'honey', label: 'Honey burst', stops: [[0, '#5A3413'], [0.25, '#9A5C22'], [0.55, '#CF8F3A'], [0.8, '#E6B760'], [1, '#ECC97C']] },
  { id: 'faded-blue', label: 'Faded blue burst', stops: [[0, '#0B1426'], [0.3, '#1C3A6E'], [0.6, '#3F77A8'], [0.85, '#86B2CC'], [1, '#A9C9D6']] },
  { id: 'charcoal', label: 'Charcoal burst', stops: [[0, '#0A0A0A'], [0.3, '#1E1E1E'], [0.6, '#4A4A48'], [0.85, '#7C7A74'], [1, '#8E8B83']] },
]);

export function findColor(list, hex) {
  const normalized = String(hex).toUpperCase();
  return list.find((color) => color.hex.toUpperCase() === normalized) ?? null;
}

export function getBurst(id) {
  const burst = BURSTS.find((item) => item.id === id);
  if (!burst) throw new Error(`Onbekende sunburst: ${id}`);
  return burst;
}
