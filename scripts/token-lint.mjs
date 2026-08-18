import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'node:fs/promises';

const hexOrRgbPattern = /(#[0-9a-fA-F]{3,8})|\brgba?\(/g;
const allowed = new Set(['src/templates/design.ts']);

let failed = false;

for await (const file of glob('src/**/*.{ts,js,css,html}')) {
  const normalized = path.normalize(file);
  if (allowed.has(normalized)) {
    continue;
  }
  const content = await readFile(file, 'utf8');
  const matches = content.match(hexOrRgbPattern);
  if (matches) {
    failed = true;
    console.error(`token-lint: disallowed literal in ${file}: ${matches[0]}`);
  }
}

if (failed) {
  process.exit(1);
}
