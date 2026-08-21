import { existsSync } from 'node:fs';
import { readdir, readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import {
  hashContent,
  loadProjectState,
  saveProjectState,
  type PageRegistryEntry,
} from '../lib/project-state.js';
import { validateContract } from '../lib/schemas.js';
import { writeAlways } from '../lib/fs.js';
import {
  BASE_COMPONENTS_CSS,
  BASE_COMPONENTS_JS,
  PROJECT_DOC_NAMES,
  projectPlaceholderHtml,
  TOKENS_CSS,
} from '../templates/design.js';
import { refreshDashboard, runRenderCommand } from './render.js';

const MANAGED_TASK_LABEL = 'iris: open dashboard';

function titleCase(value: string): string {
  return value
    .replace(/\.md$/i, '')
    .split(/[\\/_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function markdownId(relativePath: string): string {
  return `doc-${relativePath
    .toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`;
}

async function listPageIds(cwd: string): Promise<string[]> {
  const pagesRoot = path.join(cwd, 'iris', 'pages');
  try {
    return (await readdir(pagesRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

async function listMarkdownFiles(cwd: string): Promise<string[]> {
  const results: string[] = [];
  const readMarkdownDir = async (relativeDir: string): Promise<void> => {
    const absoluteDir = path.join(cwd, relativeDir);
    if (!existsSync(absoluteDir)) return;
    for (const entry of await readdir(absoluteDir, { withFileTypes: true })) {
      const relativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        await readMarkdownDir(relativePath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
        results.push(relativePath);
      }
    }
  };

  if (existsSync(path.join(cwd, 'README.md'))) results.push('README.md');
  await readMarkdownDir('docs');
  return results.sort();
}

async function pageRegistryEntry(cwd: string, id: string): Promise<PageRegistryEntry> {
  const dataPath = path.join(cwd, 'iris', 'pages', id, 'data.json');
  const raw = await readFile(dataPath, 'utf8');
  const payload = JSON.parse(raw) as Record<string, unknown>;
  return {
    id,
    type: typeof payload.type === 'string' ? payload.type : 'page',
    title: typeof payload.title === 'string' ? payload.title : id,
    status: 'active',
    data_hash: hashContent(raw),
  };
}

const LEGACY_PENDING_STUB = '<!doctype html><title>pending</title>\n';

async function refreshProjectPlaceholders(cwd: string): Promise<void> {
  for (const name of PROJECT_DOC_NAMES) {
    const pagePath = path.join(cwd, 'iris', 'project', `${name}.html`);
    if (existsSync(pagePath)) {
      const current = await readFile(pagePath, 'utf8');
      // Only iris-managed placeholders are refreshed; user-authored or
      // milestone-rendered project pages are never clobbered.
      if (current !== LEGACY_PENDING_STUB && !current.includes('data-iris-managed')) continue;
    }
    await writeAlways(pagePath, projectPlaceholderHtml(name));
  }
}

export async function updateManagedSurfaces(cwd: string): Promise<void> {
  await writeAlways(path.join(cwd, 'iris', 'design', 'tokens.css'), TOKENS_CSS);
  await writeAlways(
    path.join(cwd, 'iris', 'design', 'components', 'base.css'),
    BASE_COMPONENTS_CSS,
  );
  await writeAlways(path.join(cwd, 'iris', 'design', 'components', 'base.js'), BASE_COMPONENTS_JS);
  await refreshProjectPlaceholders(cwd);

  const tasksPath = path.join(cwd, '.vscode', 'tasks.json');
  let existing: { version?: string; tasks?: unknown[] } = {};
  if (existsSync(tasksPath)) {
    try {
      existing = JSON.parse(await readFile(tasksPath, 'utf8')) as typeof existing;
    } catch (error) {
      throw new IrisError(
        1,
        `Cannot update ${path.relative(cwd, tasksPath)}: ${(error as Error).message}`,
      );
    }
  }

  const tasks = Array.isArray(existing.tasks)
    ? existing.tasks.filter(
        (task) =>
          !task ||
          typeof task !== 'object' ||
          (task as { label?: string }).label !== MANAGED_TASK_LABEL,
      )
    : [];
  tasks.push({
    label: MANAGED_TASK_LABEL,
    type: 'shell',
    command: 'iris open',
    problemMatcher: [],
  });
  await writeAlways(
    tasksPath,
    `${JSON.stringify({ ...existing, version: '2.0.0', tasks }, null, 2)}\n`,
  );
}

export async function runSyncCommand(cwd: string): Promise<void> {
  const state = await loadProjectState(cwd);
  const pageIds = await listPageIds(cwd);

  for (const id of pageIds) {
    const dataPath = path.join(cwd, 'iris', 'pages', id, 'data.json');
    if (!existsSync(dataPath)) {
      process.stdout.write(`skipped ${id}: missing data.json\n`);
      continue;
    }

    const raw = await readFile(dataPath, 'utf8');
    const dataHash = hashContent(raw);
    const prior = state.page_index[id];
    const pageHtmlPath = path.join(cwd, 'iris', 'pages', id, 'page.html');
    if (!prior || prior.data_hash !== dataHash || !existsSync(pageHtmlPath)) {
      await runRenderCommand(cwd, id);
      state.page_index[id] = { ...(await pageRegistryEntry(cwd, id)), source: prior?.source };
      state.content_hashes[`pages/${id}/data.json`] = dataHash;
      process.stdout.write(`refreshed ${id}\n`);
    } else {
      process.stdout.write(`unchanged ${id}\n`);
    }
  }

  for (const [id, entry] of Object.entries(state.page_index)) {
    if (entry.status === 'archived' || !entry.source) continue;
    const sourcePath = path.join(cwd, entry.source.path);
    if (!existsSync(sourcePath)) {
      entry.status = 'stale';
      process.stdout.write(`stale ${id}: source removed\n`);
      continue;
    }
    const sourceHash = hashContent(await readFile(sourcePath, 'utf8'));
    if (sourceHash !== entry.source.hash) {
      entry.status = 'stale';
      process.stdout.write(`stale ${id}: source changed\n`);
    }
  }

  await saveProjectState(cwd, state);
  await refreshDashboard(cwd);
}

export async function runAdoptCommand(cwd: string): Promise<void> {
  const state = await loadProjectState(cwd);
  const markdownFiles = await listMarkdownFiles(cwd);
  if (markdownFiles.length === 0) {
    throw new IrisError(1, 'No README.md or docs markdown files found to adopt');
  }

  for (const relativePath of markdownFiles) {
    const markdown = await readFile(path.join(cwd, relativePath), 'utf8');
    const id = markdownId(relativePath);
    const sourceHash = hashContent(markdown);
    const prior = state.page_index[id];
    const priorDataPath = path.join(cwd, 'iris', 'pages', id, 'data.json');
    if (prior?.source?.hash === sourceHash && existsSync(priorDataPath)) {
      process.stdout.write(`unchanged adopted source ${relativePath}\n`);
      continue;
    }
    const now = new Date().toISOString();
    const report = {
      iris: '1',
      type: 'report',
      id,
      title: titleCase(relativePath),
      status: 'draft',
      agent: 'other',
      created:
        prior && existsSync(priorDataPath)
          ? ((JSON.parse(await readFile(priorDataPath, 'utf8')) as { created?: string }).created ??
            now)
          : now,
      updated: now,
      commit: '0'.repeat(40),
      tags: ['report', 'adopted-doc'],
      sections: {
        summary: [`Read-only mirror of ${relativePath}`, `Source: ${relativePath}`],
        open_items: { md: markdown },
        promotable_as: [],
      },
    };
    const dataPath = path.join(cwd, 'iris', 'pages', id, 'data.json');
    await validateContract('report', report, dataPath);
    await writeAlways(dataPath, `${JSON.stringify(report, null, 2)}\n`);
    const dataHash = hashContent(await readFile(dataPath, 'utf8'));
    state.page_index[id] = {
      id,
      type: 'report',
      title: report.title,
      status: 'active',
      data_hash: dataHash,
      source: { kind: 'markdown', path: relativePath, hash: sourceHash },
    };
    state.content_hashes[relativePath] = sourceHash;
    state.content_hashes[`pages/${id}/data.json`] = dataHash;
    process.stdout.write(`adopted ${relativePath} as ${id}\n`);
  }

  await saveProjectState(cwd, state);
  await runRenderCommand(cwd);
}

export async function runArchiveCommand(cwd: string, id?: string): Promise<void> {
  if (!id) throw new IrisError(1, "Missing id for command 'archive'");
  const state = await loadProjectState(cwd);
  const source = path.join(cwd, 'iris', 'pages', id);
  const destination = path.join(cwd, 'iris', 'archive', id);
  if (!existsSync(source)) throw new IrisError(1, `Page '${id}' does not exist`);
  if (existsSync(destination))
    throw new IrisError(1, `Archive destination already exists for page '${id}'`);

  await rename(source, destination);
  const prior = state.page_index[id];
  state.page_index[id] = {
    id,
    type: prior?.type ?? 'page',
    title: prior?.title ?? id,
    status: 'archived',
    data_hash: prior?.data_hash,
    source: prior?.source,
  };
  await saveProjectState(cwd, state);
  await runRenderCommand(cwd);
  process.stdout.write(`archived ${id}\n`);
}

export async function runUpdateCommand(cwd: string): Promise<void> {
  await loadProjectState(cwd);
  await updateManagedSurfaces(cwd);
  await refreshDashboard(cwd);
  process.stdout.write('updated managed iris surfaces; preserved user-owned task entries\n');
}
