/**
 * The user's stack: the tools they chose, in the order they want them.
 *
 * The registry is the source and the stack is the selection. Kept as plain
 * functions over ids so the whole model is testable without a registry, a
 * repository or a DOM.
 */

import { CATEGORIES } from './categories';
import type { ToolDefinition } from './types';

/** Anything the deck can hold. Only the id matters here. */
export interface Identified {
  readonly tool: { readonly id: string };
}

/**
 * The entries the user chose, in stack order.
 *
 * Anything not in the stack is dropped, and stack ids with no matching entry
 * are ignored — a tool that cannot apply to this page simply is not there.
 */
export function pickStack<T extends Identified>(
  entries: readonly T[],
  stack: readonly string[],
): T[] {
  const byId = new Map(entries.map((entry) => [entry.tool.id, entry]));
  return stack.flatMap((id) => {
    const entry = byId.get(id);
    return entry === undefined ? [] : [entry];
  });
}

/**
 * Puts a tool into the stack just before `before`, or at the end when `before`
 * is `null` or not in the stack.
 *
 * A tool already in the stack is moved rather than duplicated, so the same call
 * serves both adding and reordering. Anchoring on a neighbour's id rather than
 * an index means a drop lands where the user saw it, whichever way it moved.
 */
export function placeInStack(
  stack: readonly string[],
  id: string,
  before: string | null = null,
): string[] {
  if (id === before) return [...stack];
  const rest = stack.filter((each) => each !== id);
  const at = before === null ? -1 : rest.indexOf(before);
  if (at === -1) return [...rest, id];
  return [...rest.slice(0, at), id, ...rest.slice(at)];
}

export function removeFromStack(stack: readonly string[], id: string): string[] {
  return stack.filter((each) => each !== id);
}

/**
 * Moves a tool one place up or down. Returns the stack unchanged at either end,
 * or when the tool is not in it.
 */
export function nudgeInStack(stack: readonly string[], id: string, delta: -1 | 1): string[] {
  const from = stack.indexOf(id);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= stack.length) return [...stack];
  const next = [...stack];
  next[from] = next[to] as string;
  next[to] = id;
  return next;
}

/** Drops ids the registry no longer knows, and any duplicates. */
export function reconcileStack(stack: readonly string[], known: readonly string[]): string[] {
  const exists = new Set(known);
  return [...new Set(stack)].filter((id) => exists.has(id));
}

/**
 * The deck offered on first run: the recommended tool from each section, in
 * section order, so every kind of job is one keypress away from the start.
 * Only verified tools qualify.
 */
export function recommendedStack(
  tools: readonly Pick<ToolDefinition, 'id' | 'category' | 'status' | 'recommended'>[],
): string[] {
  return CATEGORIES.flatMap((section) =>
    tools
      .filter(
        (tool) =>
          tool.category === section.id && tool.recommended === true && tool.status === 'verified',
      )
      .map((tool) => tool.id),
  );
}
