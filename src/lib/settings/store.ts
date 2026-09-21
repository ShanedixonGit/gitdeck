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
 * Persists settings. A failure here is never worth interrupting the user for:
 * the popup keeps working with the settings it holds in memory.
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await ITEM.setValue(settings);
  } catch {
    /* preferences are a convenience, not a requirement */
  }
}
