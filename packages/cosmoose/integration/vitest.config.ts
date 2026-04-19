import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(import.meta.dirname, '..', 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.integration.spec.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    globalSetup: [resolve(import.meta.dirname, 'global-setup.ts')],
    passWithNoTests: true,
  },
});
