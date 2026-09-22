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

  it('names every tool by its job and its brand, and never the same way twice', () => {
    for (const tool of TOOLS) {
      expect(tool.brand, `${tool.id} needs a brand`).toBeTruthy();
      expect(tool.name, `${tool.id} is named after its brand`).not.toBe(tool.brand);
    }
  });

  it('recommends exactly one verified tool per section', () => {
    for (const section of CATEGORIES) {
      const picks = TOOLS.filter((tool) => tool.category === section.id && tool.recommended);
      expect(
        picks.map((tool) => tool.id),
        section.id,
      ).toHaveLength(1);
      expect(picks[0]?.status, section.id).toBe('verified');
    }
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
