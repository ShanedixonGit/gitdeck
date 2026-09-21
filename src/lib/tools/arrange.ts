/**
 * Applies the user's deck preferences: what to hide, and in what order.
 *
 * Kept as plain functions over ids so the whole model is testable without a
 * registry, a repository or a DOM.
 */

/** Anything the deck can hold. Only the id matters here. */
export interface Identified {
  readonly tool: { readonly id: string };
}

/**
 * Sorts entries by the user's order, leaving anything the order does not
 * mention in its original position at the end.
 *
 * New registry entries therefore appear at the bottom of their section rather
 * than silently jumping to the top of a deck the user has arranged.
 */
export function applyOrder<T extends Identified>(
  entries: readonly T[],
  order: readonly string[],
): T[] {
  const rank = new Map(order.map((id, index) => [id, index]));
  return entries
    .map((entry, index) => ({ entry, index, rank: rank.get(entry.tool.id) ?? Infinity }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((row) => row.entry);
}

/** Drops the tools the user has switched off. */
export function applyHidden<T extends Identified>(
  entries: readonly T[],
  hidden: readonly string[],
): T[] {
  const off = new Set(hidden);
  return entries.filter((entry) => !off.has(entry.tool.id));
}

/**
 * Moves one tool up or down past its nearest neighbour in the same section.
 *
 * The order is a single flat list, but the deck is grouped, so stepping over a
 * tool from another section would move the card nowhere the user can see.
 * `sameSection` decides which neighbours count.
 *
 * Returns the order unchanged when the tool is already at the edge of its
 * section, or is not in the order at all.
 */
export function moveInOrder(
  order: readonly string[],
  id: string,
  delta: -1 | 1,
  sameSection: (a: string, b: string) => boolean,
): string[] {
  const from = order.indexOf(id);
  if (from === -1) return [...order];

  for (let at = from + delta; at >= 0 && at < order.length; at += delta) {
    const neighbour = order[at];
    if (neighbour === undefined || !sameSection(id, neighbour)) continue;
    const next = [...order];
    next[from] = neighbour;
    next[at] = id;
    return next;
  }
  return [...order];
}

/**
 * The stored order, brought up to date with the registry.
 *
 * Ids that no longer exist are dropped, and tools added since the user last
 * arranged their deck are appended in registry order. The result always names
 * every known tool exactly once, which is what lets `moveInOrder` work on a
 * simple index.
 */
export function reconcileOrder(order: readonly string[], known: readonly string[]): string[] {
  const exists = new Set(known);
  const kept = order.filter((id, index) => exists.has(id) && order.indexOf(id) === index);
  const seen = new Set(kept);
  return [...kept, ...known.filter((id) => !seen.has(id))];
}
