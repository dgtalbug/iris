import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { migrateProjectState } from '../src/lib/project-migration.js';
import {
  createProjectState,
  hashContent,
  loadProjectState,
  loadProjectStateForMigration,
} from '../src/lib/project-state.js';
import { projectStatePath, resolveProjectIdentity } from '../src/lib/user-config.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempProject(): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-migration-'));
  tempDirs.push(cwd);
  await mkdir(path.join(cwd, 'iris', 'pages'), { recursive: true });
  await mkdir(path.join(cwd, 'iris', 'archive'), { recursive: true });
  return cwd;
}

async function stateFilePath(cwd: string): Promise<string> {
  const identity = await resolveProjectIdentity(cwd);
  const target = projectStatePath(identity.id);
  await mkdir(path.dirname(target), { recursive: true });
  return target;
}

function adoptedData(id = 'doc-readme'): string {
  return `${JSON.stringify({ id, tags: ['report', 'adopted-doc'] }, null, 2)}\n`;
}

function legacyState(
  id: string,
  raw: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const digest = hashContent(raw);
  return {
    version: 1,
    last_synced_sha: null,
    page_index: {
      [id]: {
        id,
        type: 'report',
        title: 'README',
        status: 'active',
        data_hash: digest,
        source: { kind: 'markdown', path: 'README.md', hash: 'source-hash' },
        ...overrides,
      },
    },
    content_hashes: { [`pages/${id}/data.json`]: digest, 'README.md': 'source-hash' },
  };
}

