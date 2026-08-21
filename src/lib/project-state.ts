import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from './errors.js';
import { writeAlways } from './fs.js';

export type PageRegistryEntry = {
  id: string;
  type: string;
  title: string;
  status: 'active' | 'archived';
};

export type ProjectState = {
  version: 2;
  page_index: Record<string, PageRegistryEntry>;
};

export type LegacyPageRegistryEntry = Omit<PageRegistryEntry, 'status'> & {
  status: 'active' | 'stale' | 'archived';
  data_hash?: string;
  source?: {
    kind: 'markdown';
    path: string;
    hash: string;
  };
};

export type LegacyProjectState = {
  version: 1;
  last_synced_sha: string | null;
  page_index: Record<string, LegacyPageRegistryEntry>;
  content_hashes: Record<string, string>;
};

export type LoadedProjectState = {
  state: ProjectState;
  legacy: LegacyProjectState | null;
};

export function createProjectState(): ProjectState {
  return { version: 2, page_index: {} };
}

export function statePath(cwd: string): string {
  return path.join(cwd, 'iris', 'state.json');
}

function invalidState(message: string): never {
  throw new IrisError(1, `Invalid iris/state.json: ${message}`);
}

function normalizeEntry(id: string, value: unknown): PageRegistryEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return invalidState(`page_index.${id} must be an object`);
  }
  const entry = value as Record<string, unknown>;
  return {
    id: typeof entry.id === 'string' ? entry.id : id,
    type: typeof entry.type === 'string' ? entry.type : 'page',
    title: typeof entry.title === 'string' ? entry.title : id,
    status: entry.status === 'archived' ? 'archived' : 'active',
  };
}

function normalizeIndex(value: unknown): Record<string, PageRegistryEntry> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return invalidState('missing page_index');
  }
  return Object.fromEntries(
    Object.entries(value).map(([id, entry]) => [id, normalizeEntry(id, entry)]),
  );
}

function legacyIndex(value: unknown): Record<string, LegacyPageRegistryEntry> {
  const normalized = normalizeIndex(value);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([id, raw]) => {
      const source = raw as Record<string, unknown>;
      const legacySource = source.source as Record<string, unknown> | undefined;
      const entry: LegacyPageRegistryEntry = {
        ...normalized[id],
        status:
          source.status === 'archived'
            ? 'archived'
            : source.status === 'stale'
              ? 'stale'
              : 'active',
      };
      if (typeof source.data_hash === 'string') entry.data_hash = source.data_hash;
      if (
        legacySource?.kind === 'markdown' &&
        typeof legacySource.path === 'string' &&
        typeof legacySource.hash === 'string'
      ) {
        entry.source = {
          kind: 'markdown',
          path: legacySource.path,
          hash: legacySource.hash,
        };
      }
      return [id, entry];
    }),
  );
}

export async function loadProjectStateForMigration(cwd: string): Promise<LoadedProjectState> {
  const filePath = statePath(cwd);
  if (!existsSync(filePath)) {
    throw new IrisError(1, "iris is not initialized; run 'iris init' first");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    throw new IrisError(1, `Invalid iris/state.json: ${(error as Error).message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return invalidState('expected a JSON object');
  }

  const value = parsed as Record<string, unknown>;
  if (value.version === 2) {
    return { state: { version: 2, page_index: normalizeIndex(value.page_index) }, legacy: null };
  }
  if (value.version !== 1) return invalidState('expected version 1 or 2');
  if (
    !value.content_hashes ||
    typeof value.content_hashes !== 'object' ||
    Array.isArray(value.content_hashes)
  ) {
    return invalidState('version 1 state is missing content_hashes');
  }

  const legacy: LegacyProjectState = {
    version: 1,
    last_synced_sha: typeof value.last_synced_sha === 'string' ? value.last_synced_sha : null,
    page_index: legacyIndex(value.page_index),
    content_hashes: Object.fromEntries(
      Object.entries(value.content_hashes).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    ),
  };
  return {
    state: {
      version: 2,
      page_index: Object.fromEntries(
        Object.entries(legacy.page_index).map(([id, entry]) => [id, normalizeEntry(id, entry)]),
      ),
    },
    legacy,
  };
}

export async function loadProjectState(cwd: string): Promise<ProjectState> {
  return (await loadProjectStateForMigration(cwd)).state;
}

export async function saveProjectState(cwd: string, state: ProjectState): Promise<void> {
  await writeAlways(statePath(cwd), `${JSON.stringify(state, null, 2)}\n`);
}

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
