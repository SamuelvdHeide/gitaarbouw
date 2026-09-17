// Camerastandpunten. Overzichtsstandpunten (`fit: true`) kiezen zelf een
// afstand waarop de hele gitaar in beeld past; detailstandpunten gebruiken een
// vaste afstand tot het richtpunt (kop of body).

export const CAMERA_VIEWS = Object.freeze([
  { id: 'angled', label: 'Schuin', focus: 'center', direction: [0.34, -0.3, 0.9], fit: true },
  { id: 'front', label: 'Voor', focus: 'center', direction: [0, 0, 1], fit: true },
  { id: 'back', label: 'Achter', focus: 'center', direction: [0, 0, -1], fit: true },
  { id: 'side', label: 'Zijkant', focus: 'center', direction: [0, -1, 0.1], fit: true },
  { id: 'headstock', label: 'Kop', focus: 'headstock', direction: [0.35, -0.45, 1], distance: 62 },
  { id: 'body', label: 'Body', focus: 'body', direction: [0.1, -0.4, 1], distance: 92 },
]);

export function getCameraView(id) {
  const view = CAMERA_VIEWS.find((item) => item.id === id);
  if (!view) throw new Error(`Onbekend camerastandpunt: ${id}`);
  return view;
}

/**
 * Afstand waarop een object met `size` (breedte, hoogte, diepte) past in een
 * perspectiefcamera met verticale `fovDegrees` en beeldverhouding `aspect`.
 */
export function fitDistance({ width, height, depth }, fovDegrees, aspect, margin = 1.12) {
  if (!(fovDegrees > 0 && aspect > 0)) throw new Error('Ongeldige camera-instellingen');
  const halfTan = Math.tan((fovDegrees * Math.PI) / 360);
  const byWidth = (width * margin) / 2 / (halfTan * aspect);
  const byHeight = (height * margin) / 2 / halfTan;
  return Math.max(byWidth, byHeight) + depth / 2;
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
