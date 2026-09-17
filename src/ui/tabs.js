import { BRANDS, MODELS, getModel } from '../data/models/index.js';
import { BODY_WOOD_IDS, FRETBOARD_WOOD_IDS, NECK_WOOD_IDS, TOP_WOOD_IDS, getWood } from '../data/woods.js';
import { BURSTS, FINISH_TYPES, SOLID_COLORS, TRANSPARENT_COLORS, findColor } from '../data/finishes.js';
import {
  HARDWARE_FINISHES,
  KNOB_COLORS,
  KNOB_STYLES,
  PICKGUARDS,
  PICKUP_CONFIGS,
  PICKUP_COVERS,
  findById,
} from '../data/parts.js';
import { burstGradient, knobIcon, metalGradient, modelSilhouette, pickupConfigIcon, plasticSwatchUrl, woodSwatchUrl } from './previews.js';

// Beschrijft per tabblad welke keuzegroepen er zijn. Een groep is puur data;
// panel.js maakt er de knoppen van.

export const TABS = Object.freeze([
  { id: 'model', label: 'Model' },
  { id: 'wood', label: 'Hout' },
  { id: 'color', label: 'Kleur' },
  { id: 'pickups', label: 'Pickups' },
  { id: 'knobs', label: 'Knoppen' },
]);

const woodOption = (id) => {
  const wood = getWood(id);
  return { value: id, label: wood.label, hint: wood.hint, visual: { image: woodSwatchUrl(id) } };
};

const colorOption = ({ id, label, hex, metallic }) => ({
  value: hex, label, key: id, visual: { background: metallic ? `radial-gradient(circle at 30% 30%, #ffffff66, ${hex} 55%)` : hex },
});

const selectedLabel = (options, value) => options.find((option) => option.value === value)?.label ?? 'Eigen kleur';

function group(definition) {
  const selected = definition.options.find((option) => option.value === definition.value);
  return { ...definition, current: definition.current ?? selected?.label ?? '' };
}

function modelGroups(design) {
  const sections = BRANDS.map((brand) => ({
    title: brand.label,
    options: MODELS.filter((model) => model.brand === brand.id).map((model) => ({
      value: model.id,
      label: model.label,
      visual: { node: () => modelSilhouette(model) },
    })),
  }));
  return [{
    id: 'model',
    title: 'Model',
    field: 'model',
    variant: 'silhouette',
    value: design.model,
    current: getModel(design.model).label,
    note: getModel(design.model).sourceNote ?? 'Contour benaderd uit foto’s en gepubliceerde maten; nog niet uit een 1:1-mal gemeten.',
    options: sections.flatMap((section) => section.options),
    sections,
  }];
}

function woodGroups(design) {
  const topOptions = TOP_WOOD_IDS.map((id) => (id === 'none'
    ? { value: 'none', label: 'Geen', hint: 'massief', visual: { empty: true } }
    : woodOption(id)));
  return [
    group({ id: 'bodyWood', title: 'Body', field: 'bodyWood', variant: 'wood', value: design.bodyWood, note: getWood(design.bodyWood).note, options: BODY_WOOD_IDS.map(woodOption) }),
    group({
      id: 'topWood', title: 'Topfineer', field: 'topWood', variant: 'wood', value: design.topWood,
      note: design.topWood === 'none' ? 'Een dun fineer op de voorkant, zichtbaar bij transparante lak en sunburst.' : getWood(design.topWood).note,
      options: topOptions,
    }),
    group({ id: 'neckWood', title: 'Hals', field: 'neckWood', variant: 'wood', value: design.neckWood, note: getWood(design.neckWood).note, options: NECK_WOOD_IDS.map(woodOption) }),
    group({ id: 'fretboardWood', title: 'Toets', field: 'fretboardWood', variant: 'wood', value: design.fretboardWood, note: getWood(design.fretboardWood).note, options: FRETBOARD_WOOD_IDS.map(woodOption) }),
  ];
}

