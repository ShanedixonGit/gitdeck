/** What a keypress should do to the deck. */
export type KeyAction =
  | { readonly type: 'none' }
  | { readonly type: 'focus-filter' }
  | { readonly type: 'clear-filter' }
  | { readonly type: 'close-settings' }
  | { readonly type: 'move'; readonly delta: number }
  | { readonly type: 'open-selected' }
  | { readonly type: 'open-index'; readonly index: number };

export interface KeyContext {
  readonly key: string;
  /** Any of ctrl, meta or alt is held. */
  readonly modified: boolean;
  /** The filter box currently has focus, so the user is typing. */
  readonly typing: boolean;
  readonly filterEmpty: boolean;
  readonly hasResults: boolean;
  /** The settings panel is covering the deck. */
  readonly settingsOpen?: boolean;
}

const NONE: KeyAction = { type: 'none' };

/**
 * Maps a keypress to a deck action.
 *
 * Kept separate from the component so the whole keyboard model is testable
 * without a DOM. Browser and OS shortcuts are never intercepted: any keypress
 * with a modifier is ignored, and while the user is typing in the filter, the
 * number shortcuts yield to plain text entry. While settings are open the deck
 * shortcuts are inert and `Escape` closes the panel.
 */
export function keyAction(context: KeyContext): KeyAction {
  if (context.modified) return NONE;

  if (context.settingsOpen === true) {
    return context.key === 'Escape' ? { type: 'close-settings' } : NONE;
  }

  if (context.key === '/' && !context.typing) return { type: 'focus-filter' };
  if (context.key === 'Escape') return context.filterEmpty ? NONE : { type: 'clear-filter' };

  if (context.key === 'ArrowDown') return context.hasResults ? { type: 'move', delta: 1 } : NONE;
  if (context.key === 'ArrowUp') return context.hasResults ? { type: 'move', delta: -1 } : NONE;
  if (context.key === 'Enter') return context.hasResults ? { type: 'open-selected' } : NONE;

  if (!context.typing && /^[1-9]$/.test(context.key)) {
    return { type: 'open-index', index: Number(context.key) - 1 };
  }

  return NONE;
}
