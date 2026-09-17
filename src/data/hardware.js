// Afmetingen van hardware in cm, uit fabrikanttekeningen en specificaties
// (Gotoh-catalogus 2025, StewMac, Seymour Duncan, DiMarzio, Grover, Fender-
// en Gibson-specificaties, Graph Tech). Geschatte waarden staan erbij vermeld.

export const STRING_SPACING = Object.freeze({
  fender: { nut: 3.53, bridge: 5.636 },
  tele: { nut: 3.53, bridge: 5.397 },
  jazzmaster: { nut: 3.53, bridge: 5.556 },
  gibson: { nut: 3.58, bridge: 5.159 },
  prs: { nut: 3.67, bridge: 5.239 },
});

export const PICKUPS = Object.freeze({
  // Fender vintage Strat: zichtbare kap 6,99 x 1,78, voet 8,29 lang, hoogte 1,26.
  single: { width: 8.29, depth: 1.8, topWidth: 6.985, height: 1.26, poleDiameter: 0.495, poleSpacing: 1.048 },
  // Tele-brugelement: stalen voetplaat met spoel (geen kap).
  teleBridge: { plateWidth: 7.33, plateDepth: 3.85, bobbinWidth: 6.91, bobbinDepth: 1.96, height: 1.74 },
  // Gibson PAF-kap 6,97 x 3,80 x 1,59, hoekradius 0,32; poolafstand 4,92, rijafstand 1,89.
  humbucker: { width: 6.972, depth: 3.797, height: 1.587, radius: 0.318, poleSpacing: 0.984, rowSpacing: 1.892 },
  humbuckerRing: { width: 8.89, depth: 4.445, openingWidth: 6.985, openingDepth: 3.81, height: 0.95 },
  // P-90 soapbar 8,54 x 3,46 x 1,61, hoekradius 0,31.
  p90: { width: 8.54, depth: 3.46, height: 1.606, radius: 0.305, poleSpacing: 1.0 },
  // Jazzmaster-kap 8,97 x 3,85 x 1,27, hoekradius 0,25.
  jazzmaster: { width: 8.974, depth: 3.846, height: 1.27, radius: 0.254, poleSpacing: 1.021 },
});

export const KNOBS = Object.freeze({
  strat: { baseDiameter: 2.6, topDiameter: 1.7, height: 1.4, skirtHeight: 0.35 },
  dome: { diameter: 1.918, height: 1.854, knurlHeight: 1.143, domeHeight: 0.635 },
  tophat: { skirtDiameter: 2.54, skirtHeight: 0.457, topDiameter: 1.803, height: 1.448, insertDiameter: 1.575 },
  speed: { diameter: 2.388, height: 1.27 },
  witch: { skirtDiameter: 2.413, topDiameter: 1.143, height: 1.778 },
  lampshade: { diameter: 2.388, height: 1.27 },
});

export const SWITCHES = Object.freeze({
  blade: { slotLength: 2.699, slotWidth: 0.483, leverAbove: 0.889, tipHeight: 1.397, tipWidth: 1.143, tipThickness: 0.711 },
  toggle: { washerDiameter: 3.373, washerThickness: 0.1, nutDiameter: 1.587, nutHeight: 0.508, leverLength: 1.191, leverDiameter: 0.318, tipLength: 1.6, tipDiameter: 1.016 },
});

