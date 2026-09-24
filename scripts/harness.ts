/**
 * Runs the built extension's pages in an ordinary browser tab, with the
 * extension APIs replaced by an in-page stand-in. Shared by the end-to-end
 * tests and the store screenshots, so both exercise exactly what ships.
 *
 * The stand-in serves a fixed tab URL and settings, and records what the page
 * does with them: tabs opened, settings written, text copied, windows closed.
 */
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium, firefox, webkit } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';

/**
 * The build each engine loads. Firefox gets its own; WebKit gets Chrome's, which
 * is what Safari's converter starts from.
 */
export function buildFor(engine: Engine = engineFromEnv()): string {
  return resolve(
    import.meta.dirname,
    `../.output/${engine === 'firefox' ? 'firefox' : 'chrome'}-mv3`,
  );
}

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
};

export interface Scene {
  /** The address of the tab the popup was opened from. */
  url: string;
  stack: readonly string[];
  openTarget?: 'new-tab' | 'current-tab' | 'background-tab';
  /** How long reading settings takes, to expose loading states. */
  settingsDelay?: number;
}

/** What the page did, as recorded by the stand-in. */
export interface Activity {
  opened: string[];
  writes: Array<{ stack: string[]; openTarget: string }>;
  copied: string[];
  closed: number;
}

/** Runs in the page before any extension code. Must be self-contained. */
function stubExtension(scene: Scene) {
  const activity = {
    opened: [] as string[],
    writes: [] as unknown[],
    copied: [] as string[],
    closed: 0,
  };
  const store: { [key: string]: unknown } = {
    settings: {
      openTarget: scene.openTarget ?? 'new-tab',
      includeUnverified: false,
      stack: scene.stack,
    },
  };
  const event = { addListener() {}, removeListener() {}, hasListener: () => false };
  type Changes = { [key: string]: { newValue?: unknown; oldValue?: unknown } };
  const listeners = new Set<(changes: Changes, area: string) => void>();
  const changed = {
    addListener: (listener: (changes: Changes, area: string) => void) => listeners.add(listener),
    removeListener: (listener: (changes: Changes, area: string) => void) =>
      listeners.delete(listener),
    hasListener: (listener: (changes: Changes, area: string) => void) => listeners.has(listener),
  };
  const put = (items: { [key: string]: unknown }) => {
    const changes: Changes = {};
    for (const [key, value] of Object.entries(items)) {
      changes[key] = { newValue: structuredClone(value), oldValue: store[key] };
      store[key] = structuredClone(value);
    }
    for (const listener of listeners) listener(changes, 'sync');
  };
  const later = <T>(value: T) =>
    new Promise<T>((done) => setTimeout(() => done(value), scene.settingsDelay ?? 0));
  const harness = {
    activity,
    failWrites: false,
    /** Another page of the extension saving settings. */
    writeElsewhere: (settings: unknown) => put({ settings }),
  };
  Object.assign(window, {
    __harness: harness,
    chrome: {
      runtime: {
        id: 'harness',
        onMessage: event,
        openOptionsPage: async () => void activity.opened.push('options'),
      },
      tabs: {
        query: async () => [{ url: scene.url }],
        create: async ({ url }: { url: string }) => void activity.opened.push(url),
        update: async ({ url }: { url: string }) => void activity.opened.push(url),
      },
      storage: {
        onChanged: event,
        sync: {
          onChanged: changed,
          get: (keys?: string | string[]) =>
            later(
              Object.fromEntries(
                [keys ?? Object.keys(store)].flat().map((key) => [key, store[key]]),
              ),
            ),
          set: async (items: { [key: string]: unknown }) => {
            if (harness.failWrites) throw new Error('QUOTA_BYTES_PER_ITEM quota exceeded');
            activity.writes.push(structuredClone(items.settings));
            put(items);
          },
          remove: async () => {},
        },
      },
    },
    close: () => void activity.closed++,
  });
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: async (text: string) => void activity.copied.push(text) },
  });
}

/** Serves the built extension over HTTP, since module scripts will not load from file://. */
export function serve(
  engine: Engine = engineFromEnv(),
): Promise<{ origin: string; close: () => void }> {
  const BUILD = buildFor(engine);
  const server = createServer((request, response) => {
    const path = normalize(new URL(request.url ?? '/', 'http://x').pathname);
    const file = join(BUILD, path);
    if (!file.startsWith(BUILD)) return void response.writeHead(403).end();
    readFile(file).then(
      (body) =>
        response
          .writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
          .end(body),
      () => response.writeHead(404).end(),
    );
  });
  return new Promise((done) =>
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      done({ origin: `http://127.0.0.1:${port}`, close: () => server.close() });
    }),
  );
}

export type Engine = 'chrome' | 'firefox' | 'webkit';

/**
 * A headless browser for the engine named in `E2E_BROWSER`, Chrome by default.
 *
 * Chrome is the installed Google Chrome, so nothing is downloaded. Firefox and
 * WebKit are Playwright's builds of Gecko and of Safari's engine, fetched once
 * with `npx playwright-core install firefox webkit`. They load the pages as web
 * pages, not as an extension, which is all the stand-in needs: this checks
 * layout, keyboard and clipboard behaviour in each engine, not the extension
 * APIs, which stay a manual check in the real browsers.
 */
export function launch(engine: Engine = engineFromEnv()): Promise<Browser> {
  if (engine === 'firefox') return firefox.launch({ headless: true });
  if (engine === 'webkit') return webkit.launch({ headless: true });
  return chromium.launch({ channel: 'chrome', headless: true });
}

function engineFromEnv(): Engine {
  const value = process.env.E2E_BROWSER;
  return value === 'firefox' || value === 'webkit' ? value : 'chrome';
}

/** Opens one of the extension's pages (`popup.html`, `options.html`) in the given scene. */
export async function openPage(
  browser: Browser,
  origin: string,
  page: string,
  scene: Scene,
  options: Parameters<Browser['newPage']>[0] = {},
): Promise<Page> {
  const tab = await browser.newPage({ colorScheme: 'light', ...options });
  await tab.addInitScript(stubExtension, scene);
  await tab.goto(`${origin}/${page}`);
  return tab;
}

export function activityOf(page: Page): Promise<Activity> {
  return page.evaluate(
    () => (window as unknown as { __harness: { activity: Activity } }).__harness.activity,
  );
}

export function failWrites(page: Page, fail: boolean): Promise<void> {
  return page.evaluate((value) => {
    (window as unknown as { __harness: { failWrites: boolean } }).__harness.failWrites = value;
  }, fail);
}

export function writeElsewhere(page: Page, settings: { stack: string[] }): Promise<void> {
  return page.evaluate((value) => {
    (
      window as unknown as { __harness: { writeElsewhere: (settings: unknown) => void } }
    ).__harness.writeElsewhere({ openTarget: 'new-tab', includeUnverified: false, ...value });
  }, settings);
}
