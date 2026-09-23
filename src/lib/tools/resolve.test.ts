import { describe, expect, it } from 'vitest';
import { resolveTool, resolveTools, validateTool } from './resolve';
import type { ToolDefinition } from './types';

const base: ToolDefinition = {
  id: 'example',
  name: 'Do the example thing',
  brand: 'Example',
  description: 'Do a thing.',
  category: 'ide',
  urlTemplate: 'https://example.dev/{owner}/{repo}',
  website: 'https://example.dev',
  status: 'verified',
  verifiedAt: '2026-09-20',
};

const repo = { owner: 'facebook', repo: 'react' } as const;
const file = {
  owner: 'facebook',
  repo: 'react',
  ref: 'main',
  path: 'packages/react/README.md',
  file: 'packages/react/README.md',
};
const directory = { owner: 'facebook', repo: 'react', ref: 'main', path: 'packages/react' };

describe('resolveTool', () => {
  it('resolves a simple owner/repo template', () => {
    expect(resolveTool(base, repo)).toEqual({
      ok: true,
      url: 'https://example.dev/facebook/react',
    });
  });

  it('resolves a template with an encoded separator', () => {
    const tool = { ...base, urlTemplate: 'https://deps.dev/project/github/{owner}%2F{repo}' };
    expect(resolveTool(tool, repo)).toEqual({
      ok: true,
      url: 'https://deps.dev/project/github/facebook%2Freact',
    });
  });

  it('resolves a template with a query string', () => {
    const tool = { ...base, urlTemplate: 'https://s.dev/viewer/?uri=github.com/{owner}/{repo}' };
    expect(resolveTool(tool, repo)).toEqual({
      ok: true,
      url: 'https://s.dev/viewer/?uri=github.com/facebook/react',
    });
  });

  it('resolves a template with a hash fragment', () => {
    const tool = { ...base, urlTemplate: 'https://s.dev/#{owner}/{repo}' };
    expect(resolveTool(tool, repo)).toEqual({ ok: true, url: 'https://s.dev/#facebook/react' });
  });

  it('resolves a file-scoped template when a path is available', () => {
    const tool: ToolDefinition = {
      ...base,
      urlTemplate: 'https://h.dev/{owner}/{repo}/blob/{ref}/{path|path}',
      requires: ['ref', 'path'],
    };
    expect(resolveTool(tool, file)).toEqual({
      ok: true,
      url: 'https://h.dev/facebook/react/blob/main/packages/react/README.md',
    });
  });

  it('skips a file-scoped template when the repository has no path', () => {
    const tool: ToolDefinition = {
      ...base,
      urlTemplate: 'https://h.dev/{owner}/{repo}/blob/{ref}/{path|path}',
      requires: ['ref', 'path'],
    };
    const result = resolveTool(tool, repo);
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ reason: expect.stringContaining('ref') });
  });

  it('offers a file-only template on a file, and skips it on a directory', () => {
    const tool: ToolDefinition = {
      ...base,
      urlTemplate: 'https://h.dev/{owner}/{repo}/blob/{ref}/{file|path}',
      requires: ['ref', 'file'],
    };
    expect(resolveTool(tool, file)).toEqual({
      ok: true,
      url: 'https://h.dev/facebook/react/blob/main/packages/react/README.md',
    });
    expect(resolveTool(tool, directory)).toEqual({
      ok: false,
      reason: 'Needs a file — open a file first',
    });
  });

  it('escapes values that would otherwise change the URL structure', () => {
    const result = resolveTool(base, { owner: 'a/../b', repo: 'react' });
    expect(result).toEqual({ ok: true, url: 'https://example.dev/a%2F..%2Fb/react' });
  });

  it('reports a missing value instead of throwing', () => {
    const tool = { ...base, urlTemplate: 'https://example.dev/{ref}' };
    const result = resolveTool(tool, repo);
    expect(result.ok).toBe(false);
  });

  it('rejects a template that is not https', () => {
    const tool = { ...base, urlTemplate: 'http://example.dev/{owner}/{repo}' };
    expect(resolveTool(tool, repo)).toEqual({ ok: false, reason: 'Destination is not HTTPS' });
  });
});

describe('copy tools', () => {
  const ssh: ToolDefinition = {
    ...base,
    action: 'copy',
    urlTemplate: 'git clone git@github.com:{owner}/{repo}.git',
  };

  it('renders the text to copy, which need not be a URL', () => {
    expect(resolveTool(ssh, repo)).toEqual({
      ok: true,
      url: 'git clone git@github.com:facebook/react.git',
    });
  });

  it('passes validation without an https template', () => {
    expect(validateTool(ssh)).toEqual([]);
  });

  it('still requires https of a tool that opens', () => {
    expect(validateTool({ ...ssh, action: 'open' })).toContain('urlTemplate must be https');
  });

  it('may not put a branch or path into text the user pastes into a shell', () => {
    const checkout: ToolDefinition = {
      ...ssh,
      urlTemplate: 'git clone -b {ref} git@github.com:{owner}/{repo}.git',
      requires: ['ref'],
    };
    expect(validateTool(checkout)).toContain(
      'a copy template may only use {owner} and {repo}, not "{ref}"',
    );
  });
});

describe('resolveTools', () => {
  const tools: readonly ToolDefinition[] = [
    base,
    { ...base, id: 'beta', status: 'unverified' },
    { ...base, id: 'gone', status: 'deprecated' },
    { ...base, id: 'broken', urlTemplate: 'https://example.dev/{ref}' },
  ];

  it('returns only verified, resolvable tools by default', () => {
    const { resolved, skipped } = resolveTools(tools, repo);
    expect(resolved.map((entry) => entry.tool.id)).toEqual(['example']);
    expect(skipped.map((entry) => entry.tool.id)).toEqual(['beta', 'gone', 'broken']);
  });

  it('includes unverified tools when asked', () => {
    const { resolved } = resolveTools(tools, repo, {
      allowedStatuses: ['verified', 'unverified'],
    });
    expect(resolved.map((entry) => entry.tool.id)).toEqual(['example', 'beta']);
  });

  it('keeps working when one entry is broken', () => {
    const { resolved } = resolveTools(tools, repo);
    expect(resolved.length).toBeGreaterThan(0);
  });
});
