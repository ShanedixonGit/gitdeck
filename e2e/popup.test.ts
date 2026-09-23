import type { Browser, Page } from 'playwright-core';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { activityOf, launch, openPage, serve } from '../scripts/harness.ts';
import type { Scene } from '../scripts/harness.ts';

const REPO = 'https://github.com/facebook/react';
const STACK = ['github-dev', 'deepwiki', 'gitdiagram', 'clone-https'];

let browser: Browser;
let server: { origin: string; close: () => void };
let page: Page;

beforeAll(async () => {
  [browser, server] = await Promise.all([launch(), serve()]);
});

afterAll(async () => {
  await browser.close();
  server.close();
});

afterEach(async () => {
  await page.close();
});

async function popup(scene: Partial<Scene> = {}) {
  page = await openPage(browser, server.origin, 'popup.html', {
    url: REPO,
    stack: STACK,
    ...scene,
  });
  return page;
}

const cards = () => page.locator('[data-tool-id]');
const cardIds = () => cards().evaluateAll((all) => all.map((card) => card.dataset.toolId));

describe('the deck', () => {
  it('shows the repository and the chosen tools, in deck order', async () => {
    await popup();
    await expect.poll(cardIds).toEqual(STACK);
    expect(await page.locator('h1').innerText()).toBe('facebook/react');
  });

  it('opens a tool by its number and closes', async () => {
    await popup();
    await cards().first().waitFor();
    await page.keyboard.press('3');
    const activity = await activityOf(page);
    expect(activity.opened).toEqual(['https://gitdiagram.com/facebook/react']);
    expect(activity.closed).toBe(1);
  });

  it('opens the highlighted tool with the arrow keys and Enter', async () => {
    await popup();
    await cards().first().waitFor();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    expect((await activityOf(page)).opened).toEqual(['https://deepwiki.com/facebook/react']);
  });

  it('keeps focus with the highlight, so Enter opens the card the user sees', async () => {
    await popup();
    await cards().first().focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-tool-id'))).toBe(
      'gitdiagram',
    );
    await page.keyboard.press('Enter');
    expect((await activityOf(page)).opened).toEqual(['https://gitdiagram.com/facebook/react']);
  });

  it('lets Enter press a focused button rather than open a tool', async () => {
    await popup();
    await page.getByRole('button', { name: 'Change' }).focus();
    await page.keyboard.press('Enter');
    await page.getByText('Which repository?').waitFor();
    expect((await activityOf(page)).opened).toEqual([]);
  });

  it("goes back to the tab's repository after Change", async () => {
    await popup();
    await page.getByRole('button', { name: 'Change' }).click();
    await page.getByRole('button', { name: '← Back to facebook/react' }).click();
    await expect.poll(cardIds).toEqual(STACK);
  });

  it('copies a clone command and says so', async () => {
    await popup();
    await page.locator('[data-tool-id="clone-https"]').click();
    await page.getByRole('status').waitFor();
    expect((await activityOf(page)).copied).toEqual([
      'git clone https://github.com/facebook/react.git',
    ]);
    expect(await page.getByRole('status').innerText()).toContain('Copied');
  });

  it('filters with / and clears with Escape', async () => {
    await popup();
    await cards().first().waitFor();
    await page.keyboard.press('/');
    await page.keyboard.type('wiki');
    await expect.poll(cardIds).toEqual(['deepwiki']);
    await page.keyboard.press('Escape');
    await expect.poll(cardIds).toEqual(STACK);
  });

  it('counts a file-only tool as not available on a repository root', async () => {
    await popup({ stack: ['githistory', 'deepwiki'] });
    await expect.poll(cardIds).toEqual(['deepwiki']);
    expect(await page.locator('footer').innerText()).toContain('1 not available here');
  });

  it('offers a file-only tool on a file page', async () => {
    await popup({ url: `${REPO}/blob/main/README.md`, stack: ['githistory'] });
    await expect.poll(cardIds).toEqual(['githistory']);
  });

  it('does not offer a file-only tool on a folder page', async () => {
    await popup({ url: `${REPO}/tree/main/packages`, stack: ['githistory', 'deepwiki'] });
    await expect.poll(cardIds).toEqual(['deepwiki']);
  });
});

describe('loading and first run', () => {
  it('never flashes an empty deck while settings load', async () => {
    await popup({ settingsDelay: 300 });
    const seen = new Set<string>();
    const deadline = Date.now() + 1000;
    while (Date.now() < deadline) {
      seen.add(await page.locator('main').innerText());
      if ((await cards().count()) > 0) break;
    }
    expect([...seen].some((text) => text.includes('None of your tools'))).toBe(false);
    expect([...seen].some((text) => text.includes('Build your deck'))).toBe(false);
    expect(await cards().count()).toBe(STACK.length);
  });

  it('offers the recommended deck to a new user, and saves it', async () => {
    await popup({ stack: [] });
    await page.getByRole('button', { name: 'Use the recommended deck' }).click();
    await expect.poll(async () => (await cardIds()).length).toBe(8);
    const { writes } = await activityOf(page);
    expect(writes.at(-1)?.stack).toEqual(await cardIds());
  });
});

describe('outside a repository', () => {
  it('asks for a repository, and builds the deck from a pasted one', async () => {
    await popup({ url: 'https://example.com/' });
    const input = page.getByRole('textbox', { name: 'GitHub repository URL' });
    await input.fill('github.com/sveltejs/svelte');
    await input.press('Enter');
    await expect.poll(cardIds).toEqual(STACK);
    expect(await page.locator('h1').innerText()).toBe('sveltejs/svelte');
  });

  it('rejects something that is not a repository', async () => {
    await popup({ url: 'https://example.com/' });
    await page.getByRole('textbox', { name: 'GitHub repository URL' }).fill('github.com/copilot');
    expect(await page.getByRole('button', { name: 'Use' }).isDisabled()).toBe(true);
  });
});
