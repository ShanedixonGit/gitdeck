import { describe, expect, it } from 'vitest';
import { TOOLS } from './registry';
import { CATEGORIES } from './categories';
import { resolveTool, validateTool } from './resolve';

const repo = { owner: 'facebook', repo: 'react', ref: 'main', path: 'packages/react/index.js' };

describe('tool registry', () => {
  it('is not empty', () => {
    expect(TOOLS.length).toBeGreaterThanOrEqual(10);
  });

  it('has unique ids', () => {
    const ids = TOOLS.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique names', () => {
    const names = TOOLS.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('only uses declared categories', () => {
    const known = new Set(CATEGORIES.map((category) => category.id));
    for (const tool of TOOLS) {
      expect(known.has(tool.category), `${tool.id} has category ${tool.category}`).toBe(true);
    }
  });

  it.each(TOOLS.map((tool) => [tool.id, tool] as const))(
    '%s is structurally valid',
    (_id, tool) => {
      expect(validateTool(tool)).toEqual([]);
    },
  );

  it.each(TOOLS.map((tool) => [tool.id, tool] as const))(
    '%s resolves against a full repository reference',
    (_id, tool) => {
      const result = resolveTool(tool, repo);
      expect(result.ok, `${tool.id}: ${result.ok ? '' : result.reason}`).toBe(true);
    },
  );

  it('documents a caveat for every unverified tool', () => {
    for (const tool of TOOLS) {
      if (tool.status !== 'verified') {
        expect(tool.notes, `${tool.id} needs notes explaining its status`).toBeTruthy();
      }
    }
  });
});
