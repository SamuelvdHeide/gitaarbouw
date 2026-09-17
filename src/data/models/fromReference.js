import { HEADSTOCK_DEFAULTS, STRING_SPACING } from '../hardware.js';
import { pointInPolygon } from '../../geometry/polygon.js';

// Zet een gemeten referentiebestand (src/data/references/*.json, afgeleid van
// 1:1-mallen) om naar het modelformaat dat de 3D-opbouw gebruikt.

const DEG = Math.PI / 180;
const PICKUP_CLASS = Object.freeze({ single: 'single', humbucker: 'humbucker', p90: 'p90' });

function pickupClass(type) {
  const text = String(type).toLowerCase();
  if (text.includes('humbucker')) return PICKUP_CLASS.humbucker;
  if (text.includes('p90') || text.includes('p-90') || text.includes('soapbar')) return PICKUP_CLASS.p90;
  return PICKUP_CLASS.single;
}

export function pickupSlotsFrom(reference) {
  const saddle = reference.bridge.saddleLineY;
  const bySlot = Object.fromEntries(reference.pickups.map((pickup) => [pickup.slot, pickup]));
  const distance = (slot) => (bySlot[slot] ? bySlot[slot].center[1] - saddle : null);
  const neck = distance('neck');
  const bridge = distance('bridge');
  if (neck === null || bridge === null) throw new Error(`Referentie ${reference.id} mist hals- of brugelement`);
  return Object.freeze({ neck, middle: distance('middle') ?? (neck + bridge) / 2, bridge });
}

/** Schuine elementen gelden alleen voor hetzelfde soort element als in de referentie. */
export function pickupAnglesFrom(reference) {
  return Object.freeze(Object.fromEntries(reference.pickups
    .filter((pickup) => Math.abs(pickup.angleDeg ?? 0) > 0.5)
    .map((pickup) => [pickup.slot, { type: pickupClass(pickup.type), angle: pickup.angleDeg * DEG }])));
}

export function headstockFrom(reference, brand) {
  const source = reference.headstock;
  const defaults = HEADSTOCK_DEFAULTS[brand] ?? HEADSTOCK_DEFAULTS.fender;
  const posts = source.posts;
  return Object.freeze({
    outline: source.outline,
    posts,
    thickness: source.thickness ?? defaults.thickness,
    angleDeg: source.backAngleDeg ?? defaults.angleDeg,
    faceOffset: source.faceOffsetBelowFretboardTop ?? defaults.faceOffset,
    trussRodCover: source.trussRodCover?.outline ?? null,
    stringTrees: source.stringTree ? [source.stringTree] : (source.stringTrees ?? []),
    keySide: posts.every(([x]) => x < 0.5) ? -1 : 0,
  });
}

export function controlsFrom(reference) {
  const { controls } = reference;
  const rhythm = reference.rhythmPlate;
  return Object.freeze({
    knobs: controls.knobs,
    switch: {
      type: controls.switch.type,
      position: controls.switch.position,
      // Bij een blade-schakelaar is angleDeg de richting van de sleuf (90 = langs de hals).
      angle: ((controls.switch.angleDeg ?? 0) - (controls.switch.type === 'blade' ? 90 : 0)) * DEG,
    },
    plates: [controls.controlPlate, rhythm].filter(Boolean).map(({ outline }) => ({ outline })),
    rollers: rhythm?.rollers?.map(({ center, wheelDiameter, wheelThickness }) => ({ position: center, diameter: wheelDiameter, thickness: wheelThickness })) ?? [],
    sliders: rhythm?.slideSwitch ? [{ position: rhythm.slideSwitch.center, size: rhythm.slideSwitch.slotSize }] : [],
    jack: controls.jack ?? null,
  });
}

