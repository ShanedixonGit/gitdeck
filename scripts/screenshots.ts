/**
 * Renders the store screenshots from the real built extension.
 *
 * Loads the popup and options pages through `harness.ts`, with a fixed tab and
 * fixed settings, and frames each capture at the 1280×800 the stores ask for. JPEG, because the Chrome Web Store rejects PNGs
 * with an alpha channel.
 *
 * Usage: npm run screenshots (builds first). Output: docs/images/store/.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { Browser, Page } from 'playwright-core';
import { CATEGORIES } from '../src/lib/tools/categories.ts';
import { TOOLS } from '../src/lib/tools/registry.ts';
import { launch, openPage, serve } from './harness.ts';
import type { Scene } from './harness.ts';

const OUT = resolve(import.meta.dirname, '../docs/images/store');
const REPO_URL = 'https://github.com/facebook/react';

const RECOMMENDED = CATEGORIES.flatMap((section) =>
  TOOLS.filter((tool) => tool.category === section.id && tool.recommended).map((tool) => tool.id),
);

async function capturePopup(
  browser: Browser,
  origin: string,
  scene: Scene,
  act?: (page: Page) => Promise<void>,
): Promise<Buffer> {
  const page = await openPage(browser, origin, 'popup.html', scene, { deviceScaleFactor: 2 });
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
  const page = await openPage(
    browser,
    origin,
    'options.html',
    { url: REPO_URL, stack: RECOMMENDED },
    { viewport: { width: 1280, height: 800 } },
  );
  await page.locator('.panels').waitFor();
  const shot = await page.screenshot({ type: 'jpeg', quality: 92 });
  await page.close();
  return shot;
}

/** Chrome's 440×280 small promo tile: the icon, the name and what it does. */
async function promoTile(browser: Browser): Promise<Buffer> {
  const icon = await readFile(resolve(import.meta.dirname, '../src/public/icon/128.png'));
  const page = await browser.newPage({ viewport: { width: 440, height: 280 } });
  await page.setContent(`<!doctype html>
    <style>
      body { margin: 0; height: 280px; display: flex; align-items: center; gap: 22px;
        padding: 0 32px; box-sizing: border-box; background: #eef1f5; color: #16181d;
        font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      img { width: 96px; height: 96px; flex: none; }
      h1 { margin: 0 0 8px; font-size: 34px; font-weight: 650; letter-spacing: -0.01em; }
      p { margin: 0; font-size: 16px; line-height: 1.4; color: #4b525c; }
    </style>
    <img src="data:image/png;base64,${icon.toString('base64')}">
    <div><h1>Repohopper</h1><p>Open the GitHub repo you are on in the tools you choose.</p></div>`);
  await page.locator('img').evaluate((img: HTMLImageElement) => img.decode());
  const shot = await page.screenshot({ type: 'jpeg', quality: 92 });
  await page.close();
  return shot;
}

await mkdir(OUT, { recursive: true });
const server = await serve();
const browser = await launch();

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
    ['promo-440x280.jpg', await promoTile(browser)],
  ];
  for (const [name, shot] of shots) {
    await writeFile(join(OUT, name), shot);
    console.log(`wrote docs/images/store/${name}`);
  }
} finally {
  await browser.close();
  server.close();
}
