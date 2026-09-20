import { browser } from 'wxt/browser';

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

/** Opens a destination in a new tab next to the current one. */
export async function openUrl(url: string): Promise<void> {
  await browser.tabs.create({ url, active: true });
}
