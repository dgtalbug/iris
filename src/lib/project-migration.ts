import { lstat, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import {
  hashContent,
  loadProjectStateForMigration,
  saveProjectState,
  type LegacyPageRegistryEntry,
  type ProjectState,
} from './project-state.js';

const PAGE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ProjectMigrationResult = {
  state: ProjectState;
  removed: string[];
  preserved: string[];
};

function safeMarkdownSource(sourcePath: string): boolean {
  const posix = sourcePath.replaceAll('\\', '/');
  if (path.posix.isAbsolute(posix) || path.posix.normalize(posix) !== posix || posix.includes('\0')) {
    return false;
  }
  return posix === 'README.md' || /^docs\/(?:[^/]+\/)*[^/]+\.md$/i.test(posix);
}

function isConfined(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative !== '' &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function isProvenGeneratedPage(
  cwd: string,
  id: string,
  entry: LegacyPageRegistryEntry,
  contentHashes: Record<string, string>,
): Promise<boolean> {
  if (
    entry.status === 'archived' ||
    !PAGE_ID.test(id) ||
    entry.id !== id ||
    entry.source?.kind !== 'markdown' ||
    !safeMarkdownSource(entry.source.path) ||
    typeof entry.data_hash !== 'string'
  ) {
    return false;
  }

  const pagesRoot = path.resolve(cwd, 'iris', 'pages');
  const pageRoot = path.resolve(pagesRoot, id);
  const dataPath = path.resolve(pageRoot, 'data.json');
  if (!isConfined(pagesRoot, pageRoot) || !isConfined(pageRoot, dataPath)) return false;

  try {
    const [pageStat, dataStat] = await Promise.all([lstat(pageRoot), lstat(dataPath)]);
    if (
      !pageStat.isDirectory() ||
      pageStat.isSymbolicLink() ||
      !dataStat.isFile() ||
      dataStat.isSymbolicLink()
    ) {
      return false;
    }
    const raw = await readFile(dataPath, 'utf8');
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const tags = Array.isArray(payload.tags) ? payload.tags : [];
    const digest = hashContent(raw);
    return (
      payload.id === id &&
      tags.includes('adopted-doc') &&
      entry.data_hash === digest &&
      contentHashes[`pages/${id}/data.json`] === digest
    );
  } catch {
    return false;
  }
}

export async function migrateProjectState(cwd: string): Promise<ProjectMigrationResult> {
  const loaded = await loadProjectStateForMigration(cwd);
  if (!loaded.legacy) {
    await saveProjectState(cwd, loaded.state);
    return { state: loaded.state, removed: [], preserved: [] };
  }

  const removed: string[] = [];
  const preserved: string[] = [];
  for (const [id, entry] of Object.entries(loaded.legacy.page_index)) {
    if (entry.status === 'archived' || entry.source?.kind !== 'markdown') continue;
    if (await isProvenGeneratedPage(cwd, id, entry, loaded.legacy.content_hashes)) {
      await rm(path.resolve(cwd, 'iris', 'pages', id), { recursive: true, force: false });
      delete loaded.state.page_index[id];
      removed.push(id);
    } else {
      preserved.push(id);
    }
  }

  await saveProjectState(cwd, loaded.state);
  return { state: loaded.state, removed, preserved };
}
