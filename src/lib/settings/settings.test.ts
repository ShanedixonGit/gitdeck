import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, OPEN_TARGETS, normaliseSettings } from './settings';

describe('OPEN_TARGETS', () => {
  it('has a unique id per target', () => {
    const ids = OPEN_TARGETS.map((target) => target.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the default', () => {
    expect(ids()).toContain(DEFAULT_SETTINGS.openTarget);
  });

  function ids() {
    return OPEN_TARGETS.map((target) => target.id);
  }
});

describe('normaliseSettings', () => {
  it('returns defaults for an empty store', () => {
    expect(normaliseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normaliseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('returns defaults for a value of the wrong type', () => {
    expect(normaliseSettings('new-tab')).toEqual(DEFAULT_SETTINGS);
    expect(normaliseSettings(42)).toEqual(DEFAULT_SETTINGS);
    expect(normaliseSettings([])).toEqual({ ...DEFAULT_SETTINGS });
  });

  it('keeps stored values that are valid', () => {
    expect(normaliseSettings({ openTarget: 'current-tab', includeUnverified: true })).toEqual({
      ...DEFAULT_SETTINGS,
      openTarget: 'current-tab',
      includeUnverified: true,
    });
  });

  it('accepts every declared open target', () => {
    for (const target of OPEN_TARGETS) {
      expect(normaliseSettings({ openTarget: target.id }).openTarget).toBe(target.id);
    }
  });

  it('falls back per field, so one bad key does not reset the rest', () => {
    expect(normaliseSettings({ openTarget: 'somewhere-else', includeUnverified: true })).toEqual({
      ...DEFAULT_SETTINGS,
      includeUnverified: true,
    });
    expect(normaliseSettings({ openTarget: 'current-tab', includeUnverified: 'yes' })).toEqual({
      ...DEFAULT_SETTINGS,
      openTarget: 'current-tab',
    });
  });

  it('ignores keys it does not know', () => {
    expect(normaliseSettings({ openTarget: 'current-tab', theme: 'dark' })).toEqual({
      ...DEFAULT_SETTINGS,
      openTarget: 'current-tab',
    });
  });
});

describe('normaliseSettings — stack', () => {
  it('defaults to an empty stack', () => {
    expect(normaliseSettings({}).stack).toEqual([]);
  });

  it('keeps stored ids in order', () => {
    expect(normaliseSettings({ stack: ['b', 'a'] }).stack).toEqual(['b', 'a']);
  });

  it('drops entries that are not strings', () => {
    expect(normaliseSettings({ stack: ['a', 3, null, {}, 'b'] }).stack).toEqual(['a', 'b']);
  });

  it('drops empty strings and duplicates', () => {
    expect(normaliseSettings({ stack: ['a', '', 'a', 'b'] }).stack).toEqual(['a', 'b']);
  });

  it('falls back to empty when the value is not a list', () => {
    expect(normaliseSettings({ stack: 'a' }).stack).toEqual([]);
  });

  it('caps a list that has grown out of hand', () => {
    const huge = Array.from({ length: 5000 }, (_, index) => `tool-${index}`);
    expect(normaliseSettings({ stack: huge }).stack.length).toBeLessThanOrEqual(200);
  });

  it('does not carry the old preference keys forward', () => {
    expect(Object.keys(normaliseSettings({ favourites: ['a'], hidden: ['b'] })).sort()).toEqual([
      'includeUnverified',
      'openTarget',
      'stack',
    ]);
  });
});

describe('normaliseSettings — settings from 0.2.0', () => {
  it('turns favourites into the stack', () => {
    expect(normaliseSettings({ favourites: ['a', 'b'] }).stack).toEqual(['a', 'b']);
  });

  it('orders them by the old stored order', () => {
    expect(normaliseSettings({ favourites: ['a', 'b'], order: ['b', 'c', 'a'] }).stack).toEqual([
      'b',
      'a',
    ]);
  });

  it('starts empty when nothing was starred, whatever was hidden', () => {
    expect(normaliseSettings({ favourites: [], hidden: ['a'], onboarded: true }).stack).toEqual([]);
  });

  it('prefers a stored stack over favourites', () => {
    expect(normaliseSettings({ stack: [], favourites: ['a'] }).stack).toEqual([]);
  });
});
