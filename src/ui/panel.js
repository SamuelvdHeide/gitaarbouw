import { h } from './dom.js';
import { TABS, groupsForTab } from './tabs.js';

const PANEL_BODY_ID = 'optiepaneel';

function visualFor({ visual = {} }, variant) {
  if (variant === 'segmented') return null;
  if (visual.node) return h('span', { class: 'choice__visual choice__visual--node' }, visual.node());
  if (visual.empty) return h('span', { class: 'choice__visual choice__visual--empty' });
  const style = visual.image ? { backgroundImage: `url(${visual.image})` } : { background: visual.background };
  return h('span', { class: 'choice__visual', style });
}

function choice(group, option) {
  const focusKey = `${group.field}:${option.value}`;
  const showLabel = group.variant !== 'color';
  return h('label', { class: `choice choice--${group.variant}`, title: option.label },
    h('input', {
      class: 'choice__input',
      type: 'radio',
      name: group.field,
      value: option.value,
      checked: option.value === group.value,
      'data-field': group.field,
      'data-focus-key': focusKey,
    }),
    visualFor(option, group.variant),
    showLabel ? h('span', { class: 'choice__label' }, option.label) : h('span', { class: 'visually-hidden' }, option.label),
    option.hint ? h('span', { class: 'choice__hint' }, option.hint) : null);
}

function customColor(group) {
  const isCustom = !group.options.some((option) => option.value === group.value);
  return h('label', { class: 'custom-color', 'data-active': String(isCustom) },
    h('span', { class: 'custom-color__swatch', style: { background: isCustom ? group.value : undefined } },
      h('input', {
        class: 'custom-color__input',
        type: 'color',
        value: group.value.toLowerCase(),
        'data-field': group.field,
        'data-focus-key': `${group.field}:eigen`,
      })),
    h('span', { class: 'custom-color__text' }, isCustom ? `Eigen kleur ${group.value}` : 'Eigen kleur kiezen'));
}

function choiceGrid(group, options) {
  return h('div', { class: `choices choices--${group.variant}` }, options.map((option) => choice(group, option)));
}

function renderGroup(group) {
  const headingId = `kop-${group.id}`;
  const hasOptions = group.options.length > 0 || group.sections;
  const content = group.sections
    ? group.sections.map((section) => h('div', { class: 'group__section' },
      h('h4', { class: 'group__subtitle' }, section.title),
      choiceGrid(group, section.options)))
    : choiceGrid(group, group.options);

  return h('section', { class: `group group--${group.variant}` },
    h('div', { class: 'group__head' },
      h('h3', { class: 'group__title', id: headingId }, group.title),
      group.current ? h('span', { class: 'group__current' }, group.current) : null),
    hasOptions ? h('div', { role: 'radiogroup', 'aria-labelledby': headingId }, content) : null,
    group.custom ? customColor(group) : null,
    group.note ? h('p', { class: 'group__note' }, group.note) : null);
}

function renderModelExtras(preferences) {
  return h('label', { class: 'toggle' },
    h('input', {
      type: 'checkbox',
      checked: preferences.classicSpecsOnModelChange,
      'data-preference': 'classicSpecsOnModelChange',
      'data-focus-key': 'voorkeur:klassiek',
    }),
    h('span', { class: 'toggle__text' },
      h('span', { class: 'toggle__title' }, 'Klassieke uitvoering laden bij modelwissel'),
      h('span', { class: 'toggle__note' }, 'Hout, lak en onderdelen springen naar de bekende combinatie van dat model. Zet uit om je eigen keuzes te houden.')));
}

function createTabs(handlers) {
  const list = h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Onderdelen' });
  const buttons = TABS.map((item) => h('button', {
    class: 'tab',
    type: 'button',
    role: 'tab',
    id: `tab-${item.id}`,
    'data-tab': item.id,
    'aria-controls': PANEL_BODY_ID,
    onClick: () => handlers.onTabChange(item.id),
  }, item.label));
  list.append(...buttons);

  list.addEventListener('keydown', (event) => {
    const index = buttons.indexOf(document.activeElement);
    if (index === -1) return;
    const targets = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: buttons.length - 1 };
    if (!(event.key in targets)) return;
    event.preventDefault();
    const next = buttons[(targets[event.key] + buttons.length) % buttons.length];
    next.focus();
    handlers.onTabChange(next.dataset.tab);
  });

  function update(activeTab) {
    buttons.forEach((button) => {
      const selected = button.dataset.tab === activeTab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
  }

  return { list, update };
}

/**
 * Optiepaneel met tabbladen. De tabknoppen blijven staan; de inhoud van het
 * actieve tabblad wordt opnieuw opgebouwd en de focus keert terug naar het
 * element met dezelfde `data-focus-key`.
 */
export function createPanel(root, handlers) {
  const tabs = createTabs(handlers);
  const body = h('div', { class: 'panel__body', id: PANEL_BODY_ID, role: 'tabpanel', tabindex: '-1' });
  const resetButton = h('button', { class: 'button button--quiet', type: 'button', onClick: () => handlers.onLoadClassic() });
  root.append(
    h('div', { class: 'panel__intro' },
      h('p', { class: 'panel__app' }, 'Gitaarbouw'),
      h('p', { class: 'panel__lead' }, 'Stel je gitaar samen. Elke keuze zie je meteen terug op het model.')),
    tabs.list,
    body,
    h('div', { class: 'panel__footer' }, resetButton));

  // Kleurkiezer: `change` vuurt pas bij sluiten, zodat het paneel niet
  // opnieuw wordt opgebouwd terwijl de kiezer nog open staat.
  body.addEventListener('change', (event) => {
    const { field, preference } = event.target.dataset;
    if (preference) {
      handlers.onPreferenceChange({ [preference]: event.target.checked });
      return;
    }
    if (!field) return;
    const value = event.target.type === 'color' ? event.target.value.toUpperCase() : event.target.value;
    handlers.onDesignChange(field, value);
  });

  function render({ design, preferences, tab, modelLabel }) {
    const focusKey = body.contains(document.activeElement) ? document.activeElement.dataset.focusKey : null;

    tabs.update(tab);
    body.setAttribute('aria-labelledby', `tab-${tab}`);
    body.replaceChildren(
      ...groupsForTab(tab, design).map(renderGroup),
      ...(tab === 'model' ? [renderModelExtras(preferences)] : []),
    );
    resetButton.textContent = `Klassieke ${modelLabel} laden`;

    if (focusKey) {
      body.querySelector(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
    }
  }

  return Object.freeze({ render });
}
