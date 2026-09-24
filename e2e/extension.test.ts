import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import type { BrowserContext, Page } from 'playwright-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildFor } from '../scripts/harness.ts';

/**
 * The real extension, loaded unpacked into Playwright's Chromium: real
 * manifest, real storage, real tabs and clipboard. Branded Chrome no longer
 * loads extensions from the command line, hence Chromium. What this cannot do
 * is click the toolbar button, so the popup is opened as a page, finds no
 * repository in its own tab, and is given one; `activeTab` on a GitHub tab stays
 * a manual check. The deck chosen in the first test carries into the others.
 */

const BUILD = buildFor('chrome');

/** Chrome's id for an unpacked extension: its path, hashed, spelled in a–p. */
const EXTENSION_ID = createHash('sha256')
  .update(BUILD)
  .digest('hex')
  .slice(0, 32)
  .replace(/./g, (hex) => String.fromCharCode(97 + parseInt(hex, 16)));

let profile: string;
let context: BrowserContext;

beforeAll(async () => {
  profile = await mkdtemp(join(tmpdir(), 'repohopper-'));
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${BUILD}`, `--load-extension=${BUILD}`],
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});

afterAll(async () => {
  await context?.close();
  if (profile) await rm(profile, { recursive: true, force: true });
});

async function open(file: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${EXTENSION_ID}/${file}`);
  return page;
}

describe('the packaged extension in Chromium', () => {
  it('loads, and keeps a chosen deck in real storage', async () => {
    const popup = await open('popup.html');
    const input = popup.getByRole('textbox', { name: 'GitHub repository URL' });
    await input.fill('github.com/facebook/react');
    await input.press('Enter');
    await popup.getByRole('button', { name: 'Use the recommended deck' }).click();
    await expect.poll(() => popup.locator('[data-tool-id]').count()).toBe(8);
    await popup.close();

    const options = await open('options.html');
    await expect.poll(() => options.locator('[data-handle]').count()).toBe(8);
    await options.close();
  });

  it('opens a tool in a real new tab', async () => {
    const popup = await open('popup.html');
    const input = popup.getByRole('textbox', { name: 'GitHub repository URL' });
    await input.fill('github.com/facebook/react');
    await input.press('Enter');
    await popup.locator('[data-tool-id="github-dev"]').waitFor();
    const opened = context.waitForEvent('page');
    await popup.locator('[data-tool-id="github-dev"]').click();
    // A tab the extension opens is not interceptable, so this loads the real service, and
    // github.dev forwards to vscode.dev.
    const tab = await opened;
    await tab.waitForURL(
      /^https:\/\/(github\.dev\/facebook\/react|vscode\.dev\/github\/facebook\/react)/,
    );
  });

  it('copies a clone command to the real clipboard', async () => {
    const popup = await open('popup.html');
    const input = popup.getByRole('textbox', { name: 'GitHub repository URL' });
    await input.fill('github.com/facebook/react');
    await input.press('Enter');
    await popup.locator('[data-tool-id="clone-https"]').click();
    await popup.getByRole('status').waitFor();
    expect(await popup.evaluate(() => navigator.clipboard.readText())).toBe(
      'git clone https://github.com/facebook/react.git',
    );
  });
});
