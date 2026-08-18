import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const hexOrRgbPattern = /(#[0-9a-fA-F]{3,8})|\brgba?\(/g;
const allowed = new Set([path.normalize('src/templates/design.ts')]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

let failed = false;

for (const file of await walk('src')) {
  const normalized = path.normalize(file);
  if (allowed.has(normalized)) {
    continue;
  }

  if (!/\.(ts|js|css|html)$/.test(file)) {
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
