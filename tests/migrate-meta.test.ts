import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadProjectMeta,
  loadRegistry,
  migrateMetaToHome,
  projectSpecPath,
  projectStatePath,
  resolveProjectIdentity,
} from '../src/lib/user-config.js';

const tempDirs: string[] = [];

beforeEach(async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'iris-home-'));
  tempDirs.push(home);
  vi.stubEnv('IRIS_HOME', home);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempProject(): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-project-'));
  tempDirs.push(cwd);
  await mkdir(path.join(cwd, 'iris'), { recursive: true });
  return cwd;
}

describe('migrateMetaToHome', () => {
  it('moves state.json into the user-global home and prints one line', async () => {
    const cwd = await tempProject();
    const state = {
      version: 2,
      page_index: {
        'doc-a': { id: 'doc-a', type: 'report', title: 'A', status: 'active' },
      },
    };
    await writeFile(path.join(cwd, 'iris', 'state.json'), `${JSON.stringify(state, null, 2)}\n`);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await migrateMetaToHome(cwd);
    const identity = await resolveProjectIdentity(cwd);

    expect(result.id).toBe(identity.id);
    expect(result.movedState).toBe(true);
    expect(existsSync(path.join(cwd, 'iris', 'state.json'))).toBe(false);
    expect(JSON.parse(await readFile(projectStatePath(identity.id), 'utf8'))).toEqual(state);

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(`moved machine state to ~/.iris/projects/${identity.id}/`);

    const entries = await loadRegistry();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(identity.id);
    expect(await loadProjectMeta(identity.id)).not.toBeNull();
  });

  it('upgrades version 1 state at the new location', async () => {
    const cwd = await tempProject();
    const legacy = {
      version: 1,
      last_synced_sha: 'abc',
      page_index: {
        'doc-a': {
          id: 'doc-a',
          type: 'report',
          title: 'A',
          status: 'stale',
          data_hash: 'x',
          source: { kind: 'markdown', path: 'README.md', hash: 'y' },
        },
        'doc-b': { id: 'doc-b', type: 'page', title: 'B', status: 'archived' },
      },
      content_hashes: { 'pages/doc-a/data.json': 'x' },
    };
    await writeFile(path.join(cwd, 'iris', 'state.json'), `${JSON.stringify(legacy)}\n`);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await migrateMetaToHome(cwd);

    expect(JSON.parse(await readFile(projectStatePath(result.id), 'utf8'))).toEqual({
      version: 2,
      page_index: {
        'doc-a': { id: 'doc-a', type: 'report', title: 'A', status: 'active' },
        'doc-b': { id: 'doc-b', type: 'page', title: 'B', status: 'archived' },
      },
    });
  });

  it('copies spec.json when no regenerate hook is given', async () => {
    const cwd = await tempProject();
    const spec = { generated: 'x', items: [1, 2, 3] };
    await writeFile(path.join(cwd, 'iris', 'spec.json'), `${JSON.stringify(spec)}\n`);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await migrateMetaToHome(cwd);

    expect(result.copiedSpec).toBe(true);
    expect(result.regeneratedSpec).toBe(false);
    expect(existsSync(path.join(cwd, 'iris', 'spec.json'))).toBe(false);
    expect(JSON.parse(await readFile(projectSpecPath(result.id), 'utf8'))).toEqual(spec);
  });

  it('regenerates spec.json through the hook when provided', async () => {
    const cwd = await tempProject();
    await writeFile(path.join(cwd, 'iris', 'spec.json'), '{"stale":true}\n');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const hook = vi.fn(async (hookCwd: string, destPath: string) => {
      expect(hookCwd).toBe(cwd);
      await writeFile(destPath, '{"fresh":true}\n');
    });

    const result = await migrateMetaToHome(cwd, hook);

    expect(hook).toHaveBeenCalledTimes(1);
    expect(result.regeneratedSpec).toBe(true);
    expect(result.copiedSpec).toBe(false);
    expect(existsSync(path.join(cwd, 'iris', 'spec.json'))).toBe(false);
    expect(JSON.parse(await readFile(projectSpecPath(result.id), 'utf8'))).toEqual({ fresh: true });
  });

  it('falls back to copying spec.json when the hook fails', async () => {
    const cwd = await tempProject();
    const spec = { stale: true };
    await writeFile(path.join(cwd, 'iris', 'spec.json'), `${JSON.stringify(spec)}\n`);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const hook = vi.fn(async () => {
      throw new Error('no snapshot writer');
    });

    const result = await migrateMetaToHome(cwd, hook);

    expect(hook).toHaveBeenCalledTimes(1);
    expect(result.copiedSpec).toBe(true);
    expect(result.regeneratedSpec).toBe(false);
    expect(existsSync(path.join(cwd, 'iris', 'spec.json'))).toBe(false);
    expect(JSON.parse(await readFile(projectSpecPath(result.id), 'utf8'))).toEqual(spec);
  });

  it('stays silent when there is nothing to move but still registers', async () => {
    const cwd = await tempProject();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await migrateMetaToHome(cwd);

    expect(result).toMatchObject({ movedState: false, regeneratedSpec: false, copiedSpec: false });
    expect(log).not.toHaveBeenCalled();
    expect(await loadRegistry()).toHaveLength(1);
  });

  it('is idempotent across runs', async () => {
    const cwd = await tempProject();
    await writeFile(path.join(cwd, 'iris', 'state.json'), '{"version":2,"page_index":{}}\n');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const first = await migrateMetaToHome(cwd);
    const second = await migrateMetaToHome(cwd);

    expect(log).toHaveBeenCalledTimes(1);
    expect(second.movedState).toBe(false);
    expect(second.id).toBe(first.id);
    expect(JSON.parse(await readFile(projectStatePath(first.id), 'utf8'))).toEqual({
      version: 2,
      page_index: {},
    });
    expect(await loadRegistry()).toHaveLength(1);
  });
});
