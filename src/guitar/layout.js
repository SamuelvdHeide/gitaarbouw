import { sampleClosedCurve } from '../geometry/spline.js';
import { boundsOf, verticalExtent } from '../geometry/polygon.js';
import { clamp, fretPositions, lerp } from '../geometry/fretMath.js';
import { PICKUP_CONFIGS, findById } from '../data/parts.js';
import { BRIDGES, PICKUPS, STRING_SPACING } from '../data/hardware.js';

export const FRETBOARD_OVERHANG = 0.6;

// Buitenmaten (cm) van de elementen, gemeten dwars (width) en langs de snaren (depth).
export const PICKUP_FOOTPRINTS = Object.freeze({
  single: { width: PICKUPS.single.width, depth: PICKUPS.single.depth },
  humbucker: {
    width: PICKUPS.humbucker.width,
    depth: PICKUPS.humbucker.depth,
    ring: { width: PICKUPS.humbuckerRing.width, depth: PICKUPS.humbuckerRing.depth },
  },
  p90: { width: PICKUPS.p90.width, depth: PICKUPS.p90.depth },
  jazzmaster: { width: PICKUPS.jazzmaster.width, depth: PICKUPS.jazzmaster.depth },
  teleBridge: { width: PICKUPS.teleBridge.plateWidth, depth: PICKUPS.teleBridge.plateDepth },
  teleNeck: { width: 7.95, depth: 1.45 },
});

const DENSE_OUTLINE_POINTS = 60;

/**
 * Contour als polygoon. Handgetekende contouren (weinig punten) worden glad
 * bemonsterd; gemeten contouren uit mallen (veel punten) blijven vrijwel gelijk.
 */
export function sampleOutline(points, samplesPerSegment = 10) {
  const dense = points.length >= DENSE_OUTLINE_POINTS;
  return sampleClosedCurve(points, dense ? 1 : samplesPerSegment);
}

/** Vult optionele body-velden aan zodat de opbouw er zonder controles mee kan werken. */
export function normalizeBody(body) {
  if (!(body.thickness > 0) || !(body.edgeRadius >= 0)) throw new Error('Body mist dikte of randradius');
  return Object.freeze({
    ...body,
    carve: body.carve ?? null,
    bevels: body.bevels ?? [],
    contours: body.contours ?? [],
    binding: body.binding ?? null,
  });
}

/** Einde van de toets aan de bodykant (gemeten, of berekend uit de laatste fret). */
export function fretboardEndYOf(model) {
  if (model.fretboardEndY !== undefined) return model.fretboardEndY;
  const nutY = model.bridgeY + model.scaleLength;
  return nutY - fretPositions(model.scaleLength, model.fretCount).at(-1) - FRETBOARD_OVERHANG;
}

/** Leidt alle 2D-posities af uit de modeldefinitie (body-coördinaten, cm). */
export function computeLayout(model) {
  const outline = sampleOutline(model.body.outline, 10);
  const nutY = model.bridgeY + model.scaleLength;
  const fretYs = fretPositions(model.scaleLength, model.fretCount).map((distance) => nutY - distance);
  const fretboardEndY = fretboardEndYOf(model);
  const pickguardOutline = model.pickguard ? sampleOutline(model.pickguard.outline, 8) : null;

  return Object.freeze({
    body: normalizeBody(model.body),
    outline,
    bounds: boundsOf(outline),
    bodyEdgeY: verticalExtent(outline, 0)?.[1] ?? boundsOf(outline).maxY,
    nutY,
    fretYs,
    fretboardEndY,
    pickguardOutline,
  });
}

/** Breedte van de hals op hoogte y (lineair van topkam naar hielkant). */
export function neckWidthAt(model, layout, y) {
  const t = clamp((layout.nutY - y) / (layout.nutY - layout.fretboardEndY), 0, 1.05);
  return lerp(model.nutWidth, model.heelWidth, t);
}

/** Welke maatvoering een elementtype op dit model krijgt (bijv. Jazzmaster-kap voor 'p90'). */
export function pickupStyle(model, type, slot) {
  return model.pickupStyle?.[`${slot}:${type}`] ?? model.pickupStyle?.[type] ?? type;
}

export function pickupFootprint(type) {
  const footprint = PICKUP_FOOTPRINTS[type];
  if (!footprint) throw new Error(`Onbekend elementtype: ${type}`);
  const outer = footprint.ring ?? footprint;
  return { width: outer.width, depth: outer.depth };
}

/** Posities van de elementen voor een configuratie op een model. */
export function pickupPlacements(model, configId) {
  const config = findById(PICKUP_CONFIGS, configId);
  return config.pickups.map(({ slot, type, angle: configAngle = 0 }) => {
    const distance = model.pickupSlots[slot];
    if (typeof distance !== 'number') throw new Error(`Model ${model.id} mist elementpositie ${slot}`);
    // Gemeten modellen: alleen schuin als hetzelfde soort element in de mal schuin staat.
    const measured = model.pickupAngles?.[slot];
    const angle = model.pickupAngles ? (measured?.type === type ? measured.angle : 0) : configAngle;
    const style = pickupStyle(model, type, slot);
    // Een groter element dan de mal voorziet schuift (zoals bij een echte frees) weg van de hals.
    const maxY = fretboardEndYOf(model) - pickupFootprint(style).depth / 2 - 0.1;
    return Object.freeze({ slot, type, style, angle, x: 0, y: Math.min(model.bridgeY + distance, maxY) });
  });
}

/** Stud-posities van een stopbar-staartstuk (gemeten of standaard 3,81 cm achter de brug). */
export function tailpieceStuds(model) {
  const details = model.bridgeDetails ?? {};
  const measured = details.stopbarStuds ?? details.stopbarStudCenters ?? details.stopTailStuds;
  if (Array.isArray(measured) && measured.length === 2) return measured;
  const isPrs = model.bridgeHardware === 'prsTwoPiece';
  const spacing = isPrs ? BRIDGES.prsTwoPiece.tailStudSpacing : BRIDGES.stopbar.studSpacing;
  const y = model.bridgeY - BRIDGES.stopbar.behindBridge;
  return [[-spacing / 2, y], [spacing / 2, y]];
}

/** Hoeken van een (gedraaide) rechthoek rond een middelpunt. */
export function footprintCorners({ x, y, angle }, { width, depth }) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [width / 2, depth / 2],
    [-width / 2, depth / 2],
  ].map(([dx, dy]) => [x + dx * cos - dy * sin, y + dx * sin + dy * cos]);
}

/** Stringposities (x) bij de topkam en de brug. */
export function stringSpread(model, count = 6) {
  const spacing = model.stringSpacing ?? STRING_SPACING[model.brand] ?? STRING_SPACING.fender;
  const nutSpan = Math.min(spacing.nut, model.nutWidth - 0.55);
  const bridgeSpan = spacing.bridge;
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1) - 0.5;
    return { nutX: t * nutSpan, bridgeX: t * bridgeSpan };
  });
}
