import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { writeAlways } from '../lib/fs.js';
import { validateContract } from '../lib/schemas.js';
import { dashboardHtml, renderContractPage, type DashboardPage } from '../templates/design.js';

async function listPageIds(pagesRoot: string): Promise<string[]> {
  try {
    const entries = await readdir(pagesRoot, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

export async function runRenderCommand(cwd: string, id?: string): Promise<void> {
  const pagesRoot = path.join(cwd, 'iris', 'pages');
  const pageIds = id ? [id] : await listPageIds(pagesRoot);

  if (pageIds.length === 0) {
    const indexPath = path.join(cwd, 'iris', 'index.html');
    await writeAlways(indexPath, dashboardHtml('iris project'));
    process.stdout.write('rendered iris/index.html\n');
    return;
  }

  const renderedPages: DashboardPage[] = [];

  for (const pageId of pageIds) {
    const dataPath = path.join(pagesRoot, pageId, 'data.json');
    if (!existsSync(dataPath)) {
      throw new IrisError(1, `Missing data.json for page '${pageId}'`);
    }

    const raw = await readFile(dataPath, 'utf8');
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const type = typeof payload.type === 'string' ? payload.type : undefined;
    if (!type) {
      throw new IrisError(1, `Page '${pageId}' is missing a contract type`);
    }

    await validateContract(type as any, payload, dataPath);

    const pageHtmlPath = path.join(pagesRoot, pageId, 'page.html');
    const html = renderContractPage(payload);
    await writeAlways(pageHtmlPath, html);

    renderedPages.push({
      id: pageId,
      type,
      title: typeof payload.title === 'string' ? payload.title : pageId,
      status: typeof payload.status === 'string' ? payload.status : 'draft',
    });
  }

  const indexPath = path.join(cwd, 'iris', 'index.html');
  await writeAlways(indexPath, dashboardHtml('iris project', renderedPages));
  process.stdout.write(`rendered ${pageIds.length} page(s)\n`);
}
