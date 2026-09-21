/** Where a tool should open when the user picks it. */
export type OpenTarget = 'new-tab' | 'current-tab' | 'background-tab';

/** Everything the user can configure. Persisted as one object. */
export interface Settings {
  readonly openTarget: OpenTarget;
  /** Show tools whose transformation could not be checked automatically. */
  readonly includeUnverified: boolean;
  /** Tool ids pinned to the top of the deck. */
  readonly favourites: readonly string[];
  /** Tool ids the user has switched off entirely. */
  readonly hidden: readonly string[];
  /** Tool ids in the user's preferred order. Anything missing sorts last. */
  readonly order: readonly string[];
  /** The welcome panel has been seen and dismissed. */
  readonly onboarded: boolean;
}
