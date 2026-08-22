import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateTokenContract } from './token-contract.mjs';

// `color-mix()` composes declared tokens rather than naming a color, so it stays legal.
const colorLiteralPattern =
  /((?<!&)#[0-9a-fA-F]{3,8})|\b(?:rgb|hsl)a?\(|\b(?:oklch|oklab|lab|lch|hwb|color)\(/g;

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
const sourceFiles = (await walk('src')).filter((file) => /\.(ts|js|css|html)$/.test(file));
const sourceContents = await Promise.all(
  sourceFiles.map(async (file) =>
    path.normalize(file) === designPath ? sourceWithoutTokens : readFile(file, 'utf8'),
  ),
);
// Every var() in src is checked, not just the ones in the token file, so a
// component that reaches for a token nobody declares fails here.
for (const error of validateTokenContract(tokenCss, sourceContents.join('\n'))) {
  failed = true;
  console.error(`token-lint: ${error}`);
}

const generatedTokenPath = path.normalize('iris/design/tokens.css');
const generatedTokens = await readFile(generatedTokenPath, 'utf8');
if (generatedTokens !== tokenCss) {
  failed = true;
  console.error('token-lint: generated iris/design/tokens.css is out of sync');
}

for (const [index, file] of sourceFiles.entries()) {
  const content = sourceContents[index];
  const matches = content.match(colorLiteralPattern);
  if (matches) {
    failed = true;
    console.error(`token-lint: disallowed literal in ${file}: ${matches[0]}`);
  }
}

if (failed) {
  process.exit(1);
}
