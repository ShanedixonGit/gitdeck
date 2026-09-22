import type { ToolCategory } from './types';

/**
 * Display labels, ordering and section colour for each category.
 *
 * `tint` names a CSS custom property defined in `styles/theme.css`, in both
 * light and dark. Colour carries the section identity on the card monogram and
 * nothing else: it is never the only thing distinguishing two states, so the
 * deck still reads correctly in greyscale.
 */
export const CATEGORIES: ReadonlyArray<{ id: ToolCategory; label: string; tint: string }> = [
  { id: 'ide', label: 'Open in an editor', tint: '--tint-ide' },
  { id: 'understand', label: 'Understand the code', tint: '--tint-understand' },
  { id: 'visualise', label: 'Visualise', tint: '--tint-visualise' },
  { id: 'ai-context', label: 'AI context', tint: '--tint-ai-context' },
  { id: 'insights', label: 'Project insights', tint: '--tint-insights' },
  { id: 'security', label: 'Supply chain', tint: '--tint-security' },
  { id: 'search', label: 'Search', tint: '--tint-search' },
];

const LABELS = new Map(CATEGORIES.map((category) => [category.id, category.label]));
const TINTS = new Map(CATEGORIES.map((category) => [category.id, category.tint]));

export function categoryLabel(id: ToolCategory): string {
  return LABELS.get(id) ?? id;
}

export function categoryTint(id: ToolCategory): string {
  return TINTS.get(id) ?? '--tint-ide';
}