function finishColorGroup(design) {
  if (design.finishType === 'burst') {
    const options = BURSTS.map((burst) => ({ value: burst.id, label: burst.label, visual: { background: burstGradient(burst.stops) } }));
    return group({ id: 'burst', title: 'Sunburst', field: 'burst', variant: 'color', value: design.burst, options });
  }
  if (design.finishType === 'natural' || design.finishType === 'raw') return null;
  const isSolid = design.finishType === 'solid';
  const field = isSolid ? 'solidColor' : 'transColor';
  const value = design[field];
  const options = (isSolid ? SOLID_COLORS : TRANSPARENT_COLORS).map(colorOption);
  const preset = findColor(isSolid ? SOLID_COLORS : TRANSPARENT_COLORS, value);
  return group({
    id: field, title: 'Lakkleur', field, variant: 'color', value: preset?.hex ?? value, custom: true,
    current: selectedLabel(options, preset?.hex ?? value), options,
  });
}

function colorGroups(design) {
  const finishType = findById(FINISH_TYPES, design.finishType);
  return [
    group({
      id: 'finishType', title: 'Afwerking', field: 'finishType', variant: 'segmented', value: design.finishType, note: finishType.note,
      options: FINISH_TYPES.map(({ id, label }) => ({ value: id, label })),
    }),
    finishColorGroup(design),
    getModel(design.model).pickguard ? null : {
      id: 'pickguard', title: 'Slagplaat', field: 'pickguard', variant: 'swatch', value: 'none', current: '', options: [],
      note: 'Dit model heeft geen slagplaat; de elementen en knoppen zitten direct op de body.',
    },
    getModel(design.model).pickguard && group({
      id: 'pickguard', title: 'Slagplaat', field: 'pickguard', variant: 'swatch', value: design.pickguard,
      options: PICKGUARDS.map((item) => ({
        value: item.id,
        label: item.label,
        visual: item.id === 'none' ? { empty: true } : item.pattern ? { image: plasticSwatchUrl(item.pattern) } : { background: item.cap },
      })),
    }),
  ].filter(Boolean);
}

function pickupGroups(design) {
  const config = findById(PICKUP_CONFIGS, design.pickupConfig);
  return [
    group({
      id: 'pickupConfig', title: 'Configuratie', field: 'pickupConfig', variant: 'icon', value: design.pickupConfig, note: config.note,
      options: PICKUP_CONFIGS.map((item) => ({ value: item.id, label: item.label, visual: { node: () => pickupConfigIcon(item) } })),
    }),
    group({
      id: 'pickupCover', title: 'Kappen', field: 'pickupCover', variant: 'swatch', value: design.pickupCover,
      options: PICKUP_COVERS.map((item) => ({
        value: item.id,
        label: item.label,
        visual: { background: item.metal ? metalGradient(findById(HARDWARE_FINISHES, design.hardware).color) : item.secondary ? `linear-gradient(90deg, ${item.color} 50%, ${item.secondary} 50%)` : item.color },
      })),
    }),
  ];
}

function knobGroups(design) {
  return [
    group({
      id: 'knobStyle', title: 'Vorm', field: 'knobStyle', variant: 'icon', value: design.knobStyle,
      note: findById(KNOB_STYLES, design.knobStyle).note,
      options: KNOB_STYLES.map((item) => ({ value: item.id, label: item.label, visual: { node: () => knobIcon(item.id) } })),
    }),
    group({
      id: 'knobColor', title: 'Kleur', field: 'knobColor', variant: 'swatch', value: design.knobColor,
      options: KNOB_COLORS.map((item) => ({
        value: item.id,
        label: item.label,
        visual: { background: item.metal ? metalGradient(findById(HARDWARE_FINISHES, item.metal).color) : item.color },
      })),
    }),
    group({
      id: 'hardware', title: 'Metaaldelen', field: 'hardware', variant: 'swatch', value: design.hardware,
      note: 'Brug, stemmechanieken, schroeven en metalen kappen.',
      options: HARDWARE_FINISHES.map((item) => ({ value: item.id, label: item.label, visual: { background: metalGradient(item.color) } })),
    }),
  ];
}

const BUILDERS = Object.freeze({ model: modelGroups, wood: woodGroups, color: colorGroups, pickups: pickupGroups, knobs: knobGroups });

export function groupsForTab(tabId, design) {
  const builder = BUILDERS[tabId];
  if (!builder) throw new Error(`Onbekend tabblad: ${tabId}`);
  return builder(design);
}
