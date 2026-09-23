import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import config from '../../../wxt.config';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * The manifest names icon files by path. If `publicDir` is wrong, or a file is
 * renamed, the build still succeeds and the browser refuses to load the
 * extension with "Could not load icon". That failure belongs in CI, not in
 * chrome://extensions.
 */
describe('manifest icons', () => {
  const manifest = (
    typeof config.manifest === 'function'
      ? config.manifest({
          browser: 'chrome',
          manifestVersion: 3,
          mode: 'production',
          command: 'build',
        })
      : config.manifest
  ) as { icons?: Record<string, string> } | undefined;
  const icons = Object.entries(manifest?.icons ?? {});

  it('declares at least one icon', () => {
    expect(icons.length).toBeGreaterThan(0);
  });

  it('resolves publicDir to the directory the icons actually live in', () => {
    expect(config.publicDir).toBe('src/public');
  });

  it.each(icons)('ships the %s px icon', (_size, file) => {
    expect(existsSync(resolve(ROOT, config.publicDir ?? 'public', file))).toBe(true);
  });
});
