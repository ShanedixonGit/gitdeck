import { storage } from 'wxt/utils/storage';
import { DEFAULT_SETTINGS, normaliseSettings } from './settings';
import type { Settings } from './types';

const ITEM = storage.defineItem<unknown>('sync:settings', { fallback: null });

/** Reads the stored settings, falling back to defaults if storage is unusable. */
export async function loadSettings(): Promise<Settings> {
  try {
    return normaliseSettings(await ITEM.getValue());
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Calls back with the settings whenever another page — the popup, or a second
 * options tab — changes them. Returns a function that stops watching.
 */
export function watchSettings(onchange: (settings: Settings) => void): () => void {
  return ITEM.watch((value) => onchange(normaliseSettings(value)));
}

/**
 * A structured-clone-safe copy. Callers hold settings in Svelte state, which
 * wraps them in proxies; Chrome's storage reads through a proxy, but Firefox
 * structured-clones the value and throws on one.
 */
function plain(settings: Settings): Settings {
  return {
    openTarget: settings.openTarget,
    includeUnverified: settings.includeUnverified,
    stack: [...settings.stack],
  };
}

/**
 * Persists settings, resolving to whether the write succeeded. It never throws:
 * the caller keeps working with the settings it holds in memory, and decides
 * whether a failed write is worth telling the user about.
 */
export async function saveSettings(settings: Settings): Promise<boolean> {
  try {
    await ITEM.setValue(plain(settings));
    return true;
  } catch {
    return false;
  }
}
