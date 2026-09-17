import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { easeInOutCubic, fitDistance, getCameraView } from './cameraViews.js';
import { createStudioScene, disposeStudioScene } from './studioEnvironment.js';

const FLY_DURATION_MS = 750;

function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Licht en gitaar staan stil ten opzichte van elkaar: schaduw alleen na een wissel.
  renderer.shadowMap.autoUpdate = false;
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  return renderer;
}

function createLights(scene) {
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(-70, 80, 150);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 3;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  Object.assign(key.shadow.camera, { left: -70, right: 70, top: 45, bottom: -45, near: 20, far: 400 });

  const rim = new THREE.DirectionalLight(0xffffff, 0.6);
  rim.position.set(90, -40, -120);

  scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x9aa09a, 0.55));
}

function createEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = createStudioScene();
  const target = pmrem.fromScene(studio, 0.02);
  disposeStudioScene(studio);
  pmrem.dispose();
  return target;
}

function focusPoint(guitar, focus) {
  if (!guitar || focus === 'center') return new THREE.Vector3(0, 0, 0);
  const part = guitar.getObjectByName(focus === 'headstock' ? 'kop-groep' : 'body');
  if (!part) return new THREE.Vector3();
  part.updateWorldMatrix(true, true);
  return new THREE.Box3().setFromObject(part).getCenter(new THREE.Vector3());
}

/**
 * 3D-weergave met orbit-besturing. Rendert alleen als er iets verandert
 * (camera, wissel, formaat) zodat een stilstaand ontwerp geen GPU kost.
 */
export function createViewer(container, { prefersReducedMotion, onContextLost, onContextRestored }) {
  const renderer = createRenderer(container);
  const scene = new THREE.Scene();
  const environment = createEnvironment(renderer);
  scene.environment = environment.texture;
  createLights(scene);

  const camera = new THREE.PerspectiveCamera(28, 1, 1, 2000);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 35, maxDistance: 420, autoRotateSpeed: 1.2 });

  let current = null;
  let flight = null;
  let needsRender = true;
  const requestRender = () => { needsRender = true; };

  function overviewDistance() {
    if (!current) return 200;
    const size = new THREE.Box3().setFromObject(current.object).getSize(new THREE.Vector3());
    return fitDistance({ width: size.x, height: size.y, depth: size.z }, camera.fov, camera.aspect);
  }

  function applyView(viewId, animate) {
    const view = getCameraView(viewId);
    const target = focusPoint(current?.object, view.focus);
    const distance = view.fit ? overviewDistance() : view.distance;
    const position = target.clone().add(new THREE.Vector3(...view.direction).normalize().multiplyScalar(distance));
    requestRender();
    if (!animate || prefersReducedMotion()) {
      flight = null;
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      return;
    }
    flight = { start: performance.now(), fromPosition: camera.position.clone(), fromTarget: controls.target.clone(), toPosition: position, toTarget: target };
  }

  function stepFlight(now) {
    if (!flight) return false;
    const t = Math.min(1, (now - flight.start) / FLY_DURATION_MS);
    const eased = easeInOutCubic(t);
    camera.position.lerpVectors(flight.fromPosition, flight.toPosition, eased);
    controls.target.lerpVectors(flight.fromTarget, flight.toTarget, eased);
    if (t === 1) flight = null;
    return true;
  }

  function resize() {
    const { clientWidth, clientHeight } = container;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    requestRender();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  controls.addEventListener('start', () => { flight = null; });
  controls.addEventListener('change', requestRender);

  const canvas = renderer.domElement;
  const handleContextLost = (event) => {
    event.preventDefault();
    onContextLost?.();
  };
  const handleContextRestored = () => {
    renderer.shadowMap.needsUpdate = true;
    requestRender();
    onContextRestored?.();
  };
  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);

  renderer.setAnimationLoop((now) => {
    const flying = stepFlight(now);
    const moved = controls.update();
    if (!flying && !moved && !needsRender) return;
    needsRender = false;
    renderer.render(scene, camera);
  });

  resize();
  applyView('angled', false);

  return Object.freeze({
    /** Voegt de nieuwe gitaar toe, compileert zijn shaders en ruimt dan pas de oude op. */
    setGuitar(built) {
      scene.add(built.object);
      renderer.compile(scene, camera);
      if (current) {
        scene.remove(current.object);
        current.dispose();
      }
      current = built;
      renderer.shadowMap.needsUpdate = true;
      requestRender();
    },
    currentModelId: () => current?.model.id ?? null,
    flyTo: (viewId) => applyView(viewId, true),
    setAutoRotate(enabled) {
      controls.autoRotate = enabled && !prefersReducedMotion();
      requestRender();
    },
    capture() {
      renderer.render(scene, camera);
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Kon geen afbeelding van de weergave maken'))), 'image/png');
      });
    },
    dispose() {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      controls.dispose();
      current?.dispose();
      environment.dispose();
      renderer.dispose();
    },
  });
}

export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    context?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}
