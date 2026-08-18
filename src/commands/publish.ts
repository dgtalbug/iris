import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { writeAlways } from '../lib/fs.js';
import { runRenderCommand } from './render.js';

async function listPageIds(pagesRoot: string): Promise<string[]> {
  try {
    const entries = await readdir(pagesRoot, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

function replaceStylesheet(html: string, pattern: RegExp, css: string): string {
  return html.replace(pattern, `<style>${css}</style>`);
}

export async function runPublishCommand(cwd: string, id?: string, outputPath?: string): Promise<void> {
  const pagesRoot = path.join(cwd, 'iris', 'pages');
  const pageIds = id ? [id] : await listPageIds(pagesRoot);

  if (pageIds.length === 0) {
    throw new IrisError(1, 'No pages found to publish');
  }

  const pageId = pageIds[0];
  const pageHtmlPath = path.join(pagesRoot, pageId, 'page.html');
  if (!existsSync(pageHtmlPath)) {
    await runRenderCommand(cwd, pageId);
  }

  const pageHtml = await readFile(pageHtmlPath, 'utf8');
  const tokensCss = await readFile(path.join(cwd, 'iris', 'design', 'tokens.css'), 'utf8');
  const baseCss = await readFile(path.join(cwd, 'iris', 'design', 'components', 'base.css'), 'utf8');

  const standaloneHtml = replaceStylesheet(
    replaceStylesheet(
      pageHtml
        .replace(/<script type="module" src="[^"]*base\.js"><\/script>/g, '')
        .replace(/<link rel="stylesheet" href="\.\.\/\.\.\/design\/tokens\.css" \/>/g, ''),
      /<link rel="stylesheet" href="\.\.\/\.\.\/design\/components\/base\.css" \/>/g,
      `<style>${baseCss}</style>`,
    ),
    /<link rel="stylesheet" href="\.\.\/\.\.\/design\/tokens\.css" \/>/g,
    `<style>${tokensCss}</style>`,
  );

  const destination = outputPath
    ? path.resolve(cwd, outputPath)
    : path.join(cwd, 'iris', 'archive', `${pageId}-publish.html`);

  await writeAlways(destination, standaloneHtml);
  process.stdout.write(`published ${path.relative(cwd, destination)}\n`);
}