export const TUNERS = Object.freeze({
  // Kluson 6-op-een-rij (Fender): behuizing 2,53 x 1,65 x 0,94, ovale knop 1,76 x 1,40 x 0,60.
  kluson: { housingLength: 2.53, housingWidth: 1.65, housingHeight: 0.938, postDiameter: 0.635, postHeight: 1.6, bushingDiameter: 1.1, buttonWidth: 1.76, buttonHeight: 1.4, buttonThickness: 0.6, buttonReach: 2.64 },
  // Kluson 3+3 (Gibson): langere behuizing, keystone-knop.
  kluson3: { housingLength: 3.265, housingWidth: 1.625, housingHeight: 0.938, postDiameter: 0.634, postHeight: 1.7, bushingDiameter: 1.133, buttonWidth: 1.828, buttonHeight: 1.45, buttonThickness: 0.55, buttonReach: 2.636 },
  // PRS SE: vleugelknop ~2,0 x 1,7 x 0,5 (geschat uit productinformatie).
  prs: { housingLength: 1.9, housingWidth: 1.55, housingHeight: 1.15, postDiameter: 0.6, postHeight: 1.6, bushingDiameter: 1.1, buttonWidth: 2.0, buttonHeight: 1.7, buttonThickness: 0.5, buttonReach: 2.4 },
});

export const BRIDGES = Object.freeze({
  stratTremolo: { plateWidth: 8.35, plateDepth: 4.0, plateThickness: 0.2, saddleWidth: 1.13, saddleLength: 2.05, saddleHeight: 0.55, pivotScrewSpacing: 5.6, armDiameter: 0.5, armLength: 14.6, tipLength: 2.2, tipDiameter: 0.8 },
  prsTremolo: { plateWidth: 8.6, plateDepth: 4.4, plateThickness: 0.2, wallHeight: 0.7, saddleWidth: 1.05, saddleLength: 1.8, saddleHeight: 0.6, pivotScrewSpacing: 5.2, armDiameter: 0.45, armLength: 13.5, tipLength: 2.0, tipDiameter: 0.75 },
  teleAshtray: { plateWidth: 7.696, plateLength: 8.484, sheet: 0.122, wallHeight: 1.016, saddleDiameter: 0.8, saddleLength: 2.15, pickupAngleDeg: 17 },
  jazzmaster: { postSpacing: 7.303, baseLength: 9.0, baseWidth: 1.9, height: 1.2, saddleDiameter: 0.64, saddleLength: 0.95, plateWidth: 9.87, plateLength: 9.24 },
  abr1: { length: 8.45, width: 1.1, height: 1.07, postSpacing: 7.382, thumbwheelDiameter: 1.6, thumbwheelThickness: 0.3, saddleWidth: 0.75, saddleLength: 0.65 },
  stopbar: { length: 10.2, depth: 1.8, height: 1.3, studSpacing: 8.255, behindBridge: 3.81, studDiameter: 1.13 },
  prsTwoPiece: { postSpacing: 7.4, length: 8.4, width: 1.2, height: 1.1, tailStudSpacing: 7.9, tailLength: 9.8, tailDepth: 1.7, tailHeight: 1.3 },
});

export const INLAYS = Object.freeze({
  dotDiameter: 0.635,
  doubleDotSpacing: { fender: 2.152, gibson: 2.2, prs: 2.2 },
  // Gibson-trapezia: breedste kant naar de topkam. [breed, smal, lengte] per fretgroep.
  trapezoids: [
    { frets: [1, 3, 5], wide: 2.978, narrow: 2.105, length: 1.665 },
    { frets: [7, 9], wide: 3.257, narrow: 2.296, length: 1.365 },
    { frets: [12, 15], wide: 3.621, narrow: 2.702, length: 1.0 },
    { frets: [17, 19, 21], wide: 4.0, narrow: 3.412, length: 0.6 },
  ],
});

export const FRET_WIRE = Object.freeze({
  fender: { width: 0.211, height: 0.114 },
  gibson: { width: 0.254, height: 0.114 },
  prs: { width: 0.264, height: 0.119 },
});

export const HEADSTOCK_DEFAULTS = Object.freeze({
  fender: { angleDeg: 0, thickness: 1.47, faceOffset: 1.09 },
  gibson: { angleDeg: 17, thickness: 1.48, faceOffset: 0.6 },
  prs: { angleDeg: 10, thickness: 1.58, faceOffset: 0.6 },
});
