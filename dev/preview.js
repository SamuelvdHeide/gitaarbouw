// Ontwikkelpagina: rendert modellen naast elkaar om vormen snel te controleren.
// Gebruik: /dev/preview.html?view=front&models=strat,lespaul&finish=raw
import { createViewer } from '../src/scene/viewer.js';
import { buildGuitar } from '../src/guitar/buildGuitar.js';
import { createTextureCache } from '../src/scene/textureCache.js';
import { classicDesign, updateDesign } from '../src/state/design.js';
import { MODELS } from '../src/data/models/index.js';

const params = new URLSearchParams(location.search);
const view = params.get('view') ?? 'front';
const ids = params.get('models')?.split(',') ?? MODELS.map((model) => model.id);
const finish = params.get('finish');

const viewer = createViewer(document.getElementById('stage'), { prefersReducedMotion: () => true });
const cache = createTextureCache();
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

for (const id of ids) {
  const base = classicDesign(id);
  const design = finish ? updateDesign(base, 'finishType', finish) : base;
  const built = buildGuitar(design, cache);
  viewer.setGuitar(built);
  viewer.flyTo(view);
  await nextFrame();
  const url = URL.createObjectURL(await viewer.capture());
  const figure = document.createElement('figure');
  const image = new Image();
  image.src = url;
  const caption = document.createElement('figcaption');
  caption.textContent = `${id} · ${view}`;
  figure.append(image, caption);
  document.getElementById('grid').append(figure);
}
// Combineer alles tot één PNG en bied die aan als download (handig voor
// geautomatiseerde controles zonder schermafbeelding).
const images = [...document.querySelectorAll('figure img')];
await Promise.all(images.map((image) => image.decode()));
const cell = { width: 900, height: 520 };
const columns = Math.min(3, images.length);
const sheet = document.createElement('canvas');
sheet.width = cell.width * columns;
sheet.height = cell.height * Math.ceil(images.length / columns);
const context = sheet.getContext('2d');
context.fillStyle = '#d7dad5';
context.fillRect(0, 0, sheet.width, sheet.height);
images.forEach((image, index) => {
  const x = (index % columns) * cell.width;
  const y = Math.floor(index / columns) * cell.height;
  context.drawImage(image, x, y, cell.width, cell.height);
  context.fillStyle = '#1d211f';
  context.font = '600 22px system-ui';
  context.fillText(ids[index], x + 12, y + 30);
});
if (params.has('download')) {
  sheet.toBlob((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `preview-${view}${finish ? `-${finish}` : ''}.png`;
    link.click();
  }, 'image/png');
}
if (params.has('sheet')) {
  const image = new Image();
  image.src = sheet.toDataURL('image/png');
  image.style.cssText = 'display:block;width:100vw;height:auto';
  await image.decode();
  document.body.replaceChildren(image);
}
document.body.dataset.done = 'true';
