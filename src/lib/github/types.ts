/**
 * A reference to a location inside a GitHub repository.
 *
 * `owner` and `repo` are always present. `ref` (branch, tag or commit) and
 * `path` (file or directory inside the repository) are only present when the
 * source URL contained them.
 */
export interface RepoRef {
  readonly owner: string;
  readonly repo: string;
  readonly ref?: string;
  readonly path?: string;
  /** `path`, when the URL shows a file rather than a directory. */
  readonly file?: string;
}

/** The fields a tool can require from a {@link RepoRef}. */
export type RepoField = keyof RepoRef;
