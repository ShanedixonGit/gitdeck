import { describe, expect, it } from 'vitest';
import { CATEGORIES, category } from './categories';

describe('CATEGORIES', () => {
  it('has a unique id per category', () => {
    const ids = CATEGORIES.map((each) => each.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every category a tint and an icon', () => {
    for (const each of CATEGORIES) {
      expect(each.tint, each.id).toMatch(/^--tint-/);
      expect(each.icon.length, each.id).toBeGreaterThan(0);
      for (const path of each.icon) expect(path, each.id).toMatch(/^[mM]/);
    }
  });

  it('looks a category up by id', () => {
    expect(category('security').label).toBe('Security & dependencies');
  });
});
