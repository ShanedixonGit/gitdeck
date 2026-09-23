import { describe, expect, it } from 'vitest';
import { renderTemplate, templatePlaceholders, TemplateError } from './template';

describe('renderTemplate', () => {
  it('substitutes placeholders', () => {
    expect(renderTemplate('https://x.dev/{owner}/{repo}', { owner: 'a', repo: 'b' })).toBe(
      'https://x.dev/a/b',
    );
  });

  it('leaves literal text untouched', () => {
    expect(
      renderTemplate('https://x.dev/project/{owner}%2F{repo}', { owner: 'a', repo: 'b' }),
    ).toBe('https://x.dev/project/a%2Fb');
  });

  it('percent-encodes values by default', () => {
    expect(renderTemplate('https://x.dev/{repo}', { repo: 'a b/c' })).toBe(
      'https://x.dev/a%20b%2Fc',
    );
  });

  it('keeps separators with the path modifier', () => {
    expect(renderTemplate('https://x.dev/{path|path}', { path: 'src/a b.ts' })).toBe(
      'https://x.dev/src/a%20b.ts',
    );
  });

  it('has no verbatim modifier, so a value can never add its own ? # or ..', () => {
    expect(() => renderTemplate('https://x.dev/{ref|raw}', { ref: 'x?y' })).toThrow(
      'Unknown modifier "raw"',
    );
  });

  it('renders the same placeholder more than once', () => {
    expect(renderTemplate('{owner}/{owner}', { owner: 'a' })).toBe('a/a');
  });

  it('throws when a value is missing', () => {
    expect(() => renderTemplate('https://x.dev/{owner}', {})).toThrow(TemplateError);
  });

  it('throws when a value is empty', () => {
    expect(() => renderTemplate('https://x.dev/{owner}', { owner: '' })).toThrow(TemplateError);
  });

  it('throws on an unknown modifier', () => {
    expect(() => renderTemplate('https://x.dev/{owner|shout}', { owner: 'a' })).toThrow(
      /Unknown modifier/,
    );
  });

  it('ignores text that is not a placeholder', () => {
    expect(renderTemplate('https://x.dev/{Owner}/{ }/{}', {})).toBe('https://x.dev/{Owner}/{ }/{}');
  });
});

describe('templatePlaceholders', () => {
  it('lists unique placeholder names in order', () => {
    expect(templatePlaceholders('https://x.dev/{owner}/{repo}/{owner}/{path|path}')).toEqual([
      'owner',
      'repo',
      'path',
    ]);
  });
});
