import { describe, it, expect } from 'vitest';

describe('vitest environment', () => {
  it('should have window in jsdom', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});
