/**
 * Minimale store: bewaart een onveranderlijke waarde en meldt wijzigingen.
 * Transities zijn pure functies (vorige waarde -> nieuwe waarde).
 */
export function createStore(initialValue) {
  let current = initialValue;
  const listeners = new Set();

  return Object.freeze({
    get: () => current,
    apply(transition) {
      const next = transition(current);
      if (next === current) return current;
      const previous = current;
      current = next;
      listeners.forEach((listener) => listener(current, previous));
      return current;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}
