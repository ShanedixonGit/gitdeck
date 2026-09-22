import type { ToolCategory } from './types';

export interface Category {
  readonly id: ToolCategory;
  readonly label: string;
  /** Name of a CSS custom property in `styles/theme.css`, defined for light and dark. */
  readonly tint: string;
  /** Stroke paths on a 24 × 24 grid, drawn by `CategoryIcon.svelte`. */
  readonly icon: readonly string[];
}

/**
 * Display labels, ordering, colour and icon for each category.
 *
 * Every card shows its section's icon in its section's colour, so the shape of
 * the deck reads at a glance even though the popup has no headings. The icon
 * carries the meaning and the colour reinforces it: nothing is signalled by
 * colour alone, so the deck still reads correctly in greyscale.
 *
 * Icons are inline path data rather than image files or an icon font, so they
 * cost no request and inherit the tint through `currentColor`.
 */
export const CATEGORIES: readonly Category[] = [
  {
    id: 'ide',
    label: 'Open in an editor',
    tint: '--tint-ide',
    icon: ['m16 18 6-6-6-6', 'm8 6-6 6 6 6'],
  },
  {
    id: 'get',
    label: 'Get the code',
    tint: '--tint-get',
    icon: ['M12 3v12', 'm7 10 5 5 5-5', 'M5 21h14'],
  },
  {
    id: 'understand',
    label: 'Understand the code',
    tint: '--tint-understand',
    icon: [
      'M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z',
      'M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z',
    ],
  },
  {
    id: 'visualise',
    label: 'Visualise',
    tint: '--tint-visualise',
    icon: ['M3 3h6v6H3z', 'M15 3h6v6h-6z', 'M9 15h6v6H9z', 'M6 9v3h12V9', 'M12 12v3'],
  },
  {
    id: 'ai-context',
    label: 'AI context',
    tint: '--tint-ai-context',
    icon: ['M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9z', 'M19 16v5', 'M16.5 18.5h5'],
  },
  {
    id: 'insights',
    label: 'Project insights',
    tint: '--tint-insights',
    icon: ['M3 3v18h18', 'M8 17v-5', 'M13 17V7', 'M18 17v-9'],
  },
  {
    id: 'security',
    label: 'Security & dependencies',
    tint: '--tint-security',
    icon: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  },
  {
    id: 'search',
    label: 'Search',
    tint: '--tint-search',
    icon: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'm21 21-5-5'],
  },
];

const BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));
const FALLBACK = CATEGORIES[0] as Category;

export function category(id: ToolCategory): Category {
  return BY_ID.get(id) ?? FALLBACK;
}

export function categoryLabel(id: ToolCategory): string {
  return BY_ID.get(id)?.label ?? id;
}

export function categoryTint(id: ToolCategory): string {
  return category(id).tint;
}
