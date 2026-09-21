import { CATEGORIES, FAVOURITES_SECTION, categoryLabel, categoryTint } from './categories';
import type { ResolvedTool } from './resolve';

/** A deck section: a heading, its colour, and the tools under it. */
export interface ToolGroup {
  /** Category id, or `favourites`. */
  readonly id: string;
  readonly label: string;
  /** Name of the CSS custom property holding this section's colour. */
  readonly tint: string;
  readonly entries: readonly ResolvedTool[];
}

/**
 * Splits resolved tools into deck sections.
 *
 * Favourites come first, pulled out of their categories so that starring a tool
 * both raises it up the deck and gives it a low number shortcut. Categories
 * follow in the order declared by `CATEGORIES`. Empty sections are omitted.
 */
export function groupByCategory(
  entries: readonly ResolvedTool[],
  favourites: readonly string[] = [],
): readonly ToolGroup[] {
  const starred = new Set(favourites);
  const pinned = entries.filter((entry) => starred.has(entry.tool.id));
  const rest = entries.filter((entry) => !starred.has(entry.tool.id));

  const sections: ToolGroup[] = [];
  if (pinned.length > 0) {
    sections.push({ ...FAVOURITES_SECTION, entries: pinned });
  }
  for (const category of CATEGORIES) {
    const inCategory = rest.filter((entry) => entry.tool.category === category.id);
    if (inCategory.length === 0) continue;
    sections.push({
      id: category.id,
      label: categoryLabel(category.id),
      tint: categoryTint(category.id),
      entries: inCategory,
    });
  }
  return sections;
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
