import { CATEGORIES, categoryLabel } from './categories';
import type { ResolvedTool } from './resolve';
import type { ToolCategory } from './types';

/** A deck section: one category and the tools in it. */
export interface ToolGroup {
  readonly category: ToolCategory;
  readonly label: string;
  readonly entries: readonly ResolvedTool[];
}

/**
 * Splits resolved tools into deck sections, in the order declared by
 * `CATEGORIES`. Empty categories are omitted.
 */
export function groupByCategory(entries: readonly ResolvedTool[]): readonly ToolGroup[] {
  return CATEGORIES.map((category) => ({
    category: category.id,
    label: categoryLabel(category.id),
    entries: entries.filter((entry) => entry.tool.category === category.id),
  })).filter((group) => group.entries.length > 0);
}

/**
 * The tools in the order they appear on screen.
 *
 * Keyboard selection and number shortcuts index into this, so that "3" always
 * means the third card the user can see rather than the third registry entry.
 */
export function flattenGroups(groups: readonly ToolGroup[]): readonly ResolvedTool[] {
  return groups.flatMap((group) => group.entries);
}
