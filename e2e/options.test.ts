import type { Browser, Page } from 'playwright-core';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  activityOf,
  failWrites,
  launch,
  openPage,
  serve,
  writeElsewhere,
} from '../scripts/harness.ts';

const STACK = ['github-dev', 'deepwiki', 'gitdiagram'];

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

async function options(stack: readonly string[] = STACK) {
  page = await openPage(browser, server.origin, 'options.html', {
    url: 'https://github.com/facebook/react',
    stack,
  });
  await page.locator('.panels').waitFor();
  return page;
}

const deck = () =>
  page.locator('[data-handle]').evaluateAll((all) => all.map((handle) => handle.dataset.handle));
const lastWrite = async () => (await activityOf(page)).writes.at(-1)?.stack;

describe('options page', () => {
  it('adds a tool with + and saves it', async () => {
    await options();
    await page.getByRole('button', { name: 'Add Run it in the browser to your deck' }).click();
    await expect.poll(deck).toEqual([...STACK, 'stackblitz']);
    await expect.poll(lastWrite).toEqual([...STACK, 'stackblitz']);
  });

  it('removes a tool with × and saves it', async () => {
    await options();
    await page.getByRole('button', { name: 'Remove Read a generated wiki from your deck' }).click();
    await expect.poll(lastWrite).toEqual(['github-dev', 'gitdiagram']);
  });

  it('saves a burst of reordering once, when it settles', async () => {
    await options();
    await page.locator('[data-handle="github-dev"]').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');
    await expect.poll(lastWrite).toEqual(['deepwiki', 'github-dev', 'gitdiagram']);
    expect((await activityOf(page)).writes).toHaveLength(1);
  });

  it('says when the browser refuses a save, and clears it once one succeeds', async () => {
    await options();
    await failWrites(page, true);
    await page.getByRole('button', { name: 'Remove Browse in VS Code from your deck' }).click();
    await page.getByRole('alert').waitFor();
    await failWrites(page, false);
    await page.getByRole('button', { name: 'Remove Read a generated wiki from your deck' }).click();
    await page.getByRole('alert').waitFor({ state: 'detached' });
    expect(await lastWrite()).toEqual(['gitdiagram']);
  });

  it('lets the keyboard choose where tools open', async () => {
    await options();
    const radios = page.locator('input[name="open-target"]');
    await radios.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => radios.nth(1).isChecked()).toBe(true);
    await expect
      .poll(async () => (await activityOf(page)).writes.at(-1)?.openTarget)
      .toBe('current-tab');
  });

  it('fills an empty deck with the recommended one', async () => {
    await options([]);
    await page.getByRole('button', { name: 'Use the recommended deck' }).click();
    await expect.poll(async () => (await deck()).length).toBe(8);
  });

  it('undoes emptying the deck', async () => {
    await options();
    await page.getByRole('button', { name: 'Empty your deck' }).click();
    await expect.poll(deck).toEqual([]);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect.poll(deck).toEqual(STACK);
    await expect.poll(lastWrite).toEqual(STACK);
  });

  it('follows a change made in another page', async () => {
    await options();
    await writeElsewhere(page, { stack: ['gitingest'] });
    await expect.poll(deck).toEqual(['gitingest']);
  });

  it('keeps its own unsaved change over one made elsewhere', async () => {
    await options();
    await page.getByRole('button', { name: 'Remove Browse in VS Code from your deck' }).click();
    await writeElsewhere(page, { stack: ['gitingest'] });
    expect(await deck()).toEqual(['deepwiki', 'gitdiagram']);
    await expect.poll(lastWrite).toEqual(['deepwiki', 'gitdiagram']);
  });
});
