import type { RepoRef } from '../github/types';
import { renderTemplate, templatePlaceholders, TemplateError } from './template';
import type { ToolDefinition, ToolStatus } from './types';

/**
 * A tool whose template has been rendered for a repository: the destination URL
 * for an `open` tool, the text to copy for a `copy` tool.
 */
export interface ResolvedTool {
  readonly tool: ToolDefinition;
  readonly url: string;
}

/** A tool that could not be offered, with a human-readable reason. */
export interface SkippedTool {
  readonly tool: ToolDefinition;
  readonly reason: string;
}

export interface ResolutionResult {
  readonly resolved: readonly ResolvedTool[];
  readonly skipped: readonly SkippedTool[];
}

export interface ResolveOptions {
  /** Statuses to include. Defaults to `verified` only. */
  readonly allowedStatuses?: readonly ToolStatus[];
}

const DEFAULT_STATUSES: readonly ToolStatus[] = ['verified'];

function templateValues(repo: RepoRef): Record<string, string | undefined> {
  return { owner: repo.owner, repo: repo.repo, ref: repo.ref, path: repo.path };
}

/**
 * Computes the destination URL for a single tool.
 *
 * Returns a reason instead of throwing so that one bad entry can never take
 * down the deck: callers render what resolved and can surface the rest.
 */
export function resolveTool(
  tool: ToolDefinition,
  repo: RepoRef,
): { ok: true; url: string } | { ok: false; reason: string } {
  const required = tool.requires ?? [];
  const values = templateValues(repo);

  for (const field of required) {
    if (values[field] === undefined) {
      return { ok: false, reason: `Needs a ${field} — open a file or branch first` };
    }
  }

  let url: string;
  try {
    url = renderTemplate(tool.urlTemplate, values);
  } catch (error) {
    const message = error instanceof TemplateError ? error.message : 'Template failed to render';
    return { ok: false, reason: message };
  }

  if (tool.action === 'copy') return { ok: true, url };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'Template produced an invalid URL' };
  }
  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'Destination is not HTTPS' };
  }

  return { ok: true, url };
}

/** Resolves a list of tools for a repository, partitioning the failures. */
export function resolveTools(
  tools: readonly ToolDefinition[],
  repo: RepoRef,
  options: ResolveOptions = {},
): ResolutionResult {
  const allowed = new Set(options.allowedStatuses ?? DEFAULT_STATUSES);
  const resolved: ResolvedTool[] = [];
  const skipped: SkippedTool[] = [];

  for (const tool of tools) {
    if (!allowed.has(tool.status)) {
      skipped.push({ tool, reason: `Status is "${tool.status}"` });
      continue;
    }
    const result = resolveTool(tool, repo);
    if (result.ok) {
      resolved.push({ tool, url: result.url });
    } else {
      skipped.push({ tool, reason: result.reason });
    }
  }

  return { resolved, skipped };
}

/**
 * Structural problems in a tool definition, independent of any repository.
 * Used by the registry test so a broken entry fails CI rather than the popup.
 */
export function validateTool(tool: ToolDefinition): string[] {
  const problems: string[] = [];

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.id)) {
    problems.push(`id "${tool.id}" is not kebab-case`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tool.verifiedAt)) {
    problems.push(`verifiedAt "${tool.verifiedAt}" is not an ISO date`);
  }
  if (tool.action !== 'copy' && !tool.urlTemplate.startsWith('https://')) {
    problems.push('urlTemplate must be https');
  }
  if (!tool.website.startsWith('https://')) {
    problems.push('website must be https');
  }
  if (!tool.description.endsWith('.')) {
    problems.push('description should be a single sentence ending in a full stop');
  }

  const placeholders = templatePlaceholders(tool.urlTemplate);
  const known = new Set(['owner', 'repo', 'ref', 'path']);
  for (const name of placeholders) {
    if (!known.has(name)) problems.push(`unknown placeholder "{${name}}"`);
  }
  for (const field of tool.requires ?? []) {
    if (!placeholders.includes(field)) {
      problems.push(`requires "${field}" but the template never uses it`);
    }
  }
  // Copy templates become shell commands. Owner and repository names are
  // validated to a safe alphabet; branches and paths can hold anything,
  // including `;` and `$(…)`, so they never reach the clipboard.
  if (tool.action === 'copy') {
    for (const name of placeholders) {
      if (name !== 'owner' && name !== 'repo') {
        problems.push(`a copy template may only use {owner} and {repo}, not "{${name}}"`);
      }
    }
  }
  for (const name of placeholders) {
    if (name === 'owner' || name === 'repo') continue;
    if (!(tool.requires ?? []).includes(name as 'ref' | 'path')) {
      problems.push(`template uses "{${name}}" but does not declare it in requires`);
    }
  }

  return problems;
}
