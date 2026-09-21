import type { OpenTarget, Settings } from './types';

/** The open targets offered in the settings panel, in display order. */
export const OPEN_TARGETS: ReadonlyArray<{ id: OpenTarget; label: string; hint: string }> = [
  { id: 'new-tab', label: 'A new tab', hint: 'Opens beside this one and switches to it.' },
  { id: 'current-tab', label: 'This tab', hint: 'Replaces the page you are on.' },
  { id: 'background-tab', label: 'A background tab', hint: 'Stays here, so you can open several.' },
];

export const DEFAULT_SETTINGS: Settings = {
  openTarget: 'new-tab',
  includeUnverified: false,
};

const TARGETS = new Set<string>(OPEN_TARGETS.map((target) => target.id));

function isOpenTarget(value: unknown): value is OpenTarget {
  return typeof value === 'string' && TARGETS.has(value);
}

/**
 * Turns whatever came back from storage into usable settings.
 *
 * Storage is not a trusted source: it may hold `null` on first run, a shape
 * written by an older version, or a value the user edited by hand. Each field
 * falls back independently so one bad key cannot reset the rest.
 */
export function normaliseSettings(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS;
  const stored = value as Partial<Record<keyof Settings, unknown>>;
  return {
    openTarget: isOpenTarget(stored.openTarget) ? stored.openTarget : DEFAULT_SETTINGS.openTarget,
    includeUnverified:
      typeof stored.includeUnverified === 'boolean'
        ? stored.includeUnverified
        : DEFAULT_SETTINGS.includeUnverified,
  };
}
