import { describe, expect, it } from 'vitest';
import { flattenGroups, groupByCategory } from './group';
import type { ResolvedTool } from './resolve';
import type { ToolCategory } from './types';

function entry(id: string, category: ToolCategory): ResolvedTool {
  return {
    url: `https://${id}.dev/o/r`,
    tool: {
      id,
      name: id,
      description: 'Do a thing.',
      category,
      urlTemplate: `https://${id}.dev/{owner}/{repo}`,
      website: `https://${id}.dev`,
      status: 'verified',
      verifiedAt: '2026-09-20',
    },
  };
}

describe('groupByCategory', () => {
  it('returns nothing for an empty deck', () => {
    expect(groupByCategory([])).toEqual([]);
  });

  it('omits categories with no tools', () => {
    const groups = groupByCategory([entry('a', 'ide')]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe('ide');
  });

  it('orders sections by the declared category order, not input order', () => {
    const groups = groupByCategory([entry('a', 'search'), entry('b', 'ide')]);
    expect(groups.map((group) => group.id)).toEqual(['ide', 'search']);
  });

  it('keeps input order within a section', () => {
    const groups = groupByCategory([entry('b', 'ide'), entry('a', 'ide')]);
    expect(groups[0]?.entries.map((e) => e.tool.id)).toEqual(['b', 'a']);
  });

  it('labels each section', () => {
    expect(groupByCategory([entry('a', 'ide')])[0]?.label).toBe('Open in an editor');
  });
});

describe('flattenGroups', () => {
  it('returns tools in the order they appear on screen', () => {
    const groups = groupByCategory([
      entry('search-tool', 'search'),
      entry('ide-tool', 'ide'),
      entry('other-ide', 'ide'),
    ]);
    expect(flattenGroups(groups).map((e) => e.tool.id)).toEqual([
      'ide-tool',
      'other-ide',
      'search-tool',
    ]);
  });

  it('round-trips an empty deck', () => {
    expect(flattenGroups(groupByCategory([]))).toEqual([]);
  });
});

describe('favourites', () => {
  it('pulls starred tools into a section above the categories', () => {
    const groups = groupByCategory([entry('a', 'ide'), entry('b', 'search')], ['b']);
    expect(groups.map((group) => group.id)).toEqual(['favourites', 'ide']);
    expect(groups[0]?.entries.map((e) => e.tool.id)).toEqual(['b']);
  });

  it('shows a starred tool once, not in both places', () => {
    const groups = groupByCategory([entry('a', 'ide')], ['a']);
    expect(groups.map((group) => group.id)).toEqual(['favourites']);
    expect(flattenGroups(groups)).toHaveLength(1);
  });

  it('omits the section when nothing is starred', () => {
    const groups = groupByCategory([entry('a', 'ide')], []);
    expect(groups.map((group) => group.id)).toEqual(['ide']);
  });

  it('ignores favourites that are not in the deck', () => {
    const groups = groupByCategory([entry('a', 'ide')], ['gone']);
    expect(groups.map((group) => group.id)).toEqual(['ide']);
  });

  it('keeps the deck order inside the favourites section', () => {
    const groups = groupByCategory([entry('a', 'ide'), entry('b', 'search')], ['b', 'a']);
    expect(groups[0]?.entries.map((e) => e.tool.id)).toEqual(['a', 'b']);
  });

  it('gives every section a tint', () => {
    const groups = groupByCategory([entry('a', 'ide'), entry('b', 'search')], ['b']);
    for (const group of groups) expect(group.tint).toMatch(/^--tint-/);
  });
});
