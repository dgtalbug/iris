import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { writeAlways } from '../lib/fs.js';
import { loadOpenSpecSnapshot, writeOpenSpecSnapshot } from '../lib/openspec-workspace.js';
import { validateContract } from '../lib/schemas.js';
import { loadProjectState, saveProjectState, statePath } from '../lib/project-state.js';
import {
  dashboardHtml,
  PROJECT_DOC_NAMES,
  renderContractPage,
  type DashboardPage,
} from '../templates/design.js';

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

export async function runRenderCommand(
  cwd: string,
  id?: string,
  options: { refreshOpenSpec?: boolean } = {},
): Promise<void> {
  if (options.refreshOpenSpec) await writeOpenSpecSnapshot(cwd);
  const pagesRoot = path.join(cwd, 'iris', 'pages');
  const allPageIds = await listPageIds(pagesRoot);
  const pageIds = id ? [id] : allPageIds;

  if (pageIds.length === 0) {
    await refreshDashboard(cwd);
    process.stdout.write('rendered iris/index.html\n');
    return;
  }

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
  }

  if (existsSync(statePath(cwd))) {
    const state = await loadProjectState(cwd);
    for (const pageId of pageIds) {
      const payload = JSON.parse(
        await readFile(path.join(pagesRoot, pageId, 'data.json'), 'utf8'),
      ) as Record<string, unknown>;
      const prior = state.page_index[pageId];
      state.page_index[pageId] = {
        id: pageId,
        type: typeof payload.type === 'string' ? payload.type : 'page',
        title: typeof payload.title === 'string' ? payload.title : pageId,
        status: prior?.status ?? 'active',
      };
    }
    await saveProjectState(cwd, state);
  }

  await refreshDashboard(cwd);
  process.stdout.write(`rendered ${pageIds.length} page(s)\n`);
}

export async function refreshDashboard(cwd: string): Promise<void> {
  const irisRoot = path.join(cwd, 'iris');
  const pagesRoot = path.join(irisRoot, 'pages');
  const allPageIds = await listPageIds(pagesRoot);
  const renderedPages: DashboardPage[] = [];
  const state = existsSync(statePath(cwd)) ? await loadProjectState(cwd) : undefined;
  for (const pageId of allPageIds) {
    const dataPath = path.join(pagesRoot, pageId, 'data.json');
    if (!existsSync(dataPath)) continue;
    const payload = JSON.parse(await readFile(dataPath, 'utf8')) as Record<string, unknown>;
    renderedPages.push({
      id: pageId,
      type: typeof payload.type === 'string' ? payload.type : 'page',
      title: typeof payload.title === 'string' ? payload.title : pageId,
      status: typeof payload.status === 'string' ? payload.status : 'draft',
      href: `./pages/${pageId}/page.html`,
    });
  }

  for (const [pageId, entry] of Object.entries(state?.page_index ?? {})) {
    if (entry.status !== 'archived') continue;
    if (!existsSync(path.join(irisRoot, 'archive', pageId, 'page.html'))) continue;
    renderedPages.push({
      id: pageId,
      type: entry.type,
      title: entry.title,
      status: 'archived',
      href: `./archive/${pageId}/page.html`,
    });
  }

  const projectDocs = PROJECT_DOC_NAMES.filter((name) =>
    existsSync(path.join(irisRoot, 'project', `${name}.html`)),
  );

  const indexPath = path.join(irisRoot, 'index.html');
  const openSpec = await loadOpenSpecSnapshot(cwd);
  await writeAlways(indexPath, dashboardHtml(path.basename(cwd), renderedPages, projectDocs, openSpec));
}
