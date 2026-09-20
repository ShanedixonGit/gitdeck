/** Raised when a URL template cannot be rendered with the supplied values. */
export class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

/** Values available to a template, keyed by placeholder name. */
export type TemplateValues = Readonly<Record<string, string | undefined>>;

const PLACEHOLDER = /\{([a-z][a-zA-Z0-9]*)(?:\|([a-z]+))?\}/g;

const MODIFIERS = {
  enc: (value: string) => encodeURIComponent(value),
  raw: (value: string) => value,
  path: (value: string) =>
    value
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/'),
} satisfies Record<string, (value: string) => string>;

type ModifierName = keyof typeof MODIFIERS;

function isModifier(name: string): name is ModifierName {
  return Object.prototype.hasOwnProperty.call(MODIFIERS, name);
}

/**
 * Renders a URL template.
 *
 * Placeholders take the form `{name}` or `{name|modifier}`. Values are
 * percent-encoded by default (`enc`); `raw` inserts the value verbatim and
 * `path` encodes each `/`-separated segment while keeping the separators.
 *
 * Throws {@link TemplateError} when a placeholder has no value or names an
 * unknown modifier, so that a bad registry entry fails loudly in tests rather
 * than producing a broken URL at runtime.
 */
export function renderTemplate(template: string, values: TemplateValues): string {
  return template.replace(PLACEHOLDER, (_match, name: string, modifier?: string) => {
    const value = values[name];
    if (value === undefined || value === '') {
      throw new TemplateError(`Missing value for placeholder "${name}"`);
    }
    const modifierName = modifier ?? 'enc';
    if (!isModifier(modifierName)) {
      throw new TemplateError(`Unknown modifier "${modifierName}" on placeholder "${name}"`);
    }
    return MODIFIERS[modifierName](value);
  });
}

/** The placeholder names used by a template, in order of first appearance. */
export function templatePlaceholders(template: string): string[] {
  const names: string[] = [];
  for (const match of template.matchAll(PLACEHOLDER)) {
    const name = match[1];
    if (name !== undefined && !names.includes(name)) names.push(name);
  }
  return names;
}