/** Het deel van een cirkelboog dat binnen de body valt, als open lijn. */
export function arcInside({ center: [cx, cy], radius }, outline, steps = 180) {
  const points = Array.from({ length: steps }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
  const inside = points.map((point) => pointInPolygon(point, outline));
  const start = inside.findIndex((value, index) => value && !inside[(index - 1 + steps) % steps]);
  if (start < 0) return inside[0] ? points : [];
  const run = [];
  for (let offset = 0; offset < steps && inside[(start + offset) % steps]; offset += 1) run.push(points[(start + offset) % steps]);
  return run;
}

function boundaryOf(contour, outline) {
  if (Array.isArray(contour.boundaryLine)) return contour.boundaryLine;
  if (Array.isArray(contour.boundaryArc)) return contour.boundaryArc;
  if (contour.boundaryArc?.radius) return arcInside(contour.boundaryArc, outline);
  return contour.boundary;
}

/** Afschuiningen (SG) als grenslijn-kenmerken: `innerEdge` is waar het vlakke deel overgaat. */
function bevelsFrom(reference) {
  return (reference.body.bevels ?? [])
    .filter((bevel) => Array.isArray(bevel.innerEdge) && bevel.innerEdge.length >= 2)
    .map(({ face, innerEdge, depth }) => ({ face, boundary: innerEdge, depth, profile: 'flat' }));
}

function contoursFrom(reference) {
  return (reference.body.contours ?? [])
    .map((contour) => ({ ...contour, boundary: boundaryOf(contour, reference.body.outline) }))
    .filter((contour) => Array.isArray(contour.boundary) && contour.boundary.length >= 2)
    .map(({ face, boundary, depth, profile }) => ({ face, boundary, depth, profile: profile ?? 'round' }));
}

/**
 * @param {object} reference gemeten referentie
 * @param {object} spec modelkeuzes die niet uit een mal komen (naam, brugtype, klassieke uitvoering)
 *   en eventuele overschrijvingen (bijv. een carve-profiel dat uit tekst is vertaald).
 */
export function modelFromReference(reference, spec) {
  const { body: bodyOverrides = {}, stringSpacing: spacingKey, headstockOverrides = {}, pickguardRaised, ...rest } = spec;
  return Object.freeze({
    scaleLength: reference.scaleLength,
    fretCount: reference.fretCount,
    nutWidth: reference.nutWidth,
    heelWidth: reference.fretboardWidthAtLastFret,
    fretboardRadius: reference.fretboardRadius,
    neckJoint: reference.neck.joint,
    neckAngleDeg: reference.neck.neckAngleDeg ?? 0,
    neckDepth: { first: reference.neck.depthAt1stFret, twelfth: reference.neck.depthAt12thFret },
    fretboardEndY: reference.neck.fretboardEndY,
    heelEndY: reference.neck.heelEndY ?? reference.neck.fretboardEndY,
    bridgeY: reference.bridge.saddleLineY,
    bridgeDetails: reference.bridge.details ?? {},
    stringSpacing: typeof spacingKey === 'object' ? spacingKey : STRING_SPACING[spacingKey ?? spec.brand] ?? STRING_SPACING.fender,
    headstock: Object.freeze({ ...headstockFrom(reference, spec.brand), ...headstockOverrides }),
    body: Object.freeze({
      outline: reference.body.outline,
      thickness: reference.body.thickness,
      edgeRadius: reference.body.edgeRadius,
      carve: null,
      bevels: bevelsFrom(reference),
      contours: contoursFrom(reference),
      binding: null,
      ...bodyOverrides,
    }),
    pickguard: reference.pickguard
      ? {
        raised: pickguardRaised ?? Boolean(reference.pickguard.raised),
        outline: reference.pickguard.outline,
        holes: (reference.pickguard.cutouts ?? []).map(({ outline }) => outline).filter(Boolean),
        screws: reference.pickguard.screwHoles ?? null,
        thickness: reference.pickguard.thickness ?? null,
      }
      : null,
    pickupSlots: pickupSlotsFrom(reference),
    pickupAngles: pickupAnglesFrom(reference),
    controls: controlsFrom(reference),
    strapButtons: reference.strapButtons,
    sources: reference.sources,
    ...rest,
  });
}
