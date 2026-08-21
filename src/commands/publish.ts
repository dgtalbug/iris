import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { writeAlways } from '../lib/fs.js';
import { runRenderCommand } from './render.js';

const PAGE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TOKENS_STYLESHEET_PATTERN =
  /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["'][^"']*design\/tokens\.css["'])[^>]*>/gi;
const BASE_STYLESHEET_PATTERN =
  /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["'][^"']*design\/components\/base\.css["'])[^>]*>/gi;
const BASE_SCRIPT_PATTERN =
  /<script\b(?=[^>]*\bsrc=["'][^"']*design\/components\/base\.js["'])[^>]*><\/script>/gi;
// Navigation chrome points into the iris tree; a standalone artifact leaves
// that tree, so marked elements are removed rather than shipped broken.
const NAV_CHROME_PATTERN = /<(a|button|nav)\b[^>]*\bdata-iris-nav\b[^>]*>.*?<\/\1>/gis;
const RESOURCE_REFERENCE_PATTERN =
  /<(?:link|script|img|source|video|audio|iframe|object)\b[^>]*\b(?:href|src|data)=["'](?!data:|#)[^"']+["'][^>]*>/i;

async function listPageIds(pagesRoot: string): Promise<string[]> {
  try {
    const entries = await readdir(pagesRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

async function selectPageId(cwd: string, id?: string): Promise<string> {
  const pagesRoot = path.join(cwd, 'iris', 'pages');

  if (id) {
    if (!PAGE_ID_PATTERN.test(id)) {
      throw new IrisError(1, `Invalid page id '${id}'; expected lowercase kebab-case`);
    }

    if (!existsSync(path.join(pagesRoot, id, 'data.json'))) {
      throw new IrisError(1, `Page '${id}' does not exist (missing iris/pages/${id}/data.json)`);
    }

    return id;
  }

  const pageIds = await listPageIds(pagesRoot);
  if (pageIds.length === 0) {
    throw new IrisError(1, 'No pages found to publish');
  }

  return pageIds[0];
}

function inlineLocalAssets(
  pageId: string,
  html: string,
  tokensCss: string,
  baseCss: string,
): string {
  const withoutLocalAssets = html
    .replace(TOKENS_STYLESHEET_PATTERN, '')
    .replace(BASE_STYLESHEET_PATTERN, '')
    .replace(BASE_SCRIPT_PATTERN, '')
    .replace(NAV_CHROME_PATTERN, '');
  const style = `<style data-iris-standalone>\n${tokensCss}\n${baseCss}\n</style>`;

  if (!withoutLocalAssets.includes('</head>')) {
    throw new IrisError(1, `Rendered page '${pageId}' is invalid: missing </head>`);
  }

  const standaloneHtml = withoutLocalAssets.replace('</head>', `  ${style}\n </head>`);
  const resourceReference = standaloneHtml.match(RESOURCE_REFERENCE_PATTERN)?.[0];
  const cssDependency = /@import\s|url\s*\(/i.test(`${tokensCss}\n${baseCss}`);

  if (resourceReference || cssDependency) {
    throw new IrisError(
      1,
      `Page '${pageId}' cannot be published offline: unresolved asset dependency${resourceReference ? ` ${resourceReference}` : ''}`,
    );
  }

  return standaloneHtml;
}

export async function createStandaloneArtifact(
  cwd: string,
  id: string,
  destination: string,
): Promise<void> {
  if (!PAGE_ID_PATTERN.test(id)) {
    throw new IrisError(1, `Invalid page id '${id}'; expected lowercase kebab-case`);
  }

  if (!existsSync(path.join(cwd, 'iris', 'pages', id, 'data.json'))) {
    throw new IrisError(1, `Page '${id}' does not exist (missing iris/pages/${id}/data.json)`);
  }

  try {
    await runRenderCommand(cwd, id);
  } catch (error) {
    if (error instanceof IrisError) throw error;
    throw new IrisError(1, `Failed to render page '${id}': ${(error as Error).message}`);
  }

  const irisRoot = path.join(cwd, 'iris');
  const pageHtmlPath = path.join(irisRoot, 'pages', id, 'page.html');

  try {
    const [pageHtml, tokensCss, baseCss] = await Promise.all([
      readFile(pageHtmlPath, 'utf8'),
      readFile(path.join(irisRoot, 'design', 'tokens.css'), 'utf8'),
      readFile(path.join(irisRoot, 'design', 'components', 'base.css'), 'utf8'),
    ]);
    await writeAlways(destination, inlineLocalAssets(id, pageHtml, tokensCss, baseCss));
  } catch (error) {
    if (error instanceof IrisError) throw error;
    throw new IrisError(1, `Failed to build standalone page '${id}': ${(error as Error).message}`);
  }
}

export async function runPublishCommand(
  cwd: string,
  id?: string,
  outputPath?: string,
): Promise<void> {
  const pageId = await selectPageId(cwd, id);
  const destination = outputPath
    ? path.resolve(cwd, outputPath)
    : path.join(cwd, 'iris', 'archive', `${pageId}-publish.html`);

  await createStandaloneArtifact(cwd, pageId, destination);
  process.stdout.write(`published ${path.relative(cwd, destination)}\n`);
}
