import { describe, expect, it } from 'vitest';
import { formatRepoRef, parseGitHubRepo, repoUrl } from './parse-repo';

describe('parseGitHubRepo — supported URL formats', () => {
  const cases: ReadonlyArray<[string, string]> = [
    ['https://github.com/facebook/react', 'facebook/react'],
    ['https://github.com/facebook/react/', 'facebook/react'],
    ['http://github.com/facebook/react', 'facebook/react'],
    ['https://www.github.com/facebook/react', 'facebook/react'],
    ['github.com/facebook/react', 'facebook/react'],
    ['  https://github.com/facebook/react  ', 'facebook/react'],
    ['https://github.com/facebook/react.git', 'facebook/react'],
    ['git@github.com:facebook/react.git', 'facebook/react'],
    ['ssh://git@github.com/facebook/react.git', 'facebook/react'],
    ['https://github.com/facebook/react?tab=readme-ov-file', 'facebook/react'],
    ['https://github.com/facebook/react#readme', 'facebook/react'],
    ['https://github.com/facebook/react/issues/123', 'facebook/react'],
    ['https://github.com/facebook/react/pull/456/files', 'facebook/react'],
    ['https://github.com/facebook/react/settings', 'facebook/react'],
    ['https://GitHub.com/facebook/react', 'facebook/react'],
    ['https://github.com/a/b', 'a/b'],
    ['https://github.com/dotnet/aspnetcore', 'dotnet/aspnetcore'],
    ['https://github.com/my-org/my.repo_name-1', 'my-org/my.repo_name-1'],
  ];

  it.each(cases)('parses %s', (input, expected) => {
    const ref = parseGitHubRepo(input);
    expect(ref).not.toBeNull();
    expect(formatRepoRef(ref!)).toBe(expected);
  });
});

describe('parseGitHubRepo — refs and paths', () => {
  it('extracts a ref from a tree URL', () => {
    expect(parseGitHubRepo('https://github.com/facebook/react/tree/main')).toEqual({
      owner: 'facebook',
      repo: 'react',
      ref: 'main',
    });
  });

  it('extracts a ref and directory path from a tree URL', () => {
    expect(parseGitHubRepo('https://github.com/facebook/react/tree/main/packages/react')).toEqual({
      owner: 'facebook',
      repo: 'react',
      ref: 'main',
      path: 'packages/react',
    });
  });

  it('extracts a ref and file path from a blob URL', () => {
    expect(parseGitHubRepo('https://github.com/facebook/react/blob/v19.0.0/README.md')).toEqual({
      owner: 'facebook',
      repo: 'react',
      ref: 'v19.0.0',
      path: 'README.md',
    });
  });

  it('decodes percent-encoded path segments', () => {
    expect(parseGitHubRepo('https://github.com/o/r/blob/main/a%20b/c.md')?.path).toBe('a b/c.md');
  });

  it('ignores a ref segment with nothing after it', () => {
    expect(parseGitHubRepo('https://github.com/facebook/react/tree')).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
  });

  it('splits a slashed branch name at the first segment (documented limitation)', () => {
    expect(parseGitHubRepo('https://github.com/o/r/blob/feature/x/src/a.ts')).toEqual({
      owner: 'o',
      repo: 'r',
      ref: 'feature',
      path: 'x/src/a.ts',
    });
  });

  it('does not treat non-ref segments as a ref', () => {
    expect(parseGitHubRepo('https://github.com/facebook/react/actions/runs/1')).toEqual({
      owner: 'facebook',
      repo: 'react',
    });
  });
});

describe('parseGitHubRepo — invalid input', () => {
  const invalid: readonly string[] = [
    '',
    '   ',
    'not a url',
    'https://gitlab.com/owner/repo',
    'https://bitbucket.org/owner/repo',
    'https://github.com',
    'https://github.com/',
    'https://github.com/facebook',
    'https://evil.com/github.com/facebook/react',
    'https://github.com.evil.com/facebook/react',
    'javascript:alert(1)',
    'ftp://github.com/facebook/react',
    'https://gist.github.com/someone/abc123',
    'https://github.com/settings/profile',
    'https://github.com/marketplace/actions/checkout',
    'https://github.com/orgs/facebook/repositories',
    'https://github.com/topics/javascript',
    'https://github.com/codespaces/new',
    'https://github.com/search?q=react',
    'https://github.com/copilot/c/123',
    'https://github.com/models/openai',
    'https://github.com/resources/articles',
    'https://github.com/readme/guides',
    'https://github.com/-bad/repo',
    'https://github.com/bad-/repo',
    'https://github.com/ba--d/repo',
    'https://github.com/owner/.',
    'https://github.com/owner/..',
    'https://github.com/owner/re po',
    'https://github.com/owner/re$po',
  ];

  it.each(invalid)('rejects %s', (input) => {
    expect(parseGitHubRepo(input)).toBeNull();
  });

  it('still accepts an account whose name only resembles a site page', () => {
    expect(parseGitHubRepo('https://github.com/enterprise-cloud/repo')).not.toBeNull();
  });

  it('rejects an owner longer than 39 characters', () => {
    expect(parseGitHubRepo(`https://github.com/${'a'.repeat(40)}/repo`)).toBeNull();
  });

  it('accepts an owner of exactly 39 characters', () => {
    expect(parseGitHubRepo(`https://github.com/${'a'.repeat(39)}/repo`)).not.toBeNull();
  });

  it('rejects a repository name longer than 100 characters', () => {
    expect(parseGitHubRepo(`https://github.com/owner/${'a'.repeat(101)}`)).toBeNull();
  });
});

describe('repoUrl', () => {
  it('rebuilds the canonical repository URL', () => {
    expect(repoUrl({ owner: 'facebook', repo: 'react' })).toBe('https://github.com/facebook/react');
  });
});
