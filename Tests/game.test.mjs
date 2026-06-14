import { describe, it, expect, beforeAll } from 'vitest';

describe('PHONICS_FUN_LETTER_DATA', () => {
  beforeAll(async () => {
    // Load the global script that defines window.PHONICS_FUN_LETTER_DATA
    await import('../js/main.js');
  });

  it('should expose A-Z keys', () => {
    const keys = Object.keys(window.PHONICS_FUN_LETTER_DATA);
    expect(keys).toHaveLength(26);
    for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(keys).toContain(letter);
    }
  });

  it('should have exactly 5 words per letter', () => {
    for (const [letter, words] of Object.entries(window.PHONICS_FUN_LETTER_DATA)) {
      expect(Array.isArray(words), `Words for ${letter} should be an array`).toBe(true);
      expect(words).toHaveLength(5);
    }
  });

  it('should have lowercase word entries', () => {
    for (const [, words] of Object.entries(window.PHONICS_FUN_LETTER_DATA)) {
      for (const word of words) {
        expect(word).toBe(word.toLowerCase());
      }
    }
  });
});
