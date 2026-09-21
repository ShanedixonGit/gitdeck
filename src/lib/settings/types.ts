/** Where a tool should open when the user picks it. */
export type OpenTarget = 'new-tab' | 'current-tab' | 'background-tab';

/** Everything the user can configure. Persisted as one object. */
export interface Settings {
  readonly openTarget: OpenTarget;
  /** Show tools whose transformation could not be checked automatically. */
  readonly includeUnverified: boolean;
}
