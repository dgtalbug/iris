import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Locates the installed Iris package root by walking up from this module until a
 * directory carries both `package.json` and the packaged `templates/` assets, so
 * the same lookup works from `src/` during development and from `dist/` when
 * installed.
 */
export function packageRoot(): string {
  let current = path.dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (
      existsSync(path.join(current, 'package.json')) &&
      existsSync(path.join(current, 'templates'))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current)
      throw new Error('Could not locate the installed Iris package templates');
    current = parent;
  }
}

export function packageVersion(): string {
  const raw = readFileSync(path.join(packageRoot(), 'package.json'), 'utf8');
  const version = (JSON.parse(raw) as { version?: unknown }).version;
  if (typeof version !== 'string') throw new Error('Installed Iris package has no version');
  return version;
}
