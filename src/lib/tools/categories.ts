import type { ToolCategory } from './types';

/** Display labels and deck ordering for each category. */
export const CATEGORIES: ReadonlyArray<{ id: ToolCategory; label: string }> = [
  { id: 'ide', label: 'Open in an editor' },
  { id: 'understand', label: 'Understand the code' },
  { id: 'visualise', label: 'Visualise' },
  { id: 'ai-context', label: 'AI context' },
  { id: 'insights', label: 'Project insights' },
  { id: 'security', label: 'Supply chain' },
  { id: 'search', label: 'Search' },
];

const LABELS = new Map(CATEGORIES.map((category) => [category.id, category.label]));

export function categoryLabel(id: ToolCategory): string {
  return LABELS.get(id) ?? id;
}
