import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [ 'src/**/*.spec.ts' ],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: [ 'src/**/*.ts' ],
      exclude: [ 'src/**/*.spec.ts', 'src/**/index.ts', 'src/types/**' ],
      reporter: [ 'text', 'html' ],
      reportsDirectory: '../../coverage/packages/cosmoose',
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});
