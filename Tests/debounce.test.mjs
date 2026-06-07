import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../js/utils.js';

describe('debounce fallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete window.PerformanceUtils;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('works without PerformanceUtils', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);
    expect(typeof debounced).toBe('function');
    
    debounced('arg1');
    expect(fn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledWith('arg1');
  });

  it('delays execution until wait period passes', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);
    
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets timer on repeated calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);
    
    debounced();
    vi.advanceTimersByTime(200);
    debounced();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments correctly', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);
    
    debounced('a', 'b', 123);
    vi.advanceTimersByTime(250);
    expect(fn).toHaveBeenCalledWith('a', 'b', 123);
  });

  it('preserves this context', () => {
    const obj = { value: 'test', fn: vi.fn() };
    const debounced = debounce(function() { this.fn(this.value); }, 250);
    
    debounced.call(obj);
    vi.advanceTimersByTime(250);
    expect(obj.fn).toHaveBeenCalledWith('test');
  });
});