/**
 * Renders the store screenshots from the real built extension.
 *
 * Serves `.output/chrome-mv3`, loads the popup and options pages in the locally
 * installed Chrome with the extension APIs stubbed (a fixed tab URL, fixed
 * settings, a clipboard that accepts anything), and frames each capture at the
 * 1280×800 the stores ask for. JPEG, because the Chrome Web Store rejects PNGs
 * with an alpha channel.
 *
 * Usage: npm run screenshots (builds first). Output: docs/images/store/.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';
import { CATEGORIES } from '../src/lib/tools/categories.ts';
import { TOOLS } from '../src/lib/tools/registry.ts';

const ROOT = resolve(import.meta.dirname, '..');
const BUILD = join(ROOT, '.output/chrome-mv3');
const OUT = join(ROOT, 'docs/images/store');
const REPO_URL = 'https://github.com/facebook/react';

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
};

const RECOMMENDED = CATEGORIES.flatMap((section) =>
  TOOLS.filter((tool) => tool.category === section.id && tool.recommended).map((tool) => tool.id),
);

interface Scene {
  url: string;
  stack: readonly string[];
}

/** Runs in the page before any extension code, standing in for the browser APIs. */
function stubExtension({ url, stack }: Scene) {
  const store: Record<string, unknown> = {
    settings: { openTarget: 'new-tab', includeUnverified: false, stack },
  };
  const event = { addListener() {}, removeListener() {}, hasListener: () => false };
  Object.assign(window, {
    chrome: {
      runtime: { id: 'screenshots', openOptionsPage: async () => {}, onMessage: event },
      tabs: { query: async () => [{ url }], create: async () => ({}), update: async () => ({}) },
      storage: {
        onChanged: event,
        sync: {
          onChanged: event,
          get: async (keys?: string | string[]) =>
            Object.fromEntries([keys ?? Object.keys(store)].flat().map((key) => [key, store[key]])),
          set: async (items: Record<string, unknown>) => void Object.assign(store, items),
          remove: async () => {},
        },
      },
    },
    close: () => {},
  });
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} } });
}

function serve(): Promise<{ origin: string; close: () => void }> {
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

async function capturePopup(
  browser: Browser,
  origin: string,
  scene: Scene,
  act?: (page: Page) => Promise<void>,
): Promise<Buffer> {
  const page = await browser.newPage({ deviceScaleFactor: 2, colorScheme: 'light' });
  await page.addInitScript(stubExtension, scene);
  await page.goto(`${origin}/popup.html`);
  await page.locator('main header').waitFor();
  if (act !== undefined) await act(page);
  const shot = await page.locator('main').screenshot();
  await page.close();
  return shot;
}

async function frame(browser: Browser, popup: Buffer, title: string, body: string) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'light',
  });
  await page.setContent(`<!doctype html>
    <style>
      body { margin: 0; height: 800px; display: flex; align-items: center; gap: 72px;
        padding: 0 96px; box-sizing: border-box; background: #eef1f5; color: #16181d;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .text { flex: 1; }
      h1 { margin: 0 0 16px; font-size: 40px; line-height: 1.15; font-weight: 650; }
      p { margin: 0; font-size: 20px; line-height: 1.5; color: #4b525c; }
      img { max-width: 576px; max-height: 720px;
        border-radius: 12px; box-shadow: 0 24px 60px rgb(22 24 29 / 0.18),
        0 2px 6px rgb(22 24 29 / 0.08); background: #fff; }
    </style>
    <div class="text"><h1>${title}</h1><p>${body}</p></div>
    <img src="data:image/png;base64,${popup.toString('base64')}">`);
  await page.locator('img').evaluate((img: HTMLImageElement) => img.decode());
  const shot = await page.screenshot({ type: 'jpeg', quality: 92 });
  await page.close();
  return shot;
}

async function captureOptions(browser: Browser, origin: string): Promise<Buffer> {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'light',
  });
  await page.addInitScript(stubExtension, { url: REPO_URL, stack: RECOMMENDED });
  await page.goto(`${origin}/options.html`);
  await page.locator('.panels').waitFor();
  const shot = await page.screenshot({ type: 'jpeg', quality: 92 });
  await page.close();
  return shot;
}

await mkdir(OUT, { recursive: true });
const server = await serve();
const browser = await chromium.launch({ channel: 'chrome', headless: true });

try {
  const shots: Array<[string, Buffer]> = [
    [
      '1-deck.jpg',
      await frame(
        browser,
        await capturePopup(browser, server.origin, { url: REPO_URL, stack: RECOMMENDED }),
        'Your deck, pointed at the repo you are on',
        'Links to the tools you chose, already set up for this repository. One click or a number key takes you there.',
      ),
    ],
    [
      '2-first-run.jpg',
      await frame(
        browser,
        await capturePopup(browser, server.origin, { url: REPO_URL, stack: [] }),
        'Start with the recommended deck',
        'One tool from each section, or choose your own. Each is an independent service, run by its own provider.',
      ),
    ],
    [
      '3-copy.jpg',
      await frame(
        browser,
        await capturePopup(
          browser,
          server.origin,
          { url: REPO_URL, stack: ['clone-https', 'clone-ssh', 'clone-gh', 'download-zip'] },
          async (page) => {
            await page.locator('[data-tool-id="clone-https"]').click();
            await page.locator('.notice').waitFor();
          },
        ),
        'Copy a clone command',
        'HTTPS, SSH or the GitHub CLI, ready to paste into your terminal. Or download a ZIP.',
      ),
    ],
    ['4-options.jpg', await captureOptions(browser, server.origin)],
  ];
  for (const [name, shot] of shots) {
    await writeFile(join(OUT, name), shot);
    console.log(`wrote docs/images/store/${name}`);
  }
} finally {
  await browser.close();
  server.close();
}
