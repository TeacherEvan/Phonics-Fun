import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['Tests/**/*.test.mjs'],
    setupFiles: ['Tests/vitest.setup.mjs'],
  },
});
