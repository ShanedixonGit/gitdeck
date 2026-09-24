import { defineConfig } from 'vitest/config';

const engine = (name: string) => ({
  extends: true as const,
  test: { name, env: { E2E_BROWSER: name } },
});

export default defineConfig({
  test: {
    environment: 'node',
    include: ['e2e/**/*.test.ts'],
    testTimeout: 20_000,
    hookTimeout: 60_000,
    // One browser at a time: six in parallel starved each other on a laptop and
    // timed tests out. Run one at a time, the suite takes about a minute.
    fileParallelism: false,
    expect: { poll: { timeout: 5_000 } },
    projects: [engine('chrome'), engine('firefox'), engine('webkit')],
  },
});
