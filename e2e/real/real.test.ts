import { existsSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { executable, launchReal } from './drivers.ts';
import type { Driver, RealBrowser, Tab } from './drivers.ts';

const BROWSERS = (['chrome', 'edge', 'firefox'] as const).filter((name) =>
  existsSync(executable(name)),
);

const REPO_FIELD = 'input[aria-label="GitHub repository URL"]';
const DESTINATION =
  /^https:\/\/(github\.dev\/facebook\/react|vscode\.dev\/github\/facebook\/react)/;

async function waitFor<T>(tab: Tab, expression: string, accept: (value: T) => boolean) {
  let last: T | undefined;
  for (let tries = 0; tries < 50; tries += 1) {
    try {
      last = await tab.evaluate<T>(expression);
      if (accept(last)) return last;
    } catch {
      /* the page may be mid-navigation */
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw new Error(`Still waiting on ${expression}; last saw ${JSON.stringify(last)}`);
}

const count = (selector: string) => `document.querySelectorAll(${JSON.stringify(selector)}).length`;

describe.each(BROWSERS)('Repohopper in real %s', (name: RealBrowser) => {
  let browser: Driver;

  beforeAll(async () => {
    browser = await launchReal(name);
  });

  afterAll(async () => {
    await browser?.quit();
  });

  /** The popup on facebook/react, as if pasted in, with the deck showing. */
  async function popupOnRepo(): Promise<Tab> {
    const popup = await browser.open('popup.html');
    await waitFor<number>(popup, count(REPO_FIELD), (n) => n === 1);
    await popup.fill(REPO_FIELD, 'github.com/facebook/react');
    await popup.press('Enter');
    await waitFor<number>(popup, count('h1'), (n) => n === 1);
    return popup;
  }

  it('starts with an empty deck and takes the recommended one', async () => {
    const popup = await popupOnRepo();
    await waitFor<number>(popup, count('.first-run .primary'), (n) => n === 1);
    await popup.click('.first-run .primary');
    await waitFor<number>(popup, count('[data-tool-id]'), (n) => n === 8);
    await popup.close();
  });

  it('keeps the deck in real storage, for the popup and the options page', async () => {
    const options = await browser.open('options.html');
    await waitFor<number>(options, count('[data-handle]'), (n) => n === 8);
    await options.close();
    const popup = await popupOnRepo();
    await waitFor<number>(popup, count('[data-tool-id]'), (n) => n === 8);
    await popup.close();
  });

  it('opens a tool in a new tab with a number key', async () => {
    const popup = await popupOnRepo();
    await waitFor<number>(popup, count('[data-tool-id]'), (n) => n === 8);
    await popup.press('1');
    let urls: string[] = [];
    for (let tries = 0; tries < 75 && !urls.some((url) => DESTINATION.test(url)); tries += 1) {
      await new Promise((done) => setTimeout(done, 200));
      urls = await browser.urls();
    }
    expect(
      urls.some((url) => DESTINATION.test(url)),
      urls.join(', '),
    ).toBe(true);
  });

  it('copies a clone command', async () => {
    const popup = await popupOnRepo();
    await waitFor<number>(popup, count('[data-tool-id="clone-https"]'), (n) => n === 1);
    await popup.click('[data-tool-id="clone-https"]');
    const notice = await waitFor<string | null>(
      popup,
      `document.querySelector('.notice')?.textContent ?? null`,
      (text) => text !== null,
    );
    expect(notice).toBe('Copied git clone https://github.com/facebook/react.git');
    const clipboard = await browser.clipboard();
    if (clipboard !== null)
      expect(clipboard).toBe('git clone https://github.com/facebook/react.git');
  });

  it('opens the options page from Customise', async () => {
    const popup = await popupOnRepo();
    await popup.click('footer .settings');
    let urls: string[] = [];
    for (
      let tries = 0;
      tries < 50 && !urls.some((url) => url.endsWith('/options.html'));
      tries += 1
    ) {
      await new Promise((done) => setTimeout(done, 200));
      urls = await browser.urls();
    }
    expect(
      urls.some((url) => url.endsWith('/options.html')),
      urls.join(', '),
    ).toBe(true);
  });

  it('adds a tool on the options page, and keeps it', async () => {
    const options = await browser.open('options.html');
    await waitFor<number>(options, count('[data-handle]'), (n) => n === 8);
    await options.click('button[aria-label="Add Run it in the browser to your deck"]');
    await waitFor<number>(options, count('[data-handle]'), (n) => n === 9);
    await new Promise((done) => setTimeout(done, 800));
    await options.close();
    const again = await browser.open('options.html');
    await waitFor<number>(again, count('[data-handle="stackblitz"]'), (n) => n === 1);
    await again.close();
  });

  it('opens a tool in the same tab when set to', async () => {
    const options = await browser.open('options.html');
    await waitFor<number>(options, count('input[name="open-target"]'), (n) => n === 3);
    await options.click('label.target:nth-child(2) input');
    await waitFor<boolean>(
      options,
      `document.querySelectorAll('input[name="open-target"]')[1].checked`,
      (on) => on,
    );
    await new Promise((done) => setTimeout(done, 800));
    await options.close();
    const popup = await popupOnRepo();
    await waitFor<number>(popup, count('[data-tool-id]'), (n) => n === 9);
    const tabsBefore = (await browser.urls()).length;
    await popup.press('1');
    let urls: string[] = [];
    for (let tries = 0; tries < 75 && !urls.some((url) => DESTINATION.test(url)); tries += 1) {
      await new Promise((done) => setTimeout(done, 200));
      urls = await browser.urls();
    }
    expect(
      urls.some((url) => DESTINATION.test(url)),
      urls.join(', '),
    ).toBe(true);
    expect(urls.length).toBeLessThanOrEqual(tabsBefore);
  });

  it('logged no errors from its own pages', async () => {
    expect(await browser.errors()).toEqual([]);
  });
});
