import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      // Thin wrappers over the extension APIs and barrel files: exercised by the
      // end-to-end tests against the built pages, not by unit tests.
      exclude: [
        'src/lib/**/*.test.ts',
        'src/lib/**/index.ts',
        'src/lib/browser/**',
        'src/lib/settings/store.ts',
      ],
      reporter: ['text-summary'],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