async function writeLegacyProject(
  cwd: string,
  state: Record<string, unknown>,
  id: string,
  raw: string,
): Promise<void> {
  await mkdir(path.join(cwd, 'iris', 'pages', id), { recursive: true });
  await writeFile(path.join(cwd, 'iris', 'pages', id, 'data.json'), raw);
  const stateFile = await stateFilePath(cwd);
  await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`);
}

describe('project state migration', () => {
  it('loads normalized version 2 state and accepts legacy state for migration', async () => {
    const cwd = await tempProject();
    await writeFile(await stateFilePath(cwd), `${JSON.stringify(createProjectState(), null, 2)}\n`);
    expect(await loadProjectState(cwd)).toEqual({ version: 2, page_index: {} });

    const raw = adoptedData();
    await writeLegacyProject(cwd, legacyState('doc-readme', raw), 'doc-readme', raw);
    const loaded = await loadProjectStateForMigration(cwd);
    expect(loaded.legacy?.version).toBe(1);
    expect(loaded.state.version).toBe(2);
    expect(loaded.state.page_index['doc-readme']).not.toHaveProperty('source');
  });

  it('removes only a fully proven active generated mirror and is idempotent', async () => {
    const cwd = await tempProject();
    const raw = adoptedData();
    await writeLegacyProject(cwd, legacyState('doc-readme', raw), 'doc-readme', raw);

    const first = await migrateProjectState(cwd);
    expect(first).toMatchObject({ removed: ['doc-readme'], preserved: [] });
    expect(existsSync(path.join(cwd, 'iris', 'pages', 'doc-readme'))).toBe(false);
    expect(first.state).toEqual({ version: 2, page_index: {} });

    const second = await migrateProjectState(cwd);
    expect(second).toMatchObject({ removed: [], preserved: [], state: first.state });
  });

  it.each([
    [
      'edited data hash',
      (state: any) => (state.page_index['doc-readme'].data_hash = '0'.repeat(64)),
    ],
    ['missing provenance', (state: any) => delete state.page_index['doc-readme'].source],
    [
      'unsafe source path',
      (state: any) => (state.page_index['doc-readme'].source.path = '../README.md'),
    ],
    ['mismatched id', (state: any) => (state.page_index['doc-readme'].id = 'other')],
  ])('preserves a candidate with %s', async (_label, mutate) => {
    const cwd = await tempProject();
    const raw = adoptedData();
    const state = legacyState('doc-readme', raw);
    mutate(state);
    await writeLegacyProject(cwd, state, 'doc-readme', raw);

    const result = await migrateProjectState(cwd);
    expect(result.removed).toEqual([]);
    expect(existsSync(path.join(cwd, 'iris', 'pages', 'doc-readme', 'data.json'))).toBe(true);
  });

  it('preserves tag-only lookalikes, malformed data, and archived history', async () => {
    const cwd = await tempProject();
    const lookalikeRaw = adoptedData('doc-user');
    const malformedRaw = '{not-json';
    const archivedRaw = adoptedData('doc-archive');
    const lookalikeDigest = hashContent(lookalikeRaw);
    const malformedDigest = hashContent(malformedRaw);
    const archivedDigest = hashContent(archivedRaw);
    const state = {
      version: 1,
      last_synced_sha: null,
      page_index: {
        'doc-user': {
          id: 'doc-user',
          type: 'report',
          title: 'User',
          status: 'active',
          data_hash: lookalikeDigest,
        },
        'doc-malformed': {
          id: 'doc-malformed',
          type: 'report',
          title: 'Malformed',
          status: 'active',
          data_hash: malformedDigest,
          source: { kind: 'markdown', path: 'docs/malformed.md', hash: 'source' },
        },
        'doc-archive': {
          id: 'doc-archive',
          type: 'report',
          title: 'Archive',
          status: 'archived',
          data_hash: archivedDigest,
          source: { kind: 'markdown', path: 'docs/archive.md', hash: 'source' },
        },
      },
      content_hashes: {
        'pages/doc-user/data.json': lookalikeDigest,
        'pages/doc-malformed/data.json': malformedDigest,
        'pages/doc-archive/data.json': archivedDigest,
      },
    };
    await writeLegacyProject(cwd, state, 'doc-user', lookalikeRaw);
    await mkdir(path.join(cwd, 'iris', 'pages', 'doc-malformed'), { recursive: true });
    await writeFile(path.join(cwd, 'iris', 'pages', 'doc-malformed', 'data.json'), malformedRaw);
    await mkdir(path.join(cwd, 'iris', 'archive', 'doc-archive'), { recursive: true });
    await writeFile(path.join(cwd, 'iris', 'archive', 'doc-archive', 'data.json'), archivedRaw);

    const result = await migrateProjectState(cwd);
    expect(result.removed).toEqual([]);
    expect(result.preserved).toEqual(['doc-malformed']);
    expect(existsSync(path.join(cwd, 'iris', 'pages', 'doc-user', 'data.json'))).toBe(true);
    expect(existsSync(path.join(cwd, 'iris', 'pages', 'doc-malformed', 'data.json'))).toBe(true);
    expect(existsSync(path.join(cwd, 'iris', 'archive', 'doc-archive', 'data.json'))).toBe(true);
    expect(result.state.page_index['doc-archive'].status).toBe('archived');
  });

  it.skipIf(process.platform === 'win32')(
    'does not follow a symlinked page directory',
    async () => {
      const cwd = await tempProject();
      const outside = await mkdtemp(path.join(os.tmpdir(), 'iris-migration-outside-'));
      tempDirs.push(outside);
      const raw = adoptedData();
      await writeFile(path.join(outside, 'data.json'), raw);
      await symlink(outside, path.join(cwd, 'iris', 'pages', 'doc-readme'));
      await writeFile(
        await stateFilePath(cwd),
        `${JSON.stringify(legacyState('doc-readme', raw), null, 2)}\n`,
      );

      const result = await migrateProjectState(cwd);
      expect(result.removed).toEqual([]);
      expect(existsSync(path.join(outside, 'data.json'))).toBe(true);
    },
  );

  it('rejects unsupported state versions without rewriting the file', async () => {
    const cwd = await tempProject();
    const stateFile = await stateFilePath(cwd);
    const raw = '{"version":99,"page_index":{}}\n';
    await writeFile(stateFile, raw);
    await expect(migrateProjectState(cwd)).rejects.toThrow(/expected version 1 or 2/);
    expect(await readFile(stateFile, 'utf8')).toBe(raw);
  });
});
