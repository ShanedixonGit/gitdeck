import type { RepoField } from '../github/types';

/**
 * Groups used to organise the deck. Adding a category means adding it here and
 * giving it a label in `categories.ts`; no other code needs to change.
 */
export type ToolCategory =
  'ide' | 'understand' | 'visualise' | 'ai-context' | 'insights' | 'security' | 'search';

/**
 * Verification lifecycle of a tool.
 *
 * - `verified`   — the transformation was checked and worked on `verifiedAt`.
 * - `unverified` — the service is live but the automated check was inconclusive
 *                  (bot protection, rate limiting). Hidden unless the user opts in.
 * - `deprecated` — known to be going away or partially broken; never shown by default.
 */
export type ToolStatus = 'verified' | 'unverified' | 'deprecated';

/**
 * A single entry in the tool registry. This is the only thing that needs to be
 * written to add a tool to GitDeck.
 */
export interface ToolDefinition {
  /** Stable kebab-case identifier. Never reused or renamed. */
  readonly id: string;
  readonly name: string;
  /** One short sentence describing what the user gets, written in the imperative. */
  readonly description: string;
  readonly category: ToolCategory;
  /** URL template rendered against a `RepoRef`. See `template.ts` for the syntax. */
  readonly urlTemplate: string;
  /** Home page of the service, shown as the provenance link. */
  readonly website: string;
  readonly status: ToolStatus;
  /** ISO date (YYYY-MM-DD) on which `urlTemplate` was last checked. */
  readonly verifiedAt: string;
  /**
   * Repository fields the template needs beyond `owner` and `repo`. A tool that
   * requires `path` is only offered when the user is viewing a file.
   */
  readonly requires?: readonly RepoField[];
  /** Short monogram shown on the card. Defaults to the first letter of `name`. */
  readonly icon?: string;
  /** Documentation or source repository for the tool itself. */
  readonly docsUrl?: string;
  /** Caveats worth surfacing, e.g. "requires a GitHub account". */
  readonly notes?: string;
}
