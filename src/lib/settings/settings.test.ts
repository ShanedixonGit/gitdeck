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

describe('normaliseSettings — deck preferences', () => {
  it('defaults every list to empty and onboarding to unseen', () => {
    expect(normaliseSettings({})).toEqual({
      ...DEFAULT_SETTINGS,
      favourites: [],
      hidden: [],
      order: [],
      onboarded: false,
    });
  });

  it('keeps stored ids', () => {
    const settings = normaliseSettings({ favourites: ['a'], hidden: ['b'], order: ['b', 'a'] });
    expect(settings.favourites).toEqual(['a']);
    expect(settings.hidden).toEqual(['b']);
    expect(settings.order).toEqual(['b', 'a']);
  });

  it('drops entries that are not strings', () => {
    expect(normaliseSettings({ favourites: ['a', 3, null, {}, 'b'] }).favourites).toEqual([
      'a',
      'b',
    ]);
  });

  it('drops empty strings and duplicates', () => {
    expect(normaliseSettings({ order: ['a', '', 'a', 'b'] }).order).toEqual(['a', 'b']);
  });

  it('falls back to empty when the value is not a list', () => {
    expect(normaliseSettings({ favourites: 'a', hidden: 7 })).toMatchObject({
      favourites: [],
      hidden: [],
    });
  });

  it('caps a list that has grown out of hand', () => {
    const huge = Array.from({ length: 5000 }, (_, index) => `tool-${index}`);
    expect(normaliseSettings({ order: huge }).order.length).toBeLessThanOrEqual(200);
  });

  it('treats any non-true onboarded value as not yet onboarded', () => {
    expect(normaliseSettings({ onboarded: 'yes' }).onboarded).toBe(false);
    expect(normaliseSettings({ onboarded: true }).onboarded).toBe(true);
  });
});
