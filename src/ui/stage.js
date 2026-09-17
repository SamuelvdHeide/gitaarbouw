import { h } from './dom.js';
import { CAMERA_VIEWS } from '../scene/cameraViews.js';
import { brandLabel, describeSpecs } from './specs.js';

/**
 * Titel, bouwmaten, cameraknoppen en statusmeldingen boven de 3D-weergave.
 * Knoppen worden één keer gemaakt zodat de toetsenbordfocus blijft staan.
 */
export function createStage(root, handlers) {
  const canvasHost = h('div', { class: 'stage__canvas' });
  const title = h('h1', { class: 'stage__model' });
  const brand = h('p', { class: 'stage__brand' });
  const specs = h('dl', { class: 'specs' });
  const status = h('p', { class: 'stage__status', role: 'status', 'aria-live': 'polite' });

  const viewButtons = CAMERA_VIEWS.map((item) => h('button', {
    class: 'tool',
    type: 'button',
    'data-view': item.id,
    disabled: true,
    onClick: () => handlers.onView(item.id),
  }, item.label));
  const rotateButton = h('button', { class: 'tool', type: 'button', disabled: true, onClick: () => handlers.onToggleRotate() }, 'Laten draaien');
  const photoButton = h('button', { class: 'tool tool--primary', type: 'button', disabled: true, onClick: () => handlers.onPhoto() }, 'Foto opslaan');
  const tools = [...viewButtons, rotateButton, photoButton];

  root.append(
    canvasHost,
    h('header', { class: 'stage__title' }, title, brand),
    h('div', { class: 'stage__bottom' },
      specs,
      h('div', { class: 'toolbar' },
        h('div', { class: 'toolbar__group', role: 'group', 'aria-label': 'Camerastandpunt' }, viewButtons),
        h('div', { class: 'toolbar__group' }, rotateButton, photoButton))),
    h('p', { class: 'stage__hint' }, 'Sleep om te draaien, scroll of knijp om te zoomen, rechtsklik om te verschuiven.'),
    status);

  let statusTimer = null;
  let renderedModelId = null;

  return Object.freeze({
    canvasHost,
    render({ model, layout, view, autoRotate }) {
      if (renderedModelId !== model.id) {
        renderedModelId = model.id;
        title.textContent = model.label;
        brand.textContent = brandLabel(model);
        specs.replaceChildren(...describeSpecs(model, layout).map(([label, value]) =>
          h('div', { class: 'specs__item' }, h('dt', {}, label), h('dd', {}, value))));
      }
      viewButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
      rotateButton.setAttribute('aria-pressed', String(autoRotate));
    },
    setReady(ready) {
      tools.forEach((button) => { button.disabled = !ready; });
    },
    showStatus(message, { persistent = false } = {}) {
      clearTimeout(statusTimer);
      status.textContent = message;
      status.dataset.visible = message ? 'true' : 'false';
      if (message && !persistent) {
        statusTimer = setTimeout(() => { status.dataset.visible = 'false'; }, 3500);
      }
    },
  });
}
