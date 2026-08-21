// Verifies that every local href/src/data reference in a tree of generated
// HTML files resolves to a file on disk. Usage: node scripts/html-check.mjs [root]
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'iris');
const REFERENCE_PATTERN = /\b(?:href|src|data)\s*=\s*["']([^"']*)["']/gi;
const EXTERNAL_PATTERN = /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i;

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

if (!existsSync(root)) {
  console.error(`html-check: root not found: ${root}`);
  process.exit(1);
}

const htmlFiles = await walk(root);
const problems = [];
let referenceCount = 0;

for (const file of htmlFiles) {
  const content = await readFile(file, 'utf8');
  const relativeFile = path.relative(process.cwd(), file);
  for (const match of content.matchAll(REFERENCE_PATTERN)) {
    const reference = match[1].trim();
    if (reference === '') {
      problems.push(`${relativeFile}: empty reference`);
      continue;
    }
    if (EXTERNAL_PATTERN.test(reference)) continue;
    referenceCount += 1;
    const cleaned = reference.split(/[?#]/)[0];
    let decoded = cleaned;
    try {
      decoded = decodeURIComponent(cleaned);
    } catch {
      // A reference that does not decode is checked verbatim.
    }
    const target = path.resolve(path.dirname(file), decoded);
    if (!existsSync(target)) {
      problems.push(`${relativeFile}: missing target ${reference}`);
    }
  }
}

if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`html-check: ${problem}`);
  }
  console.error(
    `html-check: ${problems.length} broken reference(s) in ${htmlFiles.length} file(s)`,
  );
  process.exit(1);
}

console.log(
  `html-check: OK — ${htmlFiles.length} file(s), ${referenceCount} local reference(s) resolve`,
);
