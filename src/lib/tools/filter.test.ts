import { describe, expect, it } from 'vitest';
import { filterTools } from './filter';
import type { ResolvedTool } from './resolve';

function entry(id: string, name: string, description: string, category = 'ide'): ResolvedTool {
  return {
    url: `https://${id}.dev/o/r`,
    tool: {
      id,
      name,
      description,
      category: category as ResolvedTool['tool']['category'],
      urlTemplate: `https://${id}.dev/{owner}/{repo}`,
      website: `https://${id}.dev`,
      status: 'verified',
      verifiedAt: '2026-09-20',
    },
  };
}

const entries = [
  entry('github-dev', 'GitHub.dev', 'Open the repository in a browser-based VS Code editor.'),
  entry('gitdiagram', 'GitDiagram', 'Generate an architecture diagram.', 'visualise'),
  entry('deps-dev', 'Open Source Insights', 'Explore the dependency graph.', 'security'),
];

describe('filterTools', () => {
  it('returns everything for an empty query', () => {
    expect(filterTools(entries, '')).toEqual(entries);
  });

  it('returns everything for a whitespace query', () => {
    expect(filterTools(entries, '   ')).toEqual(entries);
  });

  it('matches on name, case-insensitively', () => {
    expect(filterTools(entries, 'gitdiagram').map((e) => e.tool.id)).toEqual(['gitdiagram']);
  });

  it('matches on description', () => {
    expect(filterTools(entries, 'dependency').map((e) => e.tool.id)).toEqual(['deps-dev']);
  });

  it('matches on id', () => {
    expect(filterTools(entries, 'github-dev').map((e) => e.tool.id)).toEqual(['github-dev']);
  });

  it('matches on category label', () => {
    expect(filterTools(entries, 'visualise').map((e) => e.tool.id)).toEqual(['gitdiagram']);
  });

  it('trims the query', () => {
    expect(filterTools(entries, '  diagram  ').map((e) => e.tool.id)).toEqual(['gitdiagram']);
  });

  it('returns nothing when nothing matches', () => {
    expect(filterTools(entries, 'kubernetes')).toEqual([]);
  });
});
