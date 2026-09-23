import type { RepoField } from '../github/types';

/**
 * Groups used to organise the deck. Adding a category means adding it here and
 * giving it a label in `categories.ts`; no other code needs to change.
 */
export type ToolCategory =
  'ide' | 'get' | 'understand' | 'visualise' | 'ai-context' | 'insights' | 'security' | 'search';

/**
 * What picking a tool does.
 *
 * - `open` — navigate to the rendered template, which must be an HTTPS URL.
 * - `copy` — put the rendered template on the clipboard, for things that are
 *            typed rather than visited, such as a clone command.
 */
export type ToolAction = 'open' | 'copy';

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
 * written to add a tool to Repohopper.
 */
export interface ToolDefinition {
  /** Stable kebab-case identifier. Never reused or renamed. */
  readonly id: string;
  /**
   * What the tool does for the user, as a short title led by a verb: "Browse in
   * VS Code", not "GitHub.dev". The card leads with this.
   */
  readonly name: string;
  /** The service's own name, shown as provenance under the title. */
  readonly brand: string;
  /** One short sentence describing what the user gets, written in the imperative. */
  readonly description: string;
  readonly category: ToolCategory;
  /**
   * Template rendered against a `RepoRef`. See `template.ts` for the syntax. For
   * an `open` tool it is the destination URL; for a `copy` tool, the text copied.
   */
  readonly urlTemplate: string;
  /** Defaults to `open`. */
  readonly action?: ToolAction;
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
  /**
   * The pick for its section in the recommended deck offered on first run.
   * Exactly one tool per category carries it; the registry test enforces that.
   */
  readonly recommended?: true;
  /** Documentation or source repository for the tool itself. */
  readonly docsUrl?: string;
  /** Caveats worth surfacing, e.g. "requires a GitHub account". */
  readonly notes?: string;
}
