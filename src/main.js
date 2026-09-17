import '@fontsource-variable/instrument-sans/wdth.css';
import './styles/base.css';
import './styles/stage.css';
import './styles/panel.css';

import { h } from './ui/dom.js';
import { createPanel } from './ui/panel.js';
import { createStage } from './ui/stage.js';
import { createStore } from './state/store.js';
import { classicDesign, designsEqual, switchModel, updateDesign } from './state/design.js';
import { loadDesign, loadPreferences, safeLocalStorage, saveDesign, savePreferences } from './state/persistence.js';
import { getModel } from './data/models/index.js';
import { computeLayout } from './guitar/layout.js';

const storage = safeLocalStorage();
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const NO_3D_MESSAGE = 'Je browser kan geen 3D tonen. Zet hardwareversnelling aan of open de pagina in een recente versie van Chrome, Firefox of Safari.';

const store = createStore(Object.freeze({
  design: loadDesign(storage),
  preferences: loadPreferences(storage),
  tab: 'model',
  view: 'angled',
  autoRotate: false,
}));

/** Werkt de state bij, maar alleen als een waarde echt verandert. */
function setState(patch) {
  store.apply((state) => {
    const changed = Object.entries(patch).some(([key, value]) => state[key] !== value);
    return changed ? Object.freeze({ ...state, ...patch }) : state;
  });
}

function mountShell() {
  const stageRoot = h('main', { class: 'stage', 'aria-label': '3D-weergave van je gitaar' });
  const panelRoot = h('aside', { class: 'panel', 'aria-label': 'Opties' });
  document.getElementById('app').replaceChildren(h('div', { class: 'app' }, stageRoot, panelRoot));
  return { stageRoot, panelRoot };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = h('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function loadViewerModules() {
  const [viewerModule, guitarModule, cacheModule] = await Promise.all([
    import('./scene/viewer.js'),
    import('./guitar/buildGuitar.js'),
    import('./scene/textureCache.js'),
  ]);
  return { ...viewerModule, ...guitarModule, ...cacheModule };
}

function start() {
  const { stageRoot, panelRoot } = mountShell();
  const three = { viewer: null, buildGuitar: null, cache: null };
  let buildFailed = false;

  const stage = createStage(stageRoot, {
    onView(viewId) {
      setState({ view: viewId });
      three.viewer?.flyTo(viewId);
    },
    onToggleRotate() {
      if (reducedMotionQuery.matches) {
        stage.showStatus('Automatisch draaien staat uit omdat je systeem om minder beweging vraagt.');
        return;
      }
      const autoRotate = !store.get().autoRotate;
      setState({ autoRotate });
      three.viewer?.setAutoRotate(autoRotate);
    },
    async onPhoto() {
      if (!three.viewer) return;
      const filename = `gitaar-${store.get().design.model}.png`;
      try {
        downloadBlob(await three.viewer.capture(), filename);
        stage.showStatus(`Foto gedownload als ${filename}.`);
      } catch (error) {
        console.error('Foto maken mislukt', error);
        stage.showStatus('De foto kon niet worden gemaakt. Probeer het opnieuw.');
      }
    },
  });

  const panel = createPanel(panelRoot, {
    onDesignChange(field, value) {
      try {
        const { design, preferences } = store.get();
        const next = field === 'model'
          ? switchModel(design, value, { withClassicSpecs: preferences.classicSpecsOnModelChange })
          : updateDesign(design, field, value);
        setState({ design: next });
      } catch (error) {
        console.error('Ongeldige keuze genegeerd', { field, value, error });
        stage.showStatus('Die keuze wordt niet herkend. Kies een andere optie.');
      }
    },
    onPreferenceChange(patch) {
      setState({ preferences: Object.freeze({ ...store.get().preferences, ...patch }) });
    },
    onTabChange: (tab) => setState({ tab }),
    onLoadClassic() {
      const { design } = store.get();
      const classic = classicDesign(design.model);
      if (designsEqual(design, classic)) {
        stage.showStatus('Je ontwerp is al de klassieke uitvoering.');
        return;
      }
      setState({ design: classic });
      stage.showStatus('Klassieke uitvoering geladen.');
    },
  });

  let pendingFrame = 0;
  function scheduleBuild() {
    if (!three.viewer || pendingFrame) return;
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = 0;
      const { design, view } = store.get();
      try {
        const previousModel = three.viewer.currentModelId();
        const built = three.buildGuitar(design, three.cache);
        three.viewer.setGuitar(built);
        three.cache.retain(built.textureKeys);
        three.cache.trim();
        saveDesign(storage, design);
        if (previousModel !== design.model) three.viewer.flyTo(view);
        if (buildFailed) {
          buildFailed = false;
          stage.showStatus('');
        }
      } catch (error) {
        buildFailed = true;
        console.error('Opbouwen van de gitaar mislukt', { design, error });
        stage.showStatus('Dit ontwerp kon niet worden opgebouwd. Laad de klassieke uitvoering of kies een andere optie.', { persistent: true });
      }
    });
  }

  function render(state, previous) {
    const model = getModel(state.design.model);
    stage.render({ model, layout: computeLayout(model), view: state.view, autoRotate: state.autoRotate });

    const panelChanged = !previous || previous.design !== state.design || previous.tab !== state.tab || previous.preferences !== state.preferences;
    if (panelChanged) {
      panel.render({ design: state.design, preferences: state.preferences, tab: state.tab, modelLabel: model.label });
    }
    if (!previous || previous.design !== state.design) scheduleBuild();
    if (previous && previous.preferences !== state.preferences) savePreferences(storage, state.preferences);
  }

  store.subscribe(render);
  render(store.get(), null);

  loadViewerModules()
    .then(({ createViewer, isWebGLAvailable, buildGuitar, createTextureCache }) => {
      if (!isWebGLAvailable()) {
        stage.showStatus(NO_3D_MESSAGE, { persistent: true });
        return;
      }
      three.buildGuitar = buildGuitar;
      three.cache = createTextureCache();
      three.viewer = createViewer(stage.canvasHost, {
        prefersReducedMotion: () => reducedMotionQuery.matches,
        onContextLost: () => stage.showStatus('De 3D-weergave is even weggevallen. Hij komt vanzelf terug.', { persistent: true }),
        onContextRestored: () => stage.showStatus(''),
      });
      three.viewer.setAutoRotate(store.get().autoRotate);
      stage.setReady(true);
      scheduleBuild();
    })
    .catch((error) => {
      console.error('3D-weergave kon niet starten', error);
      stage.showStatus(NO_3D_MESSAGE, { persistent: true });
    });
}

try {
  start();
} catch (error) {
  console.error('Gitaarbouw kon niet starten', error);
  document.getElementById('app').replaceChildren(
    h('p', { class: 'fatal' }, 'Gitaarbouw kon niet starten. Herlaad de pagina; blijft het misgaan, kijk dan in de console van je browser.'));
}
