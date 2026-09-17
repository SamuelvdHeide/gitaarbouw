import * as THREE from 'three';

/**
 * Verbindt gesloten doorsnedes (ringen) tot één oppervlak met eindkappen.
 * Ringen liggen langs +y; elke ring heeft evenveel [x, y, z]-punten, met de
 * volgorde rechts -> onder -> links zodat de normalen naar buiten wijzen.
 */
export function createLoftGeometry(rings, uvFor) {
  const ringSize = rings[0].length;
  if (rings.length < 2 || rings.some((ring) => ring.length !== ringSize)) {
    throw new Error('Een loft vraagt minimaal twee ringen met gelijke puntaantallen');
  }

  const positions = [];
  const uvs = [];
  const indices = [];

  rings.forEach((ring, ringIndex) => {
    ring.forEach((point, pointIndex) => {
      positions.push(...point);
      uvs.push(...uvFor(point, pointIndex, ringIndex));
    });
  });

  const at = (ringIndex, pointIndex) => ringIndex * ringSize + (pointIndex % ringSize);
  for (let r = 0; r < rings.length - 1; r += 1) {
    for (let p = 0; p < ringSize; p += 1) {
      indices.push(at(r, p), at(r, p + 1), at(r + 1, p));
      indices.push(at(r, p + 1), at(r + 1, p + 1), at(r + 1, p));
    }
  }

  const addCap = (ringIndex, facingForward) => {
    const ring = rings[ringIndex];
    const center = ring.reduce((sum, point) => sum.map((value, axis) => value + point[axis] / ringSize), [0, 0, 0]);
    const centerIndex = positions.length / 3;
    positions.push(...center);
    uvs.push(...uvFor(center, 0, ringIndex));
    for (let p = 0; p < ringSize; p += 1) {
      const a = at(ringIndex, p);
      const b = at(ringIndex, p + 1);
      indices.push(...(facingForward ? [centerIndex, a, b] : [centerIndex, b, a]));
    }
  };
  addCap(0, false);
  addCap(rings.length - 1, true);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
