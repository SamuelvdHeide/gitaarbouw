import { DEFAULT_DESIGN, sanitizeDesign } from './design.js';

export const STORAGE_KEY = 'gitaarbouw.ontwerp.v1';
export const PREFERENCES_KEY = 'gitaarbouw.voorkeuren.v1';

const DEFAULT_PREFERENCES = Object.freeze({ classicSpecsOnModelChange: true });

function readJson(storage, key) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn(`Kon opgeslagen gegevens (${key}) niet lezen; standaardwaarden worden gebruikt.`, error);
    return null;
  }
}

function writeJson(storage, key, value) {
  try {
    storage?.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Kon gegevens (${key}) niet opslaan in de browser.`, error);
    return false;
  }
}

export function loadDesign(storage) {
  const stored = readJson(storage, STORAGE_KEY);
  return stored ? sanitizeDesign(stored) : DEFAULT_DESIGN;
}

export function saveDesign(storage, design) {
  return writeJson(storage, STORAGE_KEY, design);
}

export function loadPreferences(storage) {
  const stored = readJson(storage, PREFERENCES_KEY);
  const classic = stored?.classicSpecsOnModelChange;
  return Object.freeze({
    ...DEFAULT_PREFERENCES,
    ...(typeof classic === 'boolean' ? { classicSpecsOnModelChange: classic } : {}),
  });
}

export function savePreferences(storage, preferences) {
  return writeJson(storage, PREFERENCES_KEY, preferences);
}

/** Geeft localStorage terug, of null als de browser het blokkeert. */
export function safeLocalStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}
