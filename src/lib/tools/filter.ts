import { categoryLabel } from './categories';
import type { ResolvedTool } from './resolve';

function haystack(entry: ResolvedTool): string {
  return [
    entry.tool.name,
    entry.tool.brand,
    entry.tool.description,
    entry.tool.id,
    categoryLabel(entry.tool.category),
  ]
    .join(' ')
    .toLowerCase();
}

/**
 * Narrows the deck to the tools matching a free-text query.
 *
 * Matches on name, brand, description, id and category label. An empty or
 * whitespace-only query returns every entry unchanged.
 */
export function filterTools(
  entries: readonly ResolvedTool[],
  query: string,
): readonly ResolvedTool[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return entries;
  return entries.filter((entry) => haystack(entry).includes(needle));
}
