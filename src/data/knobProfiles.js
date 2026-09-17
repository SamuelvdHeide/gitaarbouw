// Knopprofielen als [straal, hoogte] van onder naar boven (cm), afgeleid van de
// gemeten maten in hardware.js. Het 3D-model draait ze rond (lathe); het paneel
// tekent er het zijaanzicht mee.
import { KNOBS } from './hardware.js';

const { strat, dome, tophat, speed, witch, lampshade } = KNOBS;

export const KNOB_PROFILES = Object.freeze({
  strat: {
    profile: [
      [0, 0], [strat.baseDiameter / 2, 0], [strat.baseDiameter / 2, 0.1], [strat.baseDiameter / 2 - 0.06, strat.skirtHeight - 0.05],
      [1.0, strat.skirtHeight], [0.97, strat.skirtHeight + 0.08], [strat.topDiameter / 2, strat.height - 0.1],
      [strat.topDiameter / 2 - 0.06, strat.height - 0.02], [0.45, strat.height], [0, strat.height + 0.01],
    ],
    flutes: { count: 24, depth: 0.05, from: strat.skirtHeight + 0.1, to: strat.height - 0.12 },
  },
  dome: {
    profile: [
      [0, 0], [dome.diameter / 2, 0], [dome.diameter / 2, dome.knurlHeight], [dome.diameter / 2 - 0.04, dome.knurlHeight + 0.1],
      [0.82, dome.knurlHeight + 0.35], [0.58, dome.height - 0.12], [0.3, dome.height - 0.03], [0, dome.height],
    ],
    flutes: { count: 40, depth: 0.035, from: 0.05, to: dome.knurlHeight - 0.05 },
  },
  tophat: {
    profile: [
      [0, 0], [tophat.skirtDiameter / 2, 0], [tophat.skirtDiameter / 2 + 0.01, 0.12], [tophat.skirtDiameter / 2 - 0.08, tophat.skirtHeight - 0.05],
      [0.98, tophat.skirtHeight], [0.96, tophat.skirtHeight + 0.08], [tophat.topDiameter / 2, tophat.height - 0.05],
      [tophat.topDiameter / 2 - 0.03, tophat.height], [0, tophat.height],
    ],
    flutes: { count: 20, depth: 0.035, from: tophat.skirtHeight + 0.12, to: tophat.height - 0.1 },
    insert: { radius: tophat.insertDiameter / 2, z: tophat.height },
  },
  speed: {
    profile: [
      [0, 0], [speed.diameter / 2, 0], [speed.diameter / 2, 0.1], [speed.diameter / 2 - 0.17, speed.height - 0.12],
      [speed.diameter / 2 - 0.25, speed.height - 0.03], [0.6, speed.height], [0, speed.height],
    ],
    flutes: { count: 30, depth: 0.025, from: 0.15, to: speed.height - 0.2 },
  },
  witch: {
    profile: [
      [0, 0], [witch.skirtDiameter / 2, 0], [witch.skirtDiameter / 2 + 0.01, 0.1], [witch.skirtDiameter / 2 - 0.06, 0.3],
      [0.92, 0.36], [0.68, witch.height - 0.3], [witch.topDiameter / 2, witch.height - 0.08], [0.35, witch.height - 0.01], [0, witch.height],
    ],
    flutes: null,
  },
  lampshade: {
    profile: [
      [0, 0], [lampshade.diameter / 2, 0], [lampshade.diameter / 2 + 0.01, 0.08], [lampshade.diameter / 2 - 0.1, 0.35],
      [0.92, lampshade.height - 0.32], [0.86, lampshade.height - 0.09], [0.78, lampshade.height - 0.01], [0, lampshade.height],
    ],
    flutes: null,
  },
});
