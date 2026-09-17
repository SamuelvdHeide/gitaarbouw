import { describe, expect, it, vi } from 'vitest';
import { createTextureCache, estimateTextureBytes } from './textureCache.js';

const fakeTexture = () => ({ dispose: vi.fn() });

describe('createTextureCache', () => {
  const measure = () => 10;

  it('maakt elke sleutel maar één keer aan en registreert gebruik', () => {
    const cache = createTextureCache({ budgetBytes: 100, measure });
    const factory = vi.fn(fakeTexture);
    const used = new Set();
    const first = cache.get('a', factory, used);
    expect(cache.get('a', factory)).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
    expect([...used]).toEqual(['a']);
  });

  it('ruimt pas op bij trim, oudste eerst, en spaart sleutels in gebruik', () => {
    const cache = createTextureCache({ budgetBytes: 20, measure });
    const a = cache.get('a', fakeTexture);
    const b = cache.get('b', fakeTexture);
    const c = cache.get('c', fakeTexture);
    const d = cache.get('d', fakeTexture);
    expect(cache.size()).toBe(4);

    cache.retain(['a']);
    cache.trim();
    expect(a.dispose).not.toHaveBeenCalled();
    expect(b.dispose).toHaveBeenCalled();
    expect(c.dispose).toHaveBeenCalled();
    expect(d.dispose).not.toHaveBeenCalled();
    expect(cache.bytes()).toBe(20);
  });

  it('houdt recent gebruikte sleutels achteraan de rij', () => {
    const cache = createTextureCache({ budgetBytes: 20, measure });
    const a = cache.get('a', fakeTexture);
    const b = cache.get('b', fakeTexture);
    cache.get('c', fakeTexture);
    cache.get('a', fakeTexture);
    cache.trim();
    expect(b.dispose).toHaveBeenCalled();
    expect(a.dispose).not.toHaveBeenCalled();
  });

  it('ruimt alles op met clear', () => {
    const cache = createTextureCache({ measure });
    const a = cache.get('a', fakeTexture);
    cache.clear();
    expect(a.dispose).toHaveBeenCalled();
    expect(cache.size()).toBe(0);
  });
});

describe('estimateTextureBytes', () => {
  it('rekent canvas plus GPU-kopie mee', () => {
    expect(estimateTextureBytes({ image: { width: 10, height: 10 } })).toBe(933);
    expect(estimateTextureBytes(null)).toBe(0);
  });
});
