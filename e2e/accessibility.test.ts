import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Browser, Page } from 'playwright-core';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { launch, openPage, serve } from '../scripts/harness.ts';
import type { Scene } from '../scripts/harness.ts';

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const REPO = 'https://github.com/facebook/react';
const STACK = ['github-dev', 'deepwiki', 'clone-https'];

let browser: Browser;
let server: { origin: string; close: () => void };
let page: Page;

beforeAll(async () => {
  [browser, server] = await Promise.all([launch(), serve()]);
});

afterAll(async () => {
  await browser?.close();
  server?.close();
});

afterEach(async () => {
  await page?.close();
});

/** axe's WCAG 2.2 A and AA rules, reported as "rule: target" lines so a failure says where. */
async function violations(target: Page, scheme: 'light' | 'dark') {
  await target.emulateMedia({ colorScheme: scheme });
  await target.addScriptTag({ content: AXE });
  const found = await target.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (...args: unknown[]) => Promise<unknown> } })
      .axe;
    const result = (await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    })) as { violations: Array<{ id: string; nodes: Array<{ target: string[] }> }> };
    return result.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(' ')}`));
  });
  return found;
}

async function at(file: string, scene: Partial<Scene>, ready: string) {
  page = await openPage(browser, server.origin, file, { url: REPO, stack: STACK, ...scene });
  await page.locator(ready).first().waitFor();
  return page;
}

describe.each(['light', 'dark'] as const)('accessibility, %s', (scheme) => {
  it('the deck', async () => {
    expect(await violations(await at('popup.html', {}, '[data-tool-id]'), scheme)).toEqual([]);
  });

  it('first run', async () => {
    expect(await violations(await at('popup.html', { stack: [] }, '.first-run'), scheme)).toEqual(
      [],
    );
  });

  it('the repository prompt', async () => {
    const prompt = await at('popup.html', { url: 'https://example.com/' }, '.prompt');
    expect(await violations(prompt, scheme)).toEqual([]);
  });

  it('the options page', async () => {
    expect(await violations(await at('options.html', {}, '.panels'), scheme)).toEqual([]);
  });
});

describe('high contrast', () => {
  it('outlines the selected card when the system forces its own colours', async () => {
    const deck = await at('popup.html', {}, '[data-tool-id]');
    await deck.emulateMedia({ forcedColors: 'active' });
    const outline = await deck
      .locator('.card.selected')
      .evaluate((card) => getComputedStyle(card).outlineStyle);
    expect(outline).toBe('solid');
  });
});
