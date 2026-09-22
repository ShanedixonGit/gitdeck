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
  stack: [],
};

/**
 * An upper bound on each stored id list.
 *
 * Storage is shared with the browser's sync quota, and nothing legitimate ever
 * names more tools than the registry holds. The cap stops a corrupted or
 * hand-edited value growing without limit.
 */
const MAX_IDS = 200;

/** Keeps the strings, drops duplicates, and caps the length. */
function idList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string' || item === '') continue;
    seen.add(item);
    if (seen.size >= MAX_IDS) break;
  }
  return [...seen];
}

const TARGETS = new Set<string>(OPEN_TARGETS.map((target) => target.id));

function isOpenTarget(value: unknown): value is OpenTarget {
  return typeof value === 'string' && TARGETS.has(value);
}

/**
 * The stack for settings written before there was one.
 *
 * 0.2.0 showed every tool and pinned `favourites` on top, sorted by `order`.
 * Starred tools were the ones the user reached for, so they become the stack;
 * with nothing starred the stack starts empty and the user picks afresh.
 */
function legacyStack(stored: Partial<Record<string, unknown>>): readonly string[] {
  const favourites = idList(stored.favourites);
  const rank = new Map(idList(stored.order).map((id, index) => [id, index]));
  return [...favourites].sort((a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity));
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
  const stored = value as Partial<Record<string, unknown>>;
  return {
    openTarget: isOpenTarget(stored.openTarget) ? stored.openTarget : DEFAULT_SETTINGS.openTarget,
    includeUnverified:
      typeof stored.includeUnverified === 'boolean'
        ? stored.includeUnverified
        : DEFAULT_SETTINGS.includeUnverified,
    stack: Array.isArray(stored.stack) ? idList(stored.stack) : legacyStack(stored),
  };
}
