import * as THREE from 'three';
import { boundsOf, pointsAlongPerimeter } from '../../geometry/polygon.js';
import { applyPlanarUVs, extrudePolygon, group, mesh } from '../../scene/threeHelpers.js';

const THICKNESS = 0.23;
const RAISED_GAP = 0.45;
const SCREW_SPACING_CM = 8.5;

function baseHeight(outline, surfaceZ, raised) {
  const highest = outline.reduce((max, [x, y]) => Math.max(max, surfaceZ(x, y)), -Infinity);
  return highest + (raised ? RAISED_GAP : 0.01);
}

function perimeter(outline) {
  return outline.reduce((sum, [x, y], index) => {
    const [nx, ny] = outline[(index + 1) % outline.length];
    return sum + Math.hypot(nx - x, ny - y);
  }, 0);
}

/** Slagplaat met schroefjes; geeft ook de contour en hoogte terug voor andere onderdelen. */
export function buildPickguard({ model, layout, materials, surfaceZ, design }) {
  if (design.pickguard === 'none' || !layout.pickguardOutline) return null;
  const outline = layout.pickguardOutline;
  const spec = model.pickguard;
  const thickness = spec.thickness ?? THICKNESS;
  const baseZ = baseHeight(outline, surfaceZ, spec.raised);

  const geometry = extrudePolygon(outline, { depth: thickness, bevel: 0.05, bevelSegments: 2, holes: spec.holes ?? [] });
  applyPlanarUVs(geometry, boundsOf(outline));
  const plate = mesh(geometry, [materials.pickguardCap, materials.pickguardEdge]);
  plate.position.z = baseZ;

  const screwPositions = spec.screws ?? pointsAlongPerimeter(outline, Math.max(4, Math.round(perimeter(outline) / SCREW_SPACING_CM)), 0.45);
  const screws = screwPositions.map(([x, y]) => {
    const geometryScrew = new THREE.SphereGeometry(0.2, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    geometryScrew.rotateX(Math.PI / 2);
    geometryScrew.scale(1, 1, 0.5);
    const screw = mesh(geometryScrew, materials.hardware, { castShadow: false });
    screw.position.set(x, y, baseZ + thickness);
    return screw;
  });

  return {
    object: group('slagplaat', [plate, ...screws]),
    outline,
    holes: spec.holes ?? [],
    topZ: baseZ + thickness,
  };
}
