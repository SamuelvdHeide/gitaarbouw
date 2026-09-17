import * as THREE from 'three';

// Fotostudio voor reflecties: donkere omgeving met een paar softboxen, zodat
// lak en chroom glimmen zonder dat donkere kleuren uitwassen.

const GRADIENT = [
  { y: -1, color: new THREE.Color(0.02, 0.02, 0.02) },
  { y: 0, color: new THREE.Color(0.1, 0.1, 0.1) },
  { y: 1, color: new THREE.Color(0.24, 0.245, 0.24) },
];

function gradientColor(y) {
  const upper = y >= 0 ? GRADIENT[2] : GRADIENT[1];
  const lower = y >= 0 ? GRADIENT[1] : GRADIENT[0];
  const t = y >= 0 ? y : y + 1;
  return lower.color.clone().lerp(upper.color, t);
}

function createDome() {
  const geometry = new THREE.SphereGeometry(100, 32, 16);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    gradientColor(position.getY(i) / 100).toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }));
}

function softbox(width, height, intensity, position) {
  const material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(intensity), side: THREE.DoubleSide });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  panel.position.set(...position);
  panel.lookAt(0, 0, 0);
  return panel;
}

export function createStudioScene() {
  const scene = new THREE.Scene();
  scene.add(
    createDome(),
    softbox(70, 34, 3.2, [-45, 55, 55]),
    softbox(14, 90, 2.2, [80, 5, 25]),
    softbox(50, 50, 0.9, [0, 90, -20]),
    softbox(30, 12, 1.4, [-70, -10, -60]),
  );
  return scene;
}

export function disposeStudioScene(scene) {
  scene.traverse((node) => {
    node.geometry?.dispose();
    node.material?.dispose();
  });
}
