const SVG_NS = 'http://www.w3.org/2000/svg';

function applyAttributes(element, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === false || value === null || value === undefined) return;
    if (key === 'class') element.setAttribute('class', value);
    else if (key === 'style' && typeof value === 'object') Object.assign(element.style, value);
    else if (key.startsWith('on') && typeof value === 'function') element.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'checked' || key === 'value') element[key] = value;
    else element.setAttribute(key, value === true ? '' : String(value));
  });
}

function appendChildren(element, children) {
  children.flat(Infinity).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
}

/** Kleine hyperscript-helper voor HTML-elementen. */
export function h(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  applyAttributes(element, attributes);
  appendChildren(element, children);
  return element;
}

/** Idem voor SVG-elementen. */
export function s(tag, attributes = {}, ...children) {
  const element = document.createElementNS(SVG_NS, tag);
  applyAttributes(element, attributes);
  appendChildren(element, children);
  return element;
}
