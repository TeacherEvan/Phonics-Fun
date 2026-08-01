import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['harness/tests/**/*.test.mjs'],
    setupFiles: ['harness/tests/vitest.setup.mjs'],
  },
});
