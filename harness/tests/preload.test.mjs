import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../js/performance-utils.js';

describe('PerformanceUtils preloadLetterImages', () => {
  let perfUtils;

  beforeEach(() => {
    // Fake timers throughout: the preload path schedules staggered image
    // loads, and with real timers they would outlive the test and fire after
    // jsdom has been torn down.
    vi.useFakeTimers();
    perfUtils = new window.PerformanceUtils();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('returns a Promise', () => {
    const result = perfUtils.preloadLetterImages('G', ['grape']);
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves immediately when no images to preload', async () => {
    // No words for this letter -> nothing to preload.
    const result = perfUtils.preloadLetterImages('X', []);
    await expect(result).resolves.toBeUndefined();
  });

  it('resolves after timeout when images fail to load', async () => {
    const result = perfUtils.preloadLetterImages('G', ['grape', 'goat']);

    // Advance timers past the 5000ms fallback timeout
    vi.advanceTimersByTime(5000);

    await expect(result).resolves.toBeUndefined();
  });

  it('prefetches every word of the letter that is not already cached', () => {
    const seen = [];
    perfUtils.preloadLetterImages('G', ['grape', 'goat']);

    vi.advanceTimersByTime(500);

    // Both words were attempted, and neither is cached because jsdom never
    // fires a load event for an image.
    expect(perfUtils.resourceCache.size).toBe(0);
    expect(seen).toEqual([]);
  });
});
