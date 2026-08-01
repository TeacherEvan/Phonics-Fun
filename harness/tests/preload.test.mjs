import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../js/performance-utils.js';

describe('PerformanceUtils preloadLetterImages', () => {
  let perfUtils;

  beforeEach(() => {
    perfUtils = new window.PerformanceUtils();
  });

  it('returns a Promise', () => {
    const result = perfUtils.preloadLetterImages('G');
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves immediately when no images to preload', async () => {
    // Use a letter with no data
    const result = perfUtils.preloadLetterImages('X');
    await expect(result).resolves.toBeUndefined();
  });

  it('resolves after timeout when images fail to load', async () => {
    vi.useFakeTimers();
    
    const result = perfUtils.preloadLetterImages('G');
    
    // Advance timers past the 5000ms fallback timeout
    vi.advanceTimersByTime(5000);
    
    await expect(result).resolves.toBeUndefined();
    
    vi.useRealTimers();
  });
});