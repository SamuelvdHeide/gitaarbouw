// Onderdelen: slagplaat, elementen, knoppen en metaaldelen.

export const PICKGUARDS = Object.freeze([
  { id: 'none', label: 'Geen' },
  { id: 'white', label: 'Wit', cap: '#F1EFE8', edge: '#2A2A2A' },
  { id: 'black', label: 'Zwart', cap: '#151515', edge: '#E8E6DF' },
  { id: 'mint', label: 'Mint', cap: '#E4E2C9', edge: '#2A2A2A' },
  { id: 'cream', label: 'Crème', cap: '#E6D7AE', edge: '#E6D7AE' },
  { id: 'tortoise', label: 'Schildpad', pattern: 'tortoise', edge: '#1C1512' },
  { id: 'pearl', label: 'Parelmoer', pattern: 'pearl', edge: '#EDEBE4' },
]);

export const PICKUP_CONFIGS = Object.freeze([
  {
    id: 'sss', label: 'SSS', note: 'Drie single coils: glashelder en funky.',
    pickups: [{ slot: 'neck', type: 'single' }, { slot: 'middle', type: 'single' }, { slot: 'bridge', type: 'single', angle: -0.14 }],
  },
  {
    id: 'hss', label: 'HSS', note: 'Humbucker bij de brug voor meer gain, single coils voor helderheid.',
    pickups: [{ slot: 'neck', type: 'single' }, { slot: 'middle', type: 'single' }, { slot: 'bridge', type: 'humbucker' }],
  },
  {
    id: 'hh', label: 'HH', note: 'Twee humbuckers: vet, warm en brom-vrij.',
    pickups: [{ slot: 'neck', type: 'humbucker' }, { slot: 'bridge', type: 'humbucker' }],
  },
  {
    id: 'ss', label: 'SS', note: 'Twee single coils: twangy en direct.',
    pickups: [{ slot: 'neck', type: 'single' }, { slot: 'bridge', type: 'single', angle: -0.14 }],
  },
  {
    id: 'p90', label: 'P-90', note: 'Twee P-90’s: rauw, dik en dynamisch.',
    pickups: [{ slot: 'neck', type: 'p90' }, { slot: 'bridge', type: 'p90' }],
  },
  {
    id: 'h', label: 'H', note: 'Eén humbucker bij de brug: simpel en krachtig.',
    pickups: [{ slot: 'bridge', type: 'humbucker' }],
  },
]);

export const PICKUP_COVERS = Object.freeze([
  { id: 'black', label: 'Zwart', color: '#151515' },
  { id: 'white', label: 'Wit', color: '#EEEBE2' },
  { id: 'cream', label: 'Crème', color: '#E6D7AE' },
  { id: 'zebra', label: 'Zebra', color: '#E6D7AE', secondary: '#151515' },
  { id: 'metal', label: 'Metalen kap', metal: true },
]);

export const KNOB_STYLES = Object.freeze([
  { id: 'strat', label: 'Strat-knop', note: 'Geribbelde knop met rok, zoals op een Stratocaster.' },
  { id: 'dome', label: 'Dome', note: 'Lage gekartelde knop met bolle bovenkant.' },
  { id: 'tophat', label: 'Top hat', note: 'Hoge Gibson-knop met rok en metalen kapje.' },
  { id: 'speed', label: 'Speed knob', note: 'Taps toelopende cilinder, snel te draaien.' },
  { id: 'witch', label: 'Witch hat', note: 'Puntige knop met brede rok.' },
  { id: 'lampshade', label: 'Lampshade', note: 'Uitlopende PRS-knop in de vorm van een lampenkap.' },
]);

export const KNOB_COLORS = Object.freeze([
  { id: 'white', label: 'Wit', color: '#ECE9DF' },
  { id: 'black', label: 'Zwart', color: '#181818' },
  { id: 'cream', label: 'Crème', color: '#E9DDB8' },
  { id: 'amber', label: 'Amber', color: '#C8871E', translucent: true },
  { id: 'chrome', label: 'Chroom', metal: 'chrome' },
  { id: 'gold', label: 'Goud', metal: 'gold' },
]);

export const HARDWARE_FINISHES = Object.freeze([
  { id: 'chrome', label: 'Chroom', color: '#E9EAEC', roughness: 0.12, metalness: 1 },
  { id: 'nickel', label: 'Nikkel', color: '#D5CFC0', roughness: 0.26, metalness: 1 },
  { id: 'black', label: 'Zwart', color: '#2A2A2A', roughness: 0.38, metalness: 0.7 },
  { id: 'gold', label: 'Goud', color: '#D9B25A', roughness: 0.2, metalness: 1 },
]);

export function findById(list, id) {
  const found = list.find((item) => item.id === id);
  if (!found) throw new Error(`Onbekende optie: ${id}`);
  return found;
}
