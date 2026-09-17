import * as THREE from 'three';
import { findColor, SOLID_COLORS } from '../data/finishes.js';
import { HARDWARE_FINISHES, KNOB_COLORS, PICKGUARDS, PICKUP_COVERS, findById } from '../data/parts.js';
import { faceMaskInset } from './parts/body.js';

export { NECK_TEXTURE_SIZE } from './textureFactory.js';

const lacquer = (options) => new THREE.MeshPhysicalMaterial({ roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, ...options });
const plastic = (color, options = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.3, ...options });

// Onbehandeld hout: mat, zonder lak of glans.
const RAW_WOOD_SURFACE = Object.freeze({ metalness: 0, roughness: 0.82, clearcoat: 0, clearcoatRoughness: 1 });

function metal(finish) {
  return new THREE.MeshStandardMaterial({ color: finish.color, metalness: finish.metalness, roughness: finish.roughness });
}

/**
 * Voor- en achterkant van de body. Dekkende lak heeft geen textuur nodig; de
 * overige afwerkingen mengen lak en nerf in een textuur.
 */
function bodyMaterials({ design, model, body, textures }) {
  const isSolid = design.finishType === 'solid';
  const isRaw = design.finishType === 'raw';
  const hasTop = design.topWood !== 'none';
  const solidPreset = isSolid ? findColor(SOLID_COLORS, design.solidColor) : null;
  const surface = isRaw
    ? RAW_WOOD_SURFACE
    : {
      metalness: solidPreset?.metallic ? 0.45 : 0,
      roughness: design.finishType === 'natural' ? 0.45 : 0.3,
      clearcoatRoughness: design.finishType === 'natural' ? 0.25 : 0.05,
    };
  const finish = {
    finishType: design.finishType,
    colorHex: design.finishType === 'transparent' ? design.transColor : undefined,
    burstId: design.finishType === 'burst' ? design.burst : undefined,
  };
  const colored = (woodId, finishOptions) => (isSolid
    ? { color: design.solidColor }
    : { map: textures.bodyFinish(woodId, finishOptions) });

  // Met een fineer-top blijven rug en zijkant naturel bij transparante lak of burst;
  // modellen met een eigen rugafwerking (Gibson-burst) krijgen die bij een sunburst.
  const modelBack = design.finishType === 'burst' ? model.burstBack : null;
  const backFinish = modelBack ?? (hasTop && !isRaw ? { finishType: 'natural' } : finish);
  const backLook = { ...surface, ...colored(design.bodyWood, backFinish) };

  return {
    bodyFront: lacquer({
      ...surface,
      ...colored(hasTop ? design.topWood : design.bodyWood, finish),
      alphaMap: textures.topMask(faceMaskInset(body)),
      alphaTest: 0.5,
    }),
    bodyBackFace: lacquer({ ...backLook, alphaMap: textures.topMask(faceMaskInset({ ...body, binding: null })), alphaTest: 0.5 }),
    bodySides: lacquer(backLook),
    binding: body.binding?.material === 'natural'
      ? lacquer({ ...(isRaw ? RAW_WOOD_SURFACE : {}), map: textures.wood('maple', isRaw ? 'raw' : 'natural') })
      : plastic('#E8DDBB', { clearcoat: 1 }),
  };
}

function knobMaterial(knobColor) {
  if (knobColor.metal) return metal(findById(HARDWARE_FINISHES, knobColor.metal));
  // Amber zonder `transmission`: dat zou elke frame een extra renderpass kosten.
  const translucentLook = knobColor.translucent ? { roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: '#F2B45A' } : {};
  return plastic(knobColor.color, { roughness: 0.3, clearcoat: 0.8, ...translucentLook });
}

function pickguardMaterials(textures, pickguard) {
  if (pickguard.id === 'none') return { pickguardCap: null, pickguardEdge: null };
  const cap = pickguard.pattern
    ? plastic('#FFFFFF', { map: textures.plastic(pickguard.pattern), clearcoat: 0.6, clearcoatRoughness: 0.25, roughness: 0.4 })
    : plastic(pickguard.cap, { clearcoat: 0.3, clearcoatRoughness: 0.35, roughness: 0.5 });
  return { pickguardCap: cap, pickguardEdge: plastic(pickguard.edge, { roughness: 0.4 }) };
}

/** Alle materialen voor één opbouw van de gitaar. */
export function createMaterialKit({ design, model, body, textures }) {
  const hardwareFinish = findById(HARDWARE_FINISHES, design.hardware);
  const cover = findById(PICKUP_COVERS, design.pickupCover);
  const knobColor = findById(KNOB_COLORS, design.knobColor);
  const pickguard = findById(PICKGUARDS, design.pickguard);
  const hardware = metal(hardwareFinish);
  const isMapleBoard = design.fretboardWood.includes('maple');
  const isRaw = design.finishType === 'raw';
  const neckFinish = isRaw ? 'raw' : 'natural';

  return {
    ...bodyMaterials({ design, model, body, textures }),
    ...pickguardMaterials(textures, pickguard),
    neck: new THREE.MeshPhysicalMaterial({
      map: textures.wood(design.neckWood, neckFinish),
      ...(isRaw ? RAW_WOOD_SURFACE : { roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
    }),
    headstockFace: new THREE.MeshPhysicalMaterial({
      map: textures.wood(design.neckWood, neckFinish),
      ...(isRaw ? RAW_WOOD_SURFACE : { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }),
    }),
    // Palissander, ebben en pau ferro zijn altijd onbehandeld; esdoorn is gelakt tenzij alles puur hout is.
    fretboard: new THREE.MeshPhysicalMaterial({
      map: textures.wood(design.fretboardWood, isMapleBoard && !isRaw ? 'natural' : 'raw'),
      ...(isMapleBoard && !isRaw ? { roughness: 0.35, clearcoat: 0.8 } : RAW_WOOD_SURFACE),
    }),
    hardware,
    nickel: metal(findById(HARDWARE_FINISHES, 'nickel')),
    strings: new THREE.MeshStandardMaterial({ color: '#D8D8D4', metalness: 1, roughness: 0.3 }),
    pickupCover: cover.metal ? hardware : plastic(cover.color, { roughness: 0.45, clearcoat: 0.2 }),
    pickupSecondary: cover.metal ? hardware : plastic(cover.secondary ?? cover.color, { roughness: 0.45, clearcoat: 0.2 }),
    pickupIsMetal: Boolean(cover.metal),
    ringPlastic: plastic(cover.id === 'cream' || cover.id === 'zebra' || pickguard.id === 'cream' ? '#E6D7AE' : '#141414'),
    knob: knobMaterial(knobColor),
    knobInsert: metal(findById(HARDWARE_FINISHES, knobColor.metal ? 'black' : design.hardware === 'gold' ? 'gold' : 'chrome')),
    blackPlastic: plastic('#141414'),
    headstockVeneer: lacquer({ color: '#0C0C0C', roughness: 0.25 }),
    creamPlastic: plastic('#E6D7AE'),
    fretboardBinding: plastic('#E8DDBB', { clearcoat: 1 }),
    nut: plastic('#EFE8D6', { roughness: 0.5, clearcoat: 0 }),
    inlay: plastic('#F4F1E8', { roughness: 0.25, clearcoat: 1 }),
    inlayDark: plastic('#1A1A1A', { roughness: 0.4 }),
  };
}
