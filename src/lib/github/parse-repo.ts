import type { RepoRef } from './types';

const GITHUB_HOSTS = new Set(['github.com', 'www.github.com']);

const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const REPO_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

/**
 * First path segments on github.com that are site features rather than user or
 * organisation accounts. A URL starting with one of these is never a repository.
 *
 * Each was checked against github.com on 2026-09-23. Check before adding more:
 * some names that look like pages, such as `enterprise-cloud`, are accounts.
 */
const RESERVED_OWNERS = new Set([
  'about',
  'accelerator',
  'account',
  'apps',
  'codespaces',
  'collections',
  'contact',
  'copilot',
  'customer-stories',
  'dashboard',
  'education',
  'enterprise',
  'events',
  'explore',
  'features',
  'gist',
  'git-guides',
  'github-copilot',
  'home',
  'issues',
  'join',
  'login',
  'logout',
  'marketplace',
  'mcp',
  'mobile',
  'models',
  'new',
  'newsroom',
  'nonprofit',
  'notifications',
  'open-source',
  'organizations',
  'orgs',
  'partners',
  'premium-support',
  'pricing',
  'pulls',
  'readme',
  'resources',
  'search',
  'security',
  'settings',
  'site',
  'solutions',
  'spark',
  'sponsors',
  'stars',
  'team',
  'topics',
  'trending',
  'users',
]);

/** Path segments that introduce a `ref` followed by an optional `path`. */
const REF_SEGMENTS = new Set(['tree', 'blob', 'blame', 'raw', 'edit']);

const SSH_PATTERN = /^(?:git\+)?ssh:\/\/git@github\.com\/(.+)$|^git@github\.com:(.+)$/;

function normaliseRepoName(segment: string): string {
  return segment.endsWith('.git') ? segment.slice(0, -'.git'.length) : segment;
}

function toUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  const ssh = SSH_PATTERN.exec(trimmed);
  if (ssh) {
    const rest = ssh[1] ?? ssh[2];
    if (rest === undefined) return null;
    return toUrl(`https://github.com/${rest}`);
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme);
  } catch {
    return null;
  }
}

/**
 * Extracts an owner/repository reference from a GitHub URL.
 *
 * Accepts the common shapes a user can realistically have in the address bar or
 * on the clipboard: full HTTPS URLs, scheme-less URLs, `.git` suffixes, SSH
 * remotes, and deep links such as `/tree/<ref>/<path>` or `/blob/<ref>/<path>`.
 *
 * Returns `null` for anything that is not a repository, including GitHub site
 * pages (`/settings`, `/marketplace`, …) and non-GitHub hosts.
 *
 * Known limitation: a branch name containing a slash cannot be separated from
 * the file path it precedes without asking GitHub which branches exist. The
 * first segment after `tree`/`blob` is taken as the ref, so
 * `/blob/feature/x/src/a.ts` yields `ref: 'feature'` and `path: 'x/src/a.ts'`.
 * Only the two file-scoped tools are affected; owner and repo stay correct.
 */
export function parseGitHubRepo(input: string): RepoRef | null {
  const url = toUrl(input);
  if (url === null) return null;
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!GITHUB_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split('/').filter((segment) => segment !== '');
  const [rawOwner, rawRepo, ...rest] = segments;
  if (rawOwner === undefined || rawRepo === undefined) return null;

  let owner: string;
  let repo: string;
  try {
    owner = decodeURIComponent(rawOwner);
    repo = normaliseRepoName(decodeURIComponent(rawRepo));
  } catch {
    return null;
  }

  if (RESERVED_OWNERS.has(owner.toLowerCase())) return null;
  if (!OWNER_PATTERN.test(owner)) return null;
  if (!REPO_PATTERN.test(repo)) return null;
  if (repo === '.' || repo === '..') return null;

  const ref = extractRef(rest);
  const path = ref === undefined ? undefined : extractPath(rest);

  return {
    owner,
    repo,
    ...(ref === undefined ? {} : { ref }),
    ...(path === undefined || path === '' ? {} : { path }),
  };
}

function extractRef(rest: readonly string[]): string | undefined {
  const [kind, ref] = rest;
  if (kind === undefined || !REF_SEGMENTS.has(kind)) return undefined;
  if (ref === undefined || ref === '') return undefined;
  try {
    return decodeURIComponent(ref);
  } catch {
    return undefined;
  }
}

function extractPath(rest: readonly string[]): string | undefined {
  const segments = rest.slice(2);
  if (segments.length === 0) return undefined;
  try {
    return segments.map((segment) => decodeURIComponent(segment)).join('/');
  } catch {
    return undefined;
  }
}

/** Formats a reference back into its canonical `owner/repo` form. */
export function formatRepoRef(ref: RepoRef): string {
  return `${ref.owner}/${ref.repo}`;
}

/** The canonical github.com URL for a reference. */
export function repoUrl(ref: RepoRef): string {
  return `https://github.com/${ref.owner}/${ref.repo}`;
}
