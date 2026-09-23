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
 * Persists settings, resolving to whether the write succeeded. It never throws:
 * the caller keeps working with the settings it holds in memory, and decides
 * whether a failed write is worth telling the user about.
 */
export async function saveSettings(settings: Settings): Promise<boolean> {
  try {
    await ITEM.setValue(settings);
    return true;
  } catch {
    return false;
  }
}
