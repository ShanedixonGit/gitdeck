import { browser } from 'wxt/browser';
import type { OpenTarget } from '../settings';

/**
 * The URL of the tab the popup was opened from.
 *
 * Relies on the `activeTab` permission, which the browser grants for the
 * current tab only when the user clicks the extension action. Returns `null`
 * when no URL is available (for example on a browser-internal page).
 */
export async function getActiveTabUrl(): Promise<string | null> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    return tab?.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Sends the browser to a destination, honouring the user's open preference.
 *
 * `current-tab` navigates the tab the popup was opened from, which is the
 * point of a URL rewriter: you are on a repository and you want to be looking
 * at the same repository somewhere else. The others open a tab beside it,
 * either focused or left in the background.
 */
export async function openUrl(url: string, target: OpenTarget = 'new-tab'): Promise<void> {
  if (target === 'current-tab') {
    await browser.tabs.update({ url });
    return;
  }
  await browser.tabs.create({ url, active: target === 'new-tab' });
}
