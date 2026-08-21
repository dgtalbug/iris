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
  status: 'active' | 'stale' | 'archived';
  data_hash?: string;
  source?: {
    kind: 'markdown';
    path: string;
    hash: string;
  };
};

export type ProjectState = {
  version: 1;
  last_synced_sha: string | null;
  page_index: Record<string, PageRegistryEntry>;
  content_hashes: Record<string, string>;
};

export function createProjectState(): ProjectState {
  return {
    version: 1,
    last_synced_sha: null,
    page_index: {},
    content_hashes: {},
  };
}

export function statePath(cwd: string): string {
  return path.join(cwd, 'iris', 'state.json');
}

export async function loadProjectState(cwd: string): Promise<ProjectState> {
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
    throw new IrisError(1, 'Invalid iris/state.json: expected a JSON object');
  }

  const value = parsed as Partial<ProjectState>;
  if (
    !value.page_index ||
    typeof value.page_index !== 'object' ||
    !value.content_hashes ||
    typeof value.content_hashes !== 'object'
  ) {
    throw new IrisError(1, 'Invalid iris/state.json: missing page_index or content_hashes');
  }

  return {
    version: 1,
    last_synced_sha: typeof value.last_synced_sha === 'string' ? value.last_synced_sha : null,
    page_index: value.page_index,
    content_hashes: value.content_hashes,
  };
}

export async function saveProjectState(cwd: string, state: ProjectState): Promise<void> {
  await writeAlways(statePath(cwd), `${JSON.stringify(state, null, 2)}\n`);
}

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
