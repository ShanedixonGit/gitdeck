import { defineConfig } from 'vitest/config';

const shared = {
  environment: 'node' as const,
  testTimeout: 20_000,
  hookTimeout: 60_000,
  expect: { poll: { timeout: 5_000 } },
};

/** The built pages with a stand-in for the extension APIs, in one engine. */
const engine = (name: string) => ({
  test: {
    ...shared,
    name,
    include: ['e2e/*.test.ts'],
    exclude: ['e2e/extension.test.ts'],
    env: { E2E_BROWSER: name },
  },
});

export default defineConfig({
  test: {
    // One browser at a time: several in parallel starved each other on a laptop and
    // timed tests out. Run one at a time, the suite takes about a minute.
    fileParallelism: false,
    projects: [
      engine('chrome'),
      engine('firefox'),
      engine('webkit'),
      // The packaged extension itself, once, in Playwright's Chromium.
      { test: { ...shared, name: 'extension', include: ['e2e/extension.test.ts'] } },
    ],
  },
});
