import * as THREE from 'three';

export function shapeFromPolygon(points, holes = []) {
  const toPath = (PathType, polygon) => {
    const path = new PathType();
    path.moveTo(polygon[0][0], polygon[0][1]);
    polygon.slice(1).forEach(([x, y]) => path.lineTo(x, y));
    path.closePath();
    return path;
  };
  const shape = toPath(THREE.Shape, points);
  shape.holes = holes.map((hole) => toPath(THREE.Path, hole));
  return shape;
}

/** Zet UV's zo dat (x, y) binnen `bounds` precies op 0..1 valt. */
export function applyPlanarUVs(geometry, bounds) {
  const position = geometry.attributes.position;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i += 1) {
    uv[i * 2] = (position.getX(i) - bounds.minX) / bounds.width;
    uv[i * 2 + 1] = (position.getY(i) - bounds.minY) / bounds.height;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

/**
 * Extrudeert een polygoon van z = 0 tot z = depth, met optionele afronding
 * die binnen de contour blijft (de buitenmaat verandert niet).
 */
export function extrudePolygon(points, { depth, bevel = 0, bevelSegments = 3, holes = [] }) {
  const safeBevel = Math.min(bevel, depth / 2 - 0.001);
  const geometry = new THREE.ExtrudeGeometry(shapeFromPolygon(points, holes), {
    depth: Math.max(0.001, depth - safeBevel * 2),
    bevelEnabled: safeBevel > 0,
    bevelThickness: safeBevel,
    bevelSize: safeBevel,
    bevelOffset: -safeBevel,
    bevelSegments,
    curveSegments: 1,
  });
  geometry.translate(0, 0, Math.max(0, safeBevel));
  return geometry;
}

const UP = new THREE.Vector3(0, 1, 0);

/** Cilinder tussen twee punten (voor snaren, assen en armen). */
export function cylinderBetween(start, end, radius, material, radialSegments = 6) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const direction = b.clone().sub(a);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1, true);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UP, direction.normalize());
  return mesh;
}

/** Lathe-geometrie met de as langs +z en de basis op z = 0. */
export function latheAlongZ(profile, segments = 48) {
  const geometry = new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), segments);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function mesh(geometry, material, { castShadow = true, receiveShadow = true } = {}) {
  const result = new THREE.Mesh(geometry, material);
  result.castShadow = castShadow;
  result.receiveShadow = receiveShadow;
  return result;
}

export function group(name, children = []) {
  const result = new THREE.Group();
  result.name = name;
  children.forEach((child) => result.add(child));
  return result;
}

/** Ruimt geometrieën en (niet-gedeelde) materialen van een object op. */
export function disposeObject(root, { keepTextures = true } = {}) {
  const materials = new Set();
  root.traverse((node) => {
    if (node.geometry) node.geometry.dispose();
    const nodeMaterials = Array.isArray(node.material) ? node.material : [node.material];
    nodeMaterials.filter(Boolean).forEach((material) => materials.add(material));
  });
  materials.forEach((material) => {
    if (!keepTextures) {
      Object.values(material).forEach((value) => value?.isTexture && value.dispose());
    }
    material.dispose();
  });
}
