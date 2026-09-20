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
    expect(groups[0]?.category).toBe('ide');
  });

  it('orders sections by the declared category order, not input order', () => {
    const groups = groupByCategory([entry('a', 'search'), entry('b', 'ide')]);
    expect(groups.map((group) => group.category)).toEqual(['ide', 'search']);
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
