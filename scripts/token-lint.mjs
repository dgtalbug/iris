import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateTokenContract } from './token-contract.mjs';

const colorLiteralPattern = /((?<!&)#[0-9a-fA-F]{3,8})|\b(?:rgb|hsl)a?\(/g;

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
const designPath = path.normalize('src/templates/tokens.ts');
const designSource = await readFile(designPath, 'utf8');
const tokenTemplate = designSource.match(/export const TOKENS_CSS = `([\s\S]*?)`;/);
if (!tokenTemplate) {
  console.error('token-lint: TOKENS_CSS template not found');
  process.exit(1);
}

const tokenCss = tokenTemplate[1];
const sourceWithoutTokens = designSource.replace(tokenTemplate[0], 'export const TOKENS_CSS = ``;');
for (const error of validateTokenContract(tokenCss, sourceWithoutTokens)) {
  failed = true;
  console.error(`token-lint: ${error}`);
}

const generatedTokenPath = path.normalize('iris/design/tokens.css');
const generatedTokens = await readFile(generatedTokenPath, 'utf8');
if (generatedTokens !== tokenCss) {
  failed = true;
  console.error('token-lint: generated iris/design/tokens.css is out of sync');
}

for (const file of await walk('src')) {
  const normalized = path.normalize(file);
  if (!/\.(ts|js|css|html)$/.test(file)) {
    continue;
  }

  const content = normalized === designPath ? sourceWithoutTokens : await readFile(file, 'utf8');
  const matches = content.match(colorLiteralPattern);
  if (matches) {
    failed = true;
    console.error(`token-lint: disallowed literal in ${file}: ${matches[0]}`);
  }
}

if (failed) {
  process.exit(1);
}
