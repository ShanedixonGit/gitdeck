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
      openTarget: DEFAULT_SETTINGS.openTarget,
      includeUnverified: true,
    });
    expect(normaliseSettings({ openTarget: 'current-tab', includeUnverified: 'yes' })).toEqual({
      openTarget: 'current-tab',
      includeUnverified: DEFAULT_SETTINGS.includeUnverified,
    });
  });

  it('ignores keys it does not know', () => {
    expect(normaliseSettings({ openTarget: 'current-tab', theme: 'dark' })).toEqual({
      openTarget: 'current-tab',
      includeUnverified: false,
    });
  });
});
